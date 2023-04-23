import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

import { ParsedUrlQuery } from 'querystring';

import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { BaseBookingParams, Booking, Event } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

interface Props extends BaseBookingParams {
  booking: Booking;
  error?: string;
  event?: Event;
}

const ConfirmationStep = ({ error, booking, event }: Props) => {
  const router = useRouter();

  useEffect(() => {
    if (!booking._id) {
      startNewBooking();
    }
  }, [booking._id]);

  useEffect(() => {
    if (booking.status !== 'pending' && booking.status !== 'paid') {
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
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🎊</span>
          <span>{__('bookings_confirmation_step_success')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          {booking.status === 'paid' &&
            !booking.volunteerId &&
            !booking.eventId && (
              <>
                <p className="font-bold text-3xl">
                  {__('bookings_title_confirmed')}
                </p>
                <p>{__('subscriptions_success_thank_you_message')}</p>
                <p className="uppercase font-bold">
                  {__('bookings_confirmation_step_success_your_booking_id')}
                  {booking._id}
                </p>
                <p>
                  {__('bookings_confirmation_step_success_what_happen_next')}
                </p>
                <p>
                  {__(
                    'bookings_confirmation_step_success_when_payment_processed',
                  )}
                </p>
              </>
            )}
          
          {booking.status === 'pending' &&
            !booking.volunteerId &&
            !booking.eventId && (
              <>
                <p className="font-bold text-3xl">
                  {__('bookings_title_pending')}
                </p>
                <p>{__('subscriptions_success_thank_you_message')}</p>
                <p className="uppercase font-bold">
                  {__('bookings_confirmation_step_success_your_booking_id')}
                  {booking._id}
                </p>
                <p>
                  {__('bookings_confirmation_step_success_what_happen_next')}
                </p>
                <p>
                  {__(
                    'bookings_confirmation_step_success_when_payment_processed',
                  )}
                </p>
              </>
            )}

          {booking.volunteerId && (
            <>
              <p className="font-bold text-3xl">
                {__('bookings_title_application_sent')}
              </p>

              <p>{__('subscriptions_success_thank_you_message')}</p>
              <p className="font-black uppercase">
                {__(
                  'bookings_confirmation_step_success_your_application_id',
                  booking._id,
                )}
              </p>
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
            </>
          )}

          {booking.eventId && (
            <div>
              <p className="font-bold text-3xl mb-16">
                {__('bookings_confirmation_step_you_are_coming')} {event?.name}
              </p>
              <p>{__('subscriptions_success_thank_you_message')}</p>
              <p className="my-14 uppercase font-bold">
                {__('bookings_confirmation_step_success_your_booking_id')}{' '}
                {booking._id}
              </p>
              <p>{__('bookings_event_confirmation_see_you_soon')}</p>
            </div>
          )}

          {booking.volunteerId && (
            <Button onClick={() => viewBooking(booking._id)}>
              {__('bookings_confirmation_step_volunteer_application_button')}
            </Button>
          )}
          {booking.eventId && (
            <Button onClick={() => viewBooking(booking._id)}>
              {__('ticket_list_view_ticket')}
            </Button>
          )}

          {!booking.eventId && !booking.volunteerId && (
            <Button onClick={() => viewBooking(booking._id)}>
              {__('bookings_confirmation_step_success_button')}
            </Button>
          )}
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

    const {
      data: { results: event },
    } = await api.get(`/event/${booking.eventId}`);

    return { booking, event, error: null };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
    };
  }
};

export default ConfirmationStep;
