import React, { useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import api from '../utils/api';
import { __ } from '../utils/helpers';

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
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

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
      } = await api.post('/payment', {
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
      });
      if (onSuccess) {
        setProcessing(false);
        onSuccess(payment);
      }
    } catch (err) {
      setProcessing(false);
      console.log(err);
      setError(
        err.response && err.response.data.error
          ? err.response.data.error
          : err.message,
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="text-red-500 mb-4">
          <p>{String(error)}</p>
        </div>
      )}
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '20px',
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
        }}
        className="payment-card shadow-lg p-2 bg-white"
      />
      <button
        type="submit"
        className="btn-primary mt-4"
        disabled={!stripe || buttonDisabled || processing}
      >
        {processing
          ? __('checkout_processing_payment')
          : buttonText || __('checkout_pay')}
      </button>
      {cancelUrl && (
        <a href={cancelUrl} className="mt-4 ml-2">
          {__('generic_cancel')}
        </a>
      )}
    </form>
  );
};

export default CheckoutForm;
