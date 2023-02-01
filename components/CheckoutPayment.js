import { useRouter } from 'next/router';

import { useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import config from '../config';
import { useBookingSmartContract } from '../hooks/useBookingSmartContract';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import CheckoutForm from './CheckoutForm';
import Conditions from './Conditions';

const stripe = loadStripe(config.STRIPE_PUB_KEY);

const CheckoutPayment = ({
  bookingId,
  buttonDisabled,
  useTokens,
  totalToPayInFiat,
  dailyTokenValue,
  startDate,
  totalNights,
  user,
  settings,
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

  const router = useRouter();
  const [hasComplied, setCompliance] = useState(false);
  const onComply = (isComplete) => setCompliance(isComplete);

  const onSuccess = () => {
    router.push(`/bookings/${bookingId}/confirmation`);
  };

  const payTokens = async () => {
    const { success: stakingSuccess, error: stakingError } = await stakeTokens(
      dailyTokenValue,
    );
    const { success: isBookingMatchContract, error: nightsRejected } =
      await checkContract();

    const error = stakingError || nightsRejected;
    if (error) {
      return { error, success: null };
    }

    if (stakingSuccess?.transactionId && isBookingMatchContract) {
      await api.post(`/bookings/${bookingId}/token-payment`, {
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
          email={user.email}
          name={user.screenname}
          buttonText={__('bookings_checkout_step_payment_button')}
          submitButtonClassName="booking-btn mt-8"
          cardElementClassName="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
          buttonDisabled={buttonDisabled || !hasComplied}
          prePayInTokens={useTokens && payTokens}
          isProcessingTokenPayment={isStaking}
          total={totalToPayInFiat}
          currency="EUR"
        >
          <Conditions
            setComply={onComply}
            visitorsGuide={settings.visitorsGuide}
          />
        </CheckoutForm>
      </Elements>
    </div>
  );
};

CheckoutPayment.propTypes = {
  bookingId: PropTypes.string.isRequired,
  buttonDisabled: PropTypes.bool.isRequired,
  useTokens: PropTypes.bool.isRequired,
  totalToPayInFiat: PropTypes.number.isRequired,
  dailyTokenValue: PropTypes.number.isRequired,
  start: PropTypes.string,
  totalNights: PropTypes.number.isRequired,
  settings: PropTypes.shape({
    visitorsGuide: PropTypes.string,
  }),
};

export default CheckoutPayment;
