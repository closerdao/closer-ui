import { useRouter } from 'next/router';

import { FormEvent, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';

import { useTranslations } from 'next-intl';

import { CloserCurrencies } from '../../types';
import api from '../../utils/api';
import WalletPayButton, { WalletPayComplete } from '../WalletPayButton';
import { Button, ErrorMessage } from '../ui';

interface Props {
  userEmail?: string;
  credits?: number;
  /** Price of the credits in major units, charged as-is by the wallet sheet. */
  total?: number;
}

function CreditsCheckoutForm({ userEmail, credits, total = 0 }: Props) {
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

  const confirmWithBackend = async (
    paymentMethodId: string,
    paymentId: string,
  ) => {
    const confirmationResponse = await api.post('/credits/payment/confirmation', {
      paymentMethod: paymentMethodId,
      paymentId,
    });

    if (confirmationResponse.status === 200) {
      setIsLoading(false);
      onSuccess();
    }
  };

  /**
   * Buys the credits with a payment method, whoever made it — the card form
   * below or the wallet sheet above. `onReadyFor3ds` lets the wallet close its
   * sheet before a challenge is raised, since the two cannot share the screen.
   */
  const payWithPaymentMethod = async (
    paymentMethodId: string,
    onReadyFor3ds?: () => void,
  ) => {
    const {
      data: { results: payment },
    } = await api.post('/credits/payment', {
      creditsAmount: credits,
      email: userEmail,
      paymentMethod: paymentMethodId,
      currency: CloserCurrencies.EUR,
    });

    // 3d secure required for this payment
    if (payment.paymentIntent.status === 'requires_action') {
      onReadyFor3ds?.();
      const confirmationResult = await stripe?.confirmCardPayment(
        payment.paymentIntent.client_secret,
      );
      if (confirmationResult?.error) {
        setError(confirmationResult?.error);
        return false;
      }
      if (confirmationResult?.paymentIntent?.status === 'succeeded') {
        await confirmWithBackend(paymentMethodId, payment.paymentIntent.id);
        return true;
      }
      return false;
    }

    // 3d secure NOT required for this payment
    if (payment.paymentIntent.status === 'succeeded') {
      await confirmWithBackend(paymentMethodId, payment.paymentIntent.id);
      return true;
    }

    return false;
  };

  const parseError = (err: any) =>
    err?.response && err?.response.data.error
      ? err.response.data.error
      : err.message;

  const handlePay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      await payWithPaymentMethod(createdPaymentMethod?.paymentMethod.id ?? '');
    } catch (err: any) {
      console.error(err);
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletPayment = async (
    paymentMethodId: string,
    complete: WalletPayComplete,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const paid = await payWithPaymentMethod(paymentMethodId, () =>
        complete('success'),
      );
      complete(paid ? 'success' : 'fail');
    } catch (err: any) {
      complete('fail');
      console.error(err);
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay}>
      {error && <ErrorMessage error={error} />}
      <WalletPayButton
        amount={total}
        label={t('carrots_heading')}
        payerEmail={userEmail}
        isEnabled={!isLoading}
        onPaymentMethod={handleWalletPayment}
        onError={setError}
      />
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
