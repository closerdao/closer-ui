import { FormEvent, useEffect, useRef, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { PaymentIntent } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';

import { pollDonationSaleUntilPaid } from '../../utils/donation.helpers';
import { postDonationPaymentConfirmation } from '../../utils/donationPaymentConfirmation';
import { parseMessageFromError } from '../../utils/common';
import { logMetric } from '../../utils/metrics';
import WalletPayButton, { WalletPayComplete } from '../WalletPayButton';
import { Button, ErrorMessage } from '../ui';

interface DonateCheckoutFormProps {
  clientSecret: string;
  saleId: string;
  paymentIntentId?: string;
  userEmail?: string;
  /** Donation total in major units, charged as-is by the wallet sheet. */
  amount: number;
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
  amount,
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

  const logFailure = () => {
    void logMetric({
      event: 'donation-payment-error',
      category: 'fundraiser',
      value: 'error', point: metricAmount,
    });
  };

  const logSuccess = () => {
    void logMetric({
      event: 'donation-payment-success',
      category: 'fundraiser',
      value: 'success', point: metricAmount,
    });
  };

  /**
   * Turns a confirmed intent into a paid sale. The backend usually books the
   * donation the moment we tell it the intent id, and falls back to polling
   * for the webhook when that call does not land.
   */
  const settlePayment = async (paymentIntent?: PaymentIntent | null) => {
    if (
      paymentIntent?.status &&
      paymentIntent.status !== 'succeeded' &&
      paymentIntent.status !== 'processing'
    ) {
      logFailure();
      setError(t('donate_card_stripe_unexpected_status'));
      return;
    }

    const piId = paymentIntent?.id || paymentIntentId;
    if (!piId) {
      logFailure();
      setError(t('donate_card_stripe_unexpected_status'));
      return;
    }

    setPollHint(t('donate_card_finalizing'));
    try {
      await postDonationPaymentConfirmation(piId, saleId);
      logSuccess();
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
        logSuccess();
        onPaid();
        return;
      }
      if (isMountedRef.current && !ac.signal.aborted) {
        logFailure();
        setError(parseMessageFromError(confirmErr));
      }
    }
  };

  const startPayment = () => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    setError(null);
    setPollHint(null);
    setIsLoading(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startPayment();

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
        logFailure();
        setError(stripeError.message || t('donate_card_stripe_error'));
        return;
      }

      await settlePayment(paymentIntent);
    } catch (err: unknown) {
      if (isMountedRef.current) {
        logFailure();
        setError(parseMessageFromError(err));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Apple Pay hands us a payment method for the same intent the card form pays.
   * The sheet has to come down before a 3DS challenge can be shown, so the
   * first confirmation is asked not to act on one — we close the sheet, then
   * run the challenge ourselves.
   */
  const handleWalletPayment = async (
    paymentMethodId: string,
    complete: WalletPayComplete,
  ) => {
    startPayment();
    try {
      if (!stripe) {
        complete('fail');
        throw new Error('Stripe not initialized');
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: paymentMethodId },
          { handleActions: false },
        );

      if (stripeError) {
        complete('fail');
        logFailure();
        setError(stripeError.message || t('donate_card_stripe_error'));
        return;
      }

      complete('success');

      let confirmedIntent = paymentIntent;
      if (confirmedIntent?.status === 'requires_action') {
        const actionResult = await stripe.confirmCardPayment(clientSecret);
        if (actionResult.error) {
          logFailure();
          setError(
            actionResult.error.message || t('donate_card_stripe_error'),
          );
          return;
        }
        confirmedIntent = actionResult.paymentIntent;
      }

      await settlePayment(confirmedIntent);
    } catch (err: unknown) {
      complete('fail');
      if (isMountedRef.current) {
        logFailure();
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
      <WalletPayButton
        amount={amount}
        label={t('donate_page_title')}
        payerEmail={userEmail}
        isEnabled={!isLoading}
        onPaymentMethod={handleWalletPayment}
        onError={setError}
      />
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
