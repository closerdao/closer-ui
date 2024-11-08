import { useRouter } from 'next/router';

import { useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import PropTypes from 'prop-types';

import { useBookingSmartContract } from '../hooks/useBookingSmartContract';
import { useConfig } from '../hooks/useConfig';
import api from '../utils/api';
import { payTokens } from '../utils/booking.helpers';
import { parseMessageFromError } from '../utils/common';
import CheckoutForm from './CheckoutForm';
import Conditions from './Conditions';
import { ErrorMessage } from './ui';
import HeadingRow from './ui/HeadingRow';

const stripe = loadStripe(process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY);

const CheckoutPayment = ({
  partialPriceInCredits,
  isPartialCreditsPayment,
  bookingId,
  buttonDisabled,
  useTokens,
  useCredits,
  rentalToken,
  totalToPayInFiat,
  dailyTokenValue,
  startDate,
  totalNights,
  user,
  eventId,
}) => {
  const t = useTranslations();

  const { VISITORS_GUIDE } = useConfig() || {};

  if (!process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY) {
    throw new Error('stripe key is undefined');
  }

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
  const { isStaking } = useBookingSmartContract({
    bookingNights,
  });

  const router = useRouter();
  const [hasComplied, setCompliance] = useState(false);
  const [error, setError] = useState(null);

  const onComply = (isComplete) => setCompliance(isComplete);

  const onSuccess = () => {
    router.push(
      `/bookings/${bookingId}/confirmation${
        eventId ? `?eventId=${eventId}` : ''
      }`,
    );
  };

  const payWithCredits = async () => {
    try {
      const creditsAmount = isPartialCreditsPayment
        ? partialPriceInCredits
        : rentalToken?.val;
      console.log('isPartialCreditsPayment=',isPartialCreditsPayment);
      console.log('creditsAmount=',creditsAmount);
      console.log('partialPriceInCredits=',partialPriceInCredits);
      console.log('rentalToken?.val=',rentalToken?.val);
      const res = await api.post(`/bookings/${bookingId}/credit-payment`, {
        startDate,
        creditsAmount,
        isPartialCreditsPayment,
      });
      return res;
    } catch (error) {
      setError(parseMessageFromError(error));
    }
  };

  return (
    <div>
      <HeadingRow>
        <span className="mr-2">💲</span>
        <span>{t('bookings_checkout_step_payment_title')}</span>
      </HeadingRow>

      {error && <ErrorMessage error={error} />}
      <Elements stripe={stripe}>
        <CheckoutForm
          type="booking"
          _id={bookingId}
          onSuccess={onSuccess}
          email={user.email}
          name={user.screenname}
          buttonText={t('bookings_checkout_step_payment_button')}
          submitButtonClassName="booking-btn mt-8"
          cardElementClassName="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
          buttonDisabled={buttonDisabled}
          prePayInTokens={useTokens && payTokens}
          useCredits={useCredits}
          payWithCredits={payWithCredits}
          isProcessingTokenPayment={isStaking}
          total={totalToPayInFiat.val}
          currency={totalToPayInFiat.cur}
          hasComplied={hasComplied}
          dailyTokenValue={dailyTokenValue}
          bookingNights={bookingNights}
        >
          <Conditions setComply={onComply} visitorsGuide={VISITORS_GUIDE} />
        </CheckoutForm>
      </Elements>
    </div>
  );
};

CheckoutPayment.propTypes = {
  bookingId: PropTypes.string.isRequired,
  buttonDisabled: PropTypes.bool.isRequired,
  useTokens: PropTypes.bool.isRequired,
  totalToPayInFiat: PropTypes.object.isRequired,
  dailyTokenValue: PropTypes.number.isRequired,
  start: PropTypes.string,
  totalNights: PropTypes.number.isRequired,
};

export default CheckoutPayment;
