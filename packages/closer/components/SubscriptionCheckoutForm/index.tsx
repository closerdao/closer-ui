import { useRouter } from 'next/router';

import { FormEvent, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { logMetric } from '../../utils/metrics';
import { reportIssue } from '../../utils/reporting.utils';
import { getSubscriptionSuccessUrl } from '../../utils/subscriptions.helpers';
import SubscriptionConditions from '../SubscriptionConditions';
import WalletPayButton, { WalletPayComplete } from '../WalletPayButton';
import { Button, ErrorMessage } from '../ui/';

interface SubscriptionCheckoutFormProps {
  userEmail?: string;
  priceId: string | string[] | undefined;
  monthlyCredits?: number;
  source?: string;
  successPage?: string;
  firstMonthFree?: boolean;
  /** Charged today in major units — zero on a free first month. */
  dueToday?: number;
  tierMetricEvent?: 'tier-1-first-payment' | 'tier-2-first-payment';
}

function SubscriptionCheckoutForm({
  userEmail,
  priceId,
  monthlyCredits,
  source,
  successPage,
  firstMonthFree = false,
  dueToday = 0,
  tierMetricEvent = 'tier-1-first-payment',
}: SubscriptionCheckoutFormProps) {
  const t = useTranslations();
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
        getSubscriptionSuccessUrl(successPage, {
          subscriptionId,
          priceId: Array.isArray(priceId) ? priceId[0] : priceId,
        }),
      );
    }
  };

  /**
   * Starts the subscription with a payment method, whoever made it — the card
   * form below or the wallet sheet above. `onReadyFor3ds` lets the wallet close
   * its sheet before a challenge is raised, since the two cannot share the
   * screen.
   */
  const subscribeWithPaymentMethod = async (
    paymentMethodId: string,
    onReadyFor3ds?: () => void,
  ): Promise<boolean> => {
    const response = await api.post('/subscription', {
      email: userEmail,
      paymentMethod: paymentMethodId,
      priceId,
      monthlyCredits,
    });

    const subscriptionId = response.data.results.subscription;

    const validate = async () => {
      const validationResponse = await api.post('/subscription/validation', {
        subscriptionId,
        monthlyCredits,
        paymentMethod: paymentMethodId,
      });

      if (validationResponse.data.results.status !== 'succeeded') {
        await reportIssue(
          `Error with /subscription/validation: ${parseMessageFromError(
            validationResponse.data.results.error,
          )}`,
          userEmail,
        );
        return false;
      }

      await refetchUser();

      void logMetric({
        event: tierMetricEvent,
        category: 'subscriptions',
        value: 'payment',
      });

      redirect(subscriptionId);
      return true;
    };

    // 3d secure required for this payment
    if (response.data.results.status === 'requires_action') {
      onReadyFor3ds?.();
      try {
        const confirmationResult = await stripe?.confirmCardPayment(
          response.data.results.clientSecret,
        );
        if (confirmationResult?.error) {
          await reportIssue(
            `Error with stripe?.confirmCardPayment: ${parseMessageFromError(
              confirmationResult?.error,
            )}`,
            userEmail,
          );

          setError(confirmationResult?.error);
          return false;
        }
        if (confirmationResult?.paymentIntent?.status === 'succeeded') {
          return await validate();
        }
      } catch (err) {
        await reportIssue(
          `Error with /subscription/validation: ${parseMessageFromError(err)}`,
          userEmail,
        );

        setError(err);
      }
      return false;
    }

    // 3d secure NOT required for this payment
    if (response.data.results.status === 'active') {
      return await validate();
    }

    return false;
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
        await reportIssue(
          `Error creating payment intent: ${parseMessageFromError(
            createdPaymentMethod?.error,
          )}`,
          userEmail,
        );
        setError(createdPaymentMethod.error || '');
        return;
      }

      await subscribeWithPaymentMethod(
        createdPaymentMethod?.paymentMethod.id ?? '',
      );
    } catch (err) {
      await reportIssue(
        `Error with /subscription: ${parseMessageFromError(err)}`,
        userEmail,
      );

      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletPayment = async (
    paymentMethodId: string,
    complete: WalletPayComplete,
  ) => {
    setError('');
    setIsLoading(true);
    try {
      const subscribed = await subscribeWithPaymentMethod(paymentMethodId, () =>
        complete('success'),
      );
      complete(subscribed ? 'success' : 'fail');
    } catch (err) {
      complete('fail');
      await reportIssue(
        `Error with /subscription: ${parseMessageFromError(err)}`,
        userEmail,
      );

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
      <WalletPayButton
        amount={dueToday}
        label={t('subscriptions_checkout_title')}
        payerEmail={userEmail}
        isEnabled={hasAcceptedConditions && !isLoading}
        hasCardFallback={false}
        className="mb-4"
        onPaymentMethod={handleWalletPayment}
        onError={setError}
      />
      <Button
        className="mt-3"
        isEnabled={isSubmitEnabled && hasAcceptedConditions && !isLoading}
        isLoading={isLoading}
      >
        {firstMonthFree
          ? t('subscriptions_checkout_start_free_button')
          : t('subscriptions_checkout_pay_button')}
      </Button>
    </form>
  );
}

export default SubscriptionCheckoutForm;
