import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingResult from '../../../components/BookingResult';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  Event,
} from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props extends BaseBookingParams {
  booking: Booking | null;
  error?: string;
  event: Event | null;
  bookingConfig: BookingConfig | null;
}

const ConfirmationStep = ({ error, booking, event, bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
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
    } else if (status === 'paid') {
      gaEvent('booking_confirm', {
        category: 'booking',
        label: 'booking',
      });
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

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  if (!_id) {
    return null;
  }

  return (
    <>
      <div className="max-w-screen-sm mx-auto p-8">
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          <BookingResult booking={booking} eventName={event?.name || ''} />
          <Button onClick={() => viewBooking(_id)}>
            {eventId
              ? t('ticket_list_view_ticket')
              : volunteerId
              ? t('bookings_confirmation_step_volunteer_application_button')
              : t('bookings_confirmation_step_success_button')}
          </Button>
        </div>
      </div>
    </>
  );
};

ConfirmationStep.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    const [bookingRes, bookingConfigRes, messages] = await Promise.all([
      api.get(`/booking/${query.slug}`).catch((err) => {
        console.error('Error fetching booking config:', err);
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;

    const optionalEvent =
      booking.eventId && (await api.get(`/event/${booking.eventId}`));
    const event = optionalEvent?.data?.results;

    return { booking, event, error: null, bookingConfig, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      bookingConfig: null,
      event: null,
      messages: null,
    };
  }
};

export default ConfirmationStep;
