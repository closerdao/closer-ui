import { useRouter } from 'next/router';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import dayjs from 'dayjs';

import config from '../config';
import { useAuth } from '../contexts/auth';
import { useBookingActions } from '../contexts/booking';
import { useBookingSmartContract } from '../hooks/useBookingSmartContract';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import CheckoutForm from './CheckoutForm';

const stripe = loadStripe(config.STRIPE_PUB_KEY);

export const CheckoutPayment = ({
  bookingId,
  buttonDisabled,
  useToken,
  totalToPayInFiat,
  dailyTokenValue,
  startDate,
  totalNights,
}) => {
  const bookingYear = dayjs(startDate).year();
  const bookingStartDayOfYear = dayjs(startDate).dayOfYear();
  // bookingNights below is a 2d-array in a form of
  // [[bookingYear, bookingStartDayOfYear]],
  // which means for the booking from Nov 27 to Nov 29 of 2022,
  // bookingNights will be [[2022, 331], [2022, 332], [2022, 333]]
  // where 331 is the day of year for Nov 27 and so on.
  const bookingNights = Array.from({ length: totalNights }, (_, i) => [
    bookingYear,
    bookingStartDayOfYear + i,
  ]);
  const { stakeTokens, isStaking, checkContract } = useBookingSmartContract({
    bookingNights,
  });

  const { user } = useAuth();
  const router = useRouter();
  const { saveStepData } = useBookingActions();

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
    const { stakingSuccess, error: stakingError } = await stakeTokens(
      dailyTokenValue,
    );
    const { success: isBookingMatchContract, error: nightsRejected } =
      await checkContract();

    const error = stakingError || nightsRejected;
    if (error) {
      saveStepData({
        tokenPayment: { error },
      });
      return { error, success: null };
    }
    if (stakingSuccess?.transactionId && isBookingMatchContract) {
      saveStepData({
        tokenPayment: {
          transactionId: stakingSuccess.transactionId,
          error: null,
        },
      });
      await api.patch(`/booking/${bookingId}`, {
        useToken,
        transactionId: stakingSuccess.transactionId,
      });
      return { success: true, error: null };
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
          submitButtonClassName="booking-btn mt-8"
          cardElementClassName="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
          buttonDisabled={buttonDisabled}
          prePayInTokens={useToken ? payTokens : () => null}
          isProcessingTokenPayment={isStaking}
          total={totalToPayInFiat}
          currency="EUR"
        />
      </Elements>
    </div>
  );
};
