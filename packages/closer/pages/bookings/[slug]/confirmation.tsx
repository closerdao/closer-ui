import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingResult from '../../../components/BookingResult';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
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
  event: Event;
}

const ConfirmationStep = ({ error, booking, event }: Props) => {
  const router = useRouter();
  const { status, _id, volunteerId, eventId } = booking || {};

  useEffect(() => {
    if (!_id) {
      console.log('No _id');
      // startNewBooking();
    }
  }, [_id]);

  useEffect(() => {
    if (status !== 'pending' && status !== 'paid') {
      console.log('status not pending not paid');
      // startNewBooking();
    }
  }, [status]);

  const viewBooking = (id: string) => {
    router.push(`/bookings/${id}`);
  };
  // const startNewBooking = () => {
  //   router.push('/bookings/create');
  // };

  const goBack = () => {
    router.push('/');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  if (!_id) {
    return null;
  }

  return (
    <>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} />
        <Heading className="pb-4 mt-8">
          <span className="mr-2">🎊</span>
          <span>{__('bookings_confirmation_step_success')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          <BookingResult booking={booking} eventName={event?.name} />

          <Button onClick={() => viewBooking(_id)}>
            {eventId
              ? __('ticket_list_view_ticket')
              : volunteerId
              ? __('bookings_confirmation_step_volunteer_application_button')
              : __('bookings_confirmation_step_success_button')}
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

    const optionalEvent =
      booking.eventId && (await api.get(`/event/${booking.eventId}`));
    const event = optionalEvent?.data?.results;

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
