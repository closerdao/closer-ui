import { useRouter } from 'next/router';

import { FormEvent } from 'react';
import { useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';

import { __ } from 'closer/utils/helpers';

import api from '../../utils/api';
import SubscriptionConditions from '../SubscriptionConditions';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';

interface SubscriptionCheckoutFormProps {
  userEmail?: string;
  priceId: string | string[] | undefined;
}

function SubscriptionCheckoutForm({
  userEmail,
  priceId,
}: SubscriptionCheckoutFormProps) {
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [comply, setComply] = useState(false);

  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  if (!stripe || !elements || !userEmail) {
    return null;
  }

  const validateCardElement = (event: StripeCardElementChangeEvent) => {
    if (event.error) {
      setErrorMessage(event.error.message);
      setSubmitDisabled(true);
    } else {
      setErrorMessage('');
      setSubmitDisabled(false);
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
    setLoading(true);
    try {
      const createdPaymentMethod = await stripe?.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement) || { token: '' },
        billing_details: {
          email: userEmail,
        },
      });

      if (createdPaymentMethod?.error) {
        console.log('Error! ', createdPaymentMethod.error.message);
        setErrorMessage(createdPaymentMethod.error.message || '');
        return;
      }

      const response = await api.post('/subscription', {
        email: userEmail,
        paymentMethod: createdPaymentMethod.paymentMethod.id,
        priceId,
      });

      console.log('response=', response.data);
      if (response.data.results.status === 'active') {
        console.log('Success! ');
        router.push(
          `/subscriptions/success?subscriptionId=${response.data.results.subscription}&priceId=${priceId}`,
        );
      }
    } catch (error) {
      const errorMessage = parseMessageFromError(error)
      setErrorMessage(errorMessage)
    } finally {
      setLoading(false);
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
      {errorMessage && <ErrorMessage>{String(errorMessage)}</ErrorMessage>}

      <div className="my-8">
        <SubscriptionConditions setComply={setComply} />
      </div>
      <Button disabled={!stripe || submitDisabled || !comply} loading={loading}>
        {__('subscriptions_checkout_pay_button')}
      </Button>
    </form>
  );
}

export default SubscriptionCheckoutForm;
