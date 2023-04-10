import React, { useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import api from '../utils/api';
import { __ } from '../utils/helpers';
import Button from './ui/Button';

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: 'black',
      padding: '0.2rem',
      fontWeight: 'regular',
      fontFamily: 'Roobert, sans-serif',
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
  buttonDisabled,
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
  isProcessingTokenPayment = false,
  children: conditions,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  const isButtonDisabled =
    !stripe || buttonDisabled || processing || isProcessingTokenPayment;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

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
        },
      );
      if (onSuccess) {
        setProcessing(false);
        onSuccess(payment);
      }
    } catch (err) {
      setProcessing(false);
      console.error(err);
      const errorMessage =
        err.response && err.response.data.error
          ? err.response.data.error
          : err.message;
      setError(errorMessage);
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
      {error && (
        <div className="text-red-500 mb-4">
          <p>{String(error)}</p>
        </div>
      )}
      <CardElement
        options={cardStyle}
        className={cardElementClassName}
        onChange={validateCardElement}
      />
      {conditions}
      <div className="mt-8">
        <Button
          disabled={isButtonDisabled || submitDisabled}
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
