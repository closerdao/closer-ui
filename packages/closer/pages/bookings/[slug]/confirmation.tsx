import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

import { ParsedUrlQuery } from 'querystring';

import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { BaseBookingParams, Booking } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

interface Props extends BaseBookingParams {
  booking: Booking;
  error?: string;
}

const ConfirmationStep = ({ error, booking }: Props) => {
  const router = useRouter();

  useEffect(() => {
    if (!booking._id) {
      startNewBooking();
    }
  }, [booking._id]);

  useEffect(() => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      startNewBooking();
    }
  }, [booking.status]);

  const viewBooking = (id: string) => {
    router.push(`/bookings/${id}`);
  };
  const startNewBooking = () => {
    router.push('/bookings/create');
  };

  const goBack = () => {
    router.push('/');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  if (!booking._id) {
    return null;
  }

  return (
    <>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🎊</span>
          <span>{__('bookings_confirmation_step_success')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          {booking && booking.status === 'pending' && (
            <h2 className="text-2xl leading-10 font-normal">
              <span className="mr-1">🏡</span>
              <span>{__('bookings_confirmation_step_success_subtitle')}</span>
            </h2>
          )}

          {booking && booking.status === 'confirmed' && (
            <h2 className="text-2xl leading-10 font-normal">
              <span className="mr-1">🏡</span>
              <span>
                {__('bookings_title_confirmed')}{' '}
                {__('bookings_title_confirmed_see_you_on')}{' '}
                {new Date(booking.start).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </h2>
          )}
     
          {!booking?.volunteer && (
            <p className="font-black uppercase">
              {__(
                'bookings_confirmation_step_success_your_application_id',
                booking._id,
              )}
            </p>
          )}
          {booking?.volunteer && (
            <p className="font-black uppercase">
              {__(
                'bookings_confirmation_step_success_your_application_id',
                booking._id,
              )}
            </p>
          )}
          {booking && booking.status === 'pending' && !booking?.volunteer && (
            <div>
              <p className="mb-4">
                {__('bookings_confirmation_step_success_what_happen_next')}
              </p>
              <p>
                {__(
                  'bookings_confirmation_step_success_when_payment_processed',
                )}
              </p>
            </div>
          )}

          

          <Button onClick={() => viewBooking(booking._id)}>
            {__('bookings_confirmation_step_success_button')}
          </Button>
        </div>
      </div>
    </>
  );
};

ConfirmationStep.getInitialProps = async ({
  query,
}: {
  query: ParsedUrlQuery;
}) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);

    return { booking, error: null };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
    };
  }
};

export default ConfirmationStep;
