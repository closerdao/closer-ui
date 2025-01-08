import { FormEvent, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { CloserCurrencies, Price } from '../../types';
import api from '../../utils/api';
import { ErrorMessage } from '../ui';
import Button from '../ui/Button';
import { parseMessageFromError } from '../../utils/common';

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

interface ProductCheckoutFormProps {
  type: string;
  productId: string;
  onSuccess: () => void;

  cardElementClassName: string;
  buttonDisabled: boolean;
  total: Price<CloserCurrencies>;
}

const ProductCheckoutForm = ({
  type,
  productId,

  onSuccess,

  cardElementClassName,
  buttonDisabled,
  total,
}: ProductCheckoutFormProps) => {
  const t = useTranslations();

  const { user } = useAuth();

  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState<null | string>(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, token } = await stripe.createToken(cardElement);
      if (error) {
        setProcessing(false);
        setError(error.message || '');
        return;
      }
      if (!token) {
        setProcessing(false);
        setError('No token returned from Stripe.');
        return;
      }
      const createdPaymentMethod = await stripe?.createPaymentMethod({
        type: 'card',
        card: elements?.getElement(CardElement) || { token: '' },
        billing_details: {
          email: user?.email,
        },
      });

      if (createdPaymentMethod?.error) {
        setError(
          createdPaymentMethod.error.message ||
            'Payment method creation failed',
        );
        return;
      }

      const {
        data: { results: payment },
      } = await api.post('/products/payment', {
        type,
        productId,

        total,

        paymentMethod: createdPaymentMethod?.paymentMethod.id,
      });

      // 3d secure required for this payment
      if (payment.paymentIntent.status === 'requires_action') {
        try {
          const confirmationResult = await stripe?.confirmCardPayment(
            payment.paymentIntent.client_secret,
          );
          if (confirmationResult?.error) {
            setError(
              confirmationResult.error.message || 'Payment confirmation failed',
            );
          }
          if (confirmationResult?.paymentIntent?.status === 'succeeded') {
            const confirmationResponse = await api.post(
              '/products/payment/confirmation',
              {
                paymentMethod: createdPaymentMethod?.paymentMethod.id,
                paymentId: payment.paymentIntent.id,
                productId,
                token: token.id,
              },
            );

            if (confirmationResponse.status === 200) {
              if (onSuccess) {
                setProcessing(false);
                onSuccess();
              }
            }
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unknown error occurred');
          }
        }
      }

      // 3d secure NOT required for this payment
      if (payment.paymentIntent.status === 'succeeded') {
        const confirmationResponse = await api.post(
          '/products/payment/confirmation',
          {
            paymentMethod: createdPaymentMethod?.paymentMethod.id,
            paymentId: payment.paymentIntent.id,
            productId,
            token: token.id,
          },
        );
        if (confirmationResponse.status === 200) {
          if (onSuccess) {
            setProcessing(false);
            onSuccess();
          }
        }
      }
    } catch (err: unknown) {
      setProcessing(false);
      console.error(err);
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const validateCardElement = async (event: {
    empty?: boolean;
    error?: { message: string };
  }) => {
    // Listen for changes in the CardElement
    // and display any errors as the customer types their card details
    if (event.empty || event.error) {
      setSubmitDisabled(true);
    } else {
      setSubmitDisabled(false);
    }
    setError(event.error ? event.error.message : '');
  };

  const renderButtonText = () => {
    if (processing) {
      return t('checkout_processing_payment');
    }
    return t('checkout_pay');
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage error={error} />}
      <div className="card-element-container">
        <CardElement
          options={{
            ...cardStyle,
            hidePostalCode: true,
          }}
          className={`${cardElementClassName} card-element`}
          onChange={validateCardElement}
        />
      </div>

      <div className="mt-8">
        <Button
          className="booking-btn"
          isEnabled={!submitDisabled && !processing && !buttonDisabled}
        >
          {renderButtonText()}
        </Button>
      </div>
    </form>
  );
};

export default ProductCheckoutForm;
