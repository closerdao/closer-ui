import { useRouter } from 'next/router';

import { FormEvent, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';

import { Button, ErrorMessage, SubscriptionConditions } from 'closer';
import { __ } from 'closer/utils/helpers';
import axios from 'axios';

interface SubscriptionCheckoutFormProps {
  userEmail?: string;
  priceId: string | string[] | undefined;
}

function SubscriptionCheckoutForm({
  userEmail,
  priceId,
}: SubscriptionCheckoutFormProps) {
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(true);
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAcceptedConditions, setHasAcceptedConditions] = useState(false);

  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const validateCardElement = (event: StripeCardElementChangeEvent) => {
    if (event.error) {
      setError(event.error);
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

  const createSubscription = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      // const response = await api.post('/subscription', {
      //   email: userEmail,
      //   paymentMethod: createdPaymentMethod?.paymentMethod.id,
      //   priceId,
      // });

      const response = await axios.post('/api/create-subscription', {
        email: userEmail,
        paymentMethod: createdPaymentMethod?.paymentMethod.id,
        priceId,
      });

      if (response.data.results.status === 'active') {
        router.push(
          `/subscriptions/success?subscriptionId=${response.data.results.subscription}&priceId=${priceId}`,
        );
      }
    } catch (err) {
      console.log(err);
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
      {typeof error === 'object' && <ErrorMessage error={error} />}

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
