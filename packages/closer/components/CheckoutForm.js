import { useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { useTranslations } from 'next-intl';

import { useBookingSmartContract } from '../hooks/useBookingSmartContract';
import api from '../utils/api';
import { ErrorMessage } from './ui';
import Button from './ui/Button';

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
  payWithCredits,
  isProcessingTokenPayment = false,
  children: conditions,
  hasComplied,
  buttonDisabled,
  useCredits,
  dailyTokenValue,
  bookingNights,
  status,
  refetchBooking,
}) => {
  const t = useTranslations();

  const stripe = useStripe();
  const elements = useElements();
  const { stakeTokens, checkContract } = useBookingSmartContract({
    bookingNights,
  });

  const [error, setError] = useState(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    let tokenPaymentSuccessful = false;

    if (useCredits) {
      try {
        await payWithCredits();
      } catch (error) {
        setError(error);
        console.error(error);
      }
    }

    if (prePayInTokens && status !== 'tokens-staked') {
      // If we're about to attempt token payment and we have a refetch function,
      // refetch the booking first to get the latest status
      let currentStatus = status;
      if (refetchBooking) {
        const updatedBooking = await refetchBooking();
        if (updatedBooking) {
          currentStatus = updatedBooking.status;
        }
      }

      // Check if the status is now 'tokens-staked' after refetching
      if (currentStatus === 'tokens-staked') {
        tokenPaymentSuccessful = true;
      } else {
        const res = await prePayInTokens(
          _id,
          dailyTokenValue,
          stakeTokens,
          checkContract,
          currentStatus,
        );

        const { error } = res || {};
        if (error) {
          setProcessing(false);
          setError(error);
          console.error(error);
          return;
        }
        tokenPaymentSuccessful = true;
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
            if (tokenPaymentSuccessful && refetchBooking) {
              await refetchBooking();
            }
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
          if (tokenPaymentSuccessful && refetchBooking) {
            await refetchBooking();
          }
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
      if (tokenPaymentSuccessful && refetchBooking) {
        await refetchBooking();
      }
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
      return t('checkout_processing_token_payment');
    }
    if (processing) {
      return t('checkout_processing_payment');
    }
    return buttonText || t('checkout_pay');
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
      {conditions}
      <div className="mt-8">
        <Button
          className="booking-btn"
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
          {t('generic_cancel')}
        </a>
      )}
    </form>
  );
};

export default CheckoutForm;
