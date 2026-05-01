import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

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
import { getConfig, getConfigValueBySlug } from '../../../utils/configCache';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import ConfirmationCelebrationOverlay, {
  CONFIRMATION_CELEBRATION_DURATION_MS,
} from '../../../components/ConfirmationCelebrationOverlay';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

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
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (status === 'paid') {
      gaEvent('booking_confirm', {
        category: 'booking',
        label: 'booking',
      });
    }
  }, [status]);

  useEffect(() => {
    if (!_id) return;
    if (status === 'open') {
      router.replace(`/bookings/${_id}/summary`);
    } else if (status === 'confirmed') {
      router.replace(`/bookings/${_id}/checkout`);
    } else if (status === 'pending') {
      router.replace(`/bookings/${_id}`);
    } else if (status !== 'paid' && status !== 'checked-in') {
      router.replace(`/bookings/${_id}/summary`);
    }
  }, [_id, status, router]);

  useEffect(() => {
    if (!_id || (status !== 'paid' && status !== 'checked-in')) return;
    const timer = setTimeout(
      () => setShowCelebration(false),
      CONFIRMATION_CELEBRATION_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [_id, status]);

  const viewBooking = (id: string) => {
    router.push(`/bookings/${id}`);
  };
  // const startNewBooking = () => {
  //   router.push('/bookings/create');
  // };

  if (error) {
    return <PageError error={error} />;
  }

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (!_id) {
    return (
      <div className="max-w-screen-sm mx-auto p-4 md:p-8">
        <p className="mt-16 text-foreground">{t('bookings_no_bookings')}</p>
      </div>
    );
  }

  if (status !== 'paid' && status !== 'checked-in') {
    return null;
  }

  return (
    <>
      <ConfirmationCelebrationOverlay
        show={showCelebration}
        title={t('bookings_confirmation_youre_all_set')}
      />
      <div className="max-w-screen-sm mx-auto p-4 md:p-8">
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          <div className="flex flex-col items-center gap-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success"
              aria-hidden
            >
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-center text-2xl font-semibold text-foreground">
              {t('bookings_confirmation_youre_all_set')}
            </h1>
            <p className="text-center text-foreground/90 max-w-md leading-relaxed">
              {t('bookings_confirmation_welcome_lead')}
            </p>
          </div>
          <BookingResult
            booking={booking}
            eventName={event?.name || ''}
            foodOptionEnabled={bookingConfig?.foodOptionEnabled}
            utilityOptionEnabled={bookingConfig?.utilityOptionEnabled}
          />
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
    const [bookingRes, configs, messages] = await Promise.all([
      api.get(`/booking/${query.slug}`).catch(() => null),
      getConfig(api),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results ?? null;
    const bookingConfig = getConfigValueBySlug(configs, 'booking');

    const optionalEvent =
      booking?.eventId &&
      (await api.get(`/event/${booking.eventId}`).catch(() => null));
    const event = optionalEvent?.data?.results ?? null;

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
