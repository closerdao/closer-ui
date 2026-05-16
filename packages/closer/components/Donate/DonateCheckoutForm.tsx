import { FormEvent, useEffect, useRef, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';

import { pollDonationSaleUntilPaid } from '../../utils/donation.helpers';
import { postDonationPaymentConfirmation } from '../../utils/donationPaymentConfirmation';
import { parseMessageFromError } from '../../utils/common';
import { logMetric } from '../../utils/metrics';
import { Button, ErrorMessage } from '../ui';

interface DonateCheckoutFormProps {
  clientSecret: string;
  saleId: string;
  paymentIntentId?: string;
  userEmail?: string;
  metricAmount?: number;
  onPaid: () => void;
}

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: 'black',
      padding: '10px 14px',
      fontWeight: 'normal',
      fontFamily: 'Barlow, sans-serif',
      '::placeholder': {
        color: '#8f8f8f',
      },
    },
    invalid: {
      color: '#9f1f42',
    },
  },
};

function DonateCheckoutForm({
  clientSecret,
  saleId,
  paymentIntentId,
  userEmail,
  metricAmount = 0,
  onPaid,
}: DonateCheckoutFormProps) {
  const t = useTranslations();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [pollHint, setPollHint] = useState<string | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      pollAbortRef.current?.abort();
      pollAbortRef.current = null;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    setError(null);
    setPollHint(null);
    setIsLoading(true);

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: userEmail ? { email: userEmail } : undefined,
          },
        },
      );

      if (stripeError) {
        void logMetric({
          event: 'donation-payment-error',
          category: 'fundraiser',
          value: 'error', point: metricAmount,
        });
        setError(stripeError.message || t('donate_card_stripe_error'));
        return;
      }

      if (
        paymentIntent?.status &&
        paymentIntent.status !== 'succeeded' &&
        paymentIntent.status !== 'processing'
      ) {
        void logMetric({
          event: 'donation-payment-error',
          category: 'fundraiser',
          value: 'error', point: metricAmount,
        });
        setError(t('donate_card_stripe_unexpected_status'));
        return;
      }

      const piId = paymentIntent?.id || paymentIntentId;
      if (!piId) {
        void logMetric({
          event: 'donation-payment-error',
          category: 'fundraiser',
          value: 'error', point: metricAmount,
        });
        setError(t('donate_card_stripe_unexpected_status'));
        return;
      }

      setPollHint(t('donate_card_finalizing'));
      try {
        await postDonationPaymentConfirmation(piId, saleId);
        void logMetric({
          event: 'donation-payment-success',
          category: 'fundraiser',
          value: 'success', point: metricAmount,
        });
        onPaid();
        return;
      } catch (confirmErr: unknown) {
        setPollHint(t('donate_card_poll_pending'));
        const ac = new AbortController();
        pollAbortRef.current = ac;
        let paid = false;
        try {
          paid = await pollDonationSaleUntilPaid(
            saleId,
            (status) => {
              if (!status || !isMountedRef.current || ac.signal.aborted) return;
              setPollHint(t('donate_poll_status', { status }));
            },
            { signal: ac.signal },
          );
        } finally {
          if (pollAbortRef.current === ac) {
            pollAbortRef.current = null;
          }
        }
        if (paid && isMountedRef.current && !ac.signal.aborted) {
          void logMetric({
            event: 'donation-payment-success',
            category: 'fundraiser',
            value: 'success', point: metricAmount,
          });
          onPaid();
          return;
        }
        if (isMountedRef.current && !ac.signal.aborted) {
          void logMetric({
            event: 'donation-payment-error',
            category: 'fundraiser',
            value: 'error', point: metricAmount,
          });
          setError(parseMessageFromError(confirmErr));
        }
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        void logMetric({
          event: 'donation-payment-error',
          category: 'fundraiser',
          value: 'error', point: metricAmount,
        });
        setError(parseMessageFromError(err));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage error={error} />}
      {pollHint && !error && (
        <p className="text-sm text-gray-600 mb-3" role="status">
          {pollHint}
        </p>
      )}
      <CardElement
        onChange={(event) => setIsSubmitEnabled(!event.empty && !event.error)}
        options={{
          ...cardStyle,
          hidePostalCode: true,
        }}
        className="w-full h-14 rounded-xl bg-neutral px-4 py-4 mb-4"
      />
      <Button isEnabled={isSubmitEnabled && !isLoading} isLoading={isLoading}>
        {isLoading ? t('checkout_processing_payment') : t('checkout_pay')}
      </Button>
    </form>
  );
}

export default DonateCheckoutForm;
