import { useRouter } from 'next/router';

import { FormEvent, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';
import SubscriptionConditions from '../SubscriptionConditions';
import { Button, ErrorMessage } from '../ui/';

interface SubscriptionCheckoutFormProps {
  userEmail?: string;
  priceId: string | string[] | undefined;
  monthlyCredits?: number;
  source?: string;
}

function SubscriptionCheckoutForm({
  userEmail,
  priceId,
  monthlyCredits,
  source,
}: SubscriptionCheckoutFormProps) {
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(true);
  const [error, setError] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAcceptedConditions, setHasAcceptedConditions] = useState(false);
  const { refetchUser } = useAuth();

  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const validateCardElement = (event: StripeCardElementChangeEvent) => {
    if (event.error) {
      setError(event.error);
      setIsSubmitEnabled(false);
    } else if (!event.complete) {
      setError('Please enter your card number.');
      setIsSubmitEnabled(false);
    } else {
      setError('');
      setIsSubmitEnabled(true);
    }
  };

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

  const redirect = (subscriptionId: string) => {
    if (source) {
      router.push(source);
    } else {
      router.push(
        `/subscriptions/success?subscriptionId=${subscriptionId}&priceId=${priceId}`,
      );
    }
  };

  const createSubscription = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
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
      const response = await api.post('/subscription', {
        email: userEmail,
        paymentMethod: createdPaymentMethod?.paymentMethod.id,
        priceId,
        monthlyCredits,
      });

      const subscriptionId = response.data.results.subscription;

      // 3d secure required for this payment
      if (response.data.results.status === 'requires_action') {
        try {
          const confirmationResult = await stripe?.confirmCardPayment(
            response.data.results.clientSecret,
          );
          if (confirmationResult?.error) {
            setError(confirmationResult?.error);
          }
          if (confirmationResult?.paymentIntent?.status === 'succeeded') {
            const validationResponse = await api.post(
              '/subscription/validation',
              {
                subscriptionId,
                monthlyCredits,
                paymentMethod: createdPaymentMethod?.paymentMethod.id,
              },
            );

            if (validationResponse.data.results.status === 'succeeded') {
              await refetchUser();
              redirect(subscriptionId);
            }
          }
        } catch (err) {
          setError(err);
        }
      }

      // 3d secure NOT required for this payment
      if (response.data.results.status === 'active') {
        const validationResponse = await api.post('/subscription/validation', {
          subscriptionId,
          monthlyCredits,
          paymentMethod: createdPaymentMethod?.paymentMethod.id,
        });

        if (validationResponse.data.results.status === 'succeeded') {
          await refetchUser();
          redirect(subscriptionId);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={createSubscription}>
      <CardElement
        data-testid="card-element"
        onChange={validateCardElement}
        options={cardElementOptions}
        className="w-full h-14 rounded-md bg-neutral px-4 py-4 mb-4"
      />
      {error && <ErrorMessage error={error} />}

      <div className="my-8">
        <SubscriptionConditions
          setHasAcceptedConditions={setHasAcceptedConditions}
        />
      </div>
      <Button
        className="mt-3"
        isEnabled={isSubmitEnabled && hasAcceptedConditions}
        isLoading={isLoading}
      >
        {__('subscriptions_checkout_pay_button')}
      </Button>
    </form>
  );
}

export default SubscriptionCheckoutForm;
