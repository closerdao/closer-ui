import { useRouter } from 'next/router';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import config from '../config';
import { useAuth } from '../contexts/auth';
import { useBookingActions, useBookingState } from '../contexts/booking';
import { useBookingSmartContract } from '../hooks/useBookingSmartContract';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import CheckoutForm from './CheckoutForm';

const stripe = loadStripe(config.STRIPE_PUB_KEY);

export const CheckoutPayment = ({
  bookingId,
  buttonDisabled,
  useToken,
  totalValueToken,
  totalValueFiat,
  dailyTokenValue,
}) => {
  const { steps } = useBookingState();
  const { saveStepData } = useBookingActions();

  const dates = steps.find((step) => step.path === '/bookings/new/dates');
  const { startDate, endDate, totalNights } = dates.data;

  const { stakeTokens, isStaking, checkBookingOnBlockchain } =
    useBookingSmartContract({
      value: totalValueToken,
      startDate,
      endDate,
      totalNights,
      dailyValue: dailyTokenValue,
    });

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
      return { error, success: null };
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

      const { isBookingMatchBlockhainState, bookedNights } =
        checkBookingOnBlockchain();

      if (isBookingMatchBlockhainState) {
        return { success: true, error: null };
      } else {
        return {
          success: false,
          error: {
            message: 'Blockchain has no records of booked nights',
            bookedNights,
          },
        };
      }
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
          prePayInTokens={useToken ? payTokens : () => {}}
          isProcessingTokenPayment={isStaking}
          total={totalValueFiat}
          currency="EUR"
        />
      </Elements>
    </div>
  );
};
