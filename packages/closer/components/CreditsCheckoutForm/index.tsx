import { useRouter } from 'next/router';

import { FormEvent, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';

import { useTranslations } from 'next-intl';

import { CloserCurrencies } from '../../types';
import api from '../../utils/api';
import { Button, ErrorMessage } from '../ui';

interface Props {
  userEmail?: string;
  credits?: number;
}

function CreditsCheckoutForm({ userEmail, credits }: Props) {
  const t = useTranslations();
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [error, setError] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
      },
      invalid: {
        color: 'rgb(239 68 68)',
      },
    },
  };

  const validateCardElement = (event: StripeCardElementChangeEvent) => {
    if (event.error) {
      setIsSubmitEnabled(false);
    } else if (!event.complete) {
      setIsSubmitEnabled(false);
    } else {
      setIsSubmitEnabled(true);
    }
  };

  const onSuccess = () => {
    router.push('/settings/credits');
  };

  const renderButtonText = () => {
    if (isLoading) {
      return t('checkout_processing_payment');
    }
    return t('checkout_pay');
  };

  const handlePay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setError(null);

    try {
      const createdPaymentMethod = await stripe?.createPaymentMethod({
        type: 'card',
        card: elements?.getElement(CardElement) || { token: '' },
        billing_details: {
          email: userEmail,
        },
      });

      if (createdPaymentMethod?.error) {
        setError(createdPaymentMethod.error || '');
        return;
      }

      const {
        data: { results: payment },
      } = await api.post('/carrots/payment', {
        creditsAmount: credits,
        email: userEmail,
        paymentMethod: createdPaymentMethod?.paymentMethod.id,
        currency: CloserCurrencies.EUR,
      });

      // 3d secure required for this payment
      if (payment.paymentIntent.status === 'requires_action') {
        try {
          const confirmationResult = await stripe?.confirmCardPayment(
            payment.paymentIntent.client_secret,
          );
          if (confirmationResult?.error) {
            setError(confirmationResult?.error);
          }
          if (confirmationResult?.paymentIntent?.status === 'succeeded') {
            const confirmationResponse = await api.post(
              '/carrots/payment/confirmation',
              {
                paymentMethod: createdPaymentMethod?.paymentMethod.id,
                paymentId: payment.paymentIntent.id,
              },
            );

            if (confirmationResponse.status === 200) {
              setIsLoading(false);
              onSuccess();
            }
          }
        } catch (err) {
          setError(err);
        }
      }

      // 3d secure NOT required for this payment
      if (payment.paymentIntent.status === 'succeeded') {
        const confirmationResponse = await api.post(
          '/carrots/payment/confirmation',
          {
            paymentMethod: createdPaymentMethod?.paymentMethod.id,
            paymentId: payment.paymentIntent.id,
          },
        );
        if (confirmationResponse.status === 200) {
          setIsLoading(false);
          onSuccess();
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error(err);
      const errorMessage =
        err?.response && err?.response.data.error
          ? err.response.data.error
          : err.message;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay}>
      {error && <ErrorMessage error={error} />}
      <CardElement
        onChange={validateCardElement}
        options={cardElementOptions}
        className="w-full h-14 rounded-md bg-neutral px-4 py-4 mb-4"
      />

      <div className="mt-8">
        <Button isEnabled={isSubmitEnabled && !isLoading} isLoading={isLoading}>
          {renderButtonText()}
        </Button>
      </div>
    </form>
  );
}

export default CreditsCheckoutForm;
