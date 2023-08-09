import { useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import api from '../utils/api';
import { __ } from '../utils/helpers';
import { ErrorMessage } from './ui';
import Button from './ui/Button';

const cardStyle = {
  style: {
    base: {
      fontSize: '18px',
      lineHeight: '1.6',
      color: 'black',
      padding: '0.2rem',
      fontWeight: 'normal',
      fontFamily: 'Barlow, sans-serif',
      minWidth: '50%',
      '::placeholder': {
        color: '#8f8f8f',
      },
    },
    invalid: {
      color: '#9f1f42',
    },
  },
};

const CheckoutForm = ({
  type,
  cancelUrl,
  ticketOption,
  _id,
  buttonText,
  email,
  name,
  message,
  fields,
  volunteer,
  total,
  currency,
  discountCode,
  onSuccess,
  cardElementClassName = '',
  prePayInTokens,
  hasAppliedCredits,
  payWithCredits,
  isProcessingTokenPayment = false,
  children: conditions,
  hasComplied,
  buttonDisabled
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (hasAppliedCredits) {
      try {
        await payWithCredits();
      } catch (error) {
        setError(error);
        console.error(error);
      } 
    }

    if (prePayInTokens) {
      const res = await prePayInTokens();
      const { error } = res || {};
      if (error) {
        setProcessing(false);
        setError('Token payment failed.');
        console.error(error);
        return;
      }
    }

    try {
      const { error, token } = await stripe.createToken(
        elements.getElement(CardElement),
      );
      if (error) {
        setProcessing(false);
        setError(error.message);
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
          email,
        },
      });

      if (createdPaymentMethod?.error) {
        setError(createdPaymentMethod.error || '');
        return;
      }

      const {
        data: { results: payment },
      } = await api.post(
        type === 'booking' ? '/bookings/payment' : '/payment',
        {
          token: token.id,
          type,
          ticketOption,
          total,
          currency,
          discountCode,
          _id,
          email,
          name,
          message,
          fields,
          volunteer,
          paymentMethod: createdPaymentMethod?.paymentMethod.id,
        },
      );

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
              '/bookings/payment/confirmation',
              {
                paymentMethod: createdPaymentMethod?.paymentMethod.id,
                paymentId: payment.paymentIntent.id,
                bookingId: _id,
                token: token.id,
              },
            );

            if (confirmationResponse.status === 200) {
              if (onSuccess) {
                setProcessing(false);
                onSuccess(payment);
              }
            }
          }
        } catch (err) {
          setError(err);
        } 
      }

      // 3d secure NOT required for this payment
      if (payment.paymentIntent.status === 'succeeded') {
        const confirmationResponse = await api.post(
          '/bookings/payment/confirmation',
          {
            paymentMethod: createdPaymentMethod?.paymentMethod.id,
            paymentId: payment.paymentIntent.id,
            bookingId: _id,
            token: token.id,
          },
        );
        if (confirmationResponse.status === 200) {
          if (onSuccess) {
            setProcessing(false);
            onSuccess(payment);
          }
        }
      }
    } catch (err) {
      setProcessing(false);
      console.error(err);
      const errorMessage =
        err.response && err.response.data.error
          ? err.response.data.error
          : err.message;
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const validateCardElement = async (event) => {
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
    if (isProcessingTokenPayment) {
      return __('checkout_processing_token_payment');
    }
    if (processing) {
      return __('checkout_processing_payment');
    }
    return buttonText || __('checkout_pay');
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage error={error} />}
      <CardElement
        options={cardStyle}
        className={cardElementClassName}
        onChange={validateCardElement}
      />
      {conditions}
      <div className="mt-8">
        <Button
          isEnabled={
           !submitDisabled && hasComplied && !processing && !buttonDisabled
          }
          isSpinnerVisible={processing || isProcessingTokenPayment}
        >
          {renderButtonText()}
        </Button>
      </div>
      {cancelUrl && (
        <a href={cancelUrl} className="mt-4 ml-2">
          {__('generic_cancel')}
        </a>
      )}
    </form>
  );
};

export default CheckoutForm;
