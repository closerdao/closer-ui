import { useRouter } from 'next/router';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import config from '../config';
import { useAuth } from '../contexts/auth';
import { useBookingActions, useBookingState } from '../contexts/booking';
import { useTokenPayment } from '../hooks/useTokenPayment';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import CheckoutForm from './CheckoutForm';

export const CheckoutPayment = ({
  bookingId,
  buttonDisabled,
  useToken,
  totalValueToken,
  totalValueFiat,
}) => {
  const { steps } = useBookingState();
  const { saveStepData } = useBookingActions();

  const dates = steps.find((step) => step.path === '/bookings/new/dates');
  const { startDate, endDate, totalNights } = dates.data;

  const { stakeTokens, isPending } = useTokenPayment({
    value: totalValueToken,
    startDate,
    endDate,
    totalNights,
  });

  const stripe = loadStripe(config.STRIPE_PUB_KEY);
  const { user } = useAuth();
  const router = useRouter();

  const onSuccess = (payment) => {
    saveStepData({
      fiatPayment: { ...payment, error: null },
    });
    router.push('/bookings/new/confirmation');
  };

  const onError = (error) => {
    saveStepData({
      fiatPayment: { error },
    });
    router.push('/bookings/new/confirmation');
  };

  const payTokens = async () => {
    const res = await stakeTokens(totalValueToken);
    const { error, success } = res;
    if (error) {
      saveStepData({
        tokenPayment: { error },
      });
    }
    if (success) {
      saveStepData({
        tokenPayment: {
          transactionId: success.transactionId,
          error: null,
        },
      });
      await api.patch(`/booking/${bookingId}`, {
        useToken,
        transactionId: success.transactionId,
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3 flex items-center">
        <span>💲</span>
        <span>{__('bookings_checkout_step_payment_title')}</span>
      </h2>
      <Elements stripe={stripe}>
        <CheckoutForm
          type="booking"
          _id={bookingId}
          onSuccess={onSuccess}
          onError={onError}
          email={user.email}
          name={user.screenname}
          buttonText={__('bookings_checkout_step_payment_button')}
          submitButtonClassName="w-full btn uppercase mt-8"
          cardElementClassName="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
          buttonDisabled={buttonDisabled}
          prePayInTokens={useToken ? payTokens : () => {}}
          isProcessingTokenPayment={isPending}
          total={totalValueFiat}
          currency="EUR"
        />
      </Elements>
    </div>
  );
};
