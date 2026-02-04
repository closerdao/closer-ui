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
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props extends BaseBookingParams {
  booking: Booking | null;
  error?: string;
  event: Event | null;
  bookingConfig: BookingConfig | null;
}

const CELEBRATION_DURATION_MS = 2800;
const OVERLAY_FADE_MS = 500;

const ConfirmationStep = ({ error, booking, event, bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const router = useRouter();
  const { status, _id, volunteerId, eventId } = booking || {};
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (!_id) {
      console.log('No _id');
    }
  }, [_id]);

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
    if (status !== 'paid' && status !== 'checked-in') {
      router.replace(`/bookings/${_id}/summary`);
    }
  }, [_id, status, router]);

  useEffect(() => {
    if (!_id || (status !== 'paid' && status !== 'checked-in')) return;
    const timer = setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS);
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
      <div className="max-w-screen-sm mx-auto p-8">
        <p className="mt-16 text-foreground">{t('bookings_no_bookings')}</p>
      </div>
    );
  }

  if (status !== 'paid' && status !== 'checked-in') {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        style={{
          opacity: showCelebration ? 1 : 0,
          pointerEvents: showCelebration ? 'auto' : 'none',
          transition: `opacity ${OVERLAY_FADE_MS}ms ease-out`,
        }}
      >
        <div className="confirmation-celebration__particles">
          {[...Array(24)].map((_, i) => (
            <span
              key={i}
              className="confirmation-celebration__particle"
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-success"
            style={{
              animation: showCelebration
                ? 'confirmation-check-pop 0.5s ease-out forwards'
                : 'none',
            }}
          >
            <svg
              className="h-12 w-12 text-white"
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
          <h2 className="text-center text-2xl font-semibold text-foreground">
            {t('bookings_confirmation_youre_all_set')}
          </h2>
        </div>
      </div>
      <style jsx global>{`
        @keyframes confirmation-check-pop {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .confirmation-celebration__particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .confirmation-celebration__particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          margin-left: -4px;
          margin-top: -4px;
          border-radius: 2px;
          animation: confirmation-confetti 1.8s ease-out forwards;
          opacity: 0;
        }
        .confirmation-celebration__particle:nth-child(1) {
          background: #58b741;
          --tx: 120px;
          --ty: -80px;
          --r: 180deg;
        }
        .confirmation-celebration__particle:nth-child(2) {
          background: #e4427d;
          --tx: -100px;
          --ty: -100px;
          --r: -120deg;
        }
        .confirmation-celebration__particle:nth-child(3) {
          background: #E8AB1B;
          --tx: 90px;
          --ty: 100px;
          --r: 90deg;
        }
        .confirmation-celebration__particle:nth-child(4) {
          background: #1b3bc3;
          --tx: -130px;
          --ty: 60px;
          --r: -60deg;
        }
        .confirmation-celebration__particle:nth-child(5) {
          background: #58b741;
          --tx: 0;
          --ty: -150px;
          --r: 45deg;
        }
        .confirmation-celebration__particle:nth-child(6) {
          background: #e4427d;
          --tx: 140px;
          --ty: 20px;
          --r: 200deg;
        }
        .confirmation-celebration__particle:nth-child(7) {
          background: #E8AB1B;
          --tx: -80px;
          --ty: -120px;
          --r: -90deg;
        }
        .confirmation-celebration__particle:nth-child(8) {
          background: #1b3bc3;
          --tx: -110px;
          --ty: -50px;
          --r: 120deg;
        }
        .confirmation-celebration__particle:nth-child(9) {
          background: #58b741;
          --tx: 70px;
          --ty: -130px;
          --r: -30deg;
        }
        .confirmation-celebration__particle:nth-child(10) {
          background: #e4427d;
          --tx: -70px;
          --ty: 110px;
          --r: 150deg;
        }
        .confirmation-celebration__particle:nth-child(11) {
          background: #E8AB1B;
          --tx: 110px;
          --ty: -60px;
          --r: -180deg;
        }
        .confirmation-celebration__particle:nth-child(12) {
          background: #1b3bc3;
          --tx: 50px;
          --ty: 130px;
          --r: 60deg;
        }
        .confirmation-celebration__particle:nth-child(13) {
          background: #58b741;
          --tx: -140px;
          --ty: -30px;
          --r: -150deg;
        }
        .confirmation-celebration__particle:nth-child(14) {
          background: #e4427d;
          --tx: 80px;
          --ty: 90px;
          --r: 30deg;
        }
        .confirmation-celebration__particle:nth-child(15) {
          background: #E8AB1B;
          --tx: -90px;
          --ty: 80px;
          --r: -45deg;
        }
        .confirmation-celebration__particle:nth-child(16) {
          background: #1b3bc3;
          --tx: 130px;
          --ty: -100px;
          --r: 100deg;
        }
        .confirmation-celebration__particle:nth-child(17) {
          background: #58b741;
          --tx: -50px;
          --ty: -140px;
          --r: -100deg;
        }
        .confirmation-celebration__particle:nth-child(18) {
          background: #e4427d;
          --tx: 100px;
          --ty: 70px;
          --r: 0deg;
        }
        .confirmation-celebration__particle:nth-child(19) {
          background: #E8AB1B;
          --tx: -120px;
          --ty: 100px;
          --r: 75deg;
        }
        .confirmation-celebration__particle:nth-child(20) {
          background: #1b3bc3;
          --tx: 60px;
          --ty: -110px;
          --r: -75deg;
        }
        .confirmation-celebration__particle:nth-child(21) {
          background: #58b741;
          --tx: -60px;
          --ty: -90px;
          --r: 160deg;
        }
        .confirmation-celebration__particle:nth-child(22) {
          background: #e4427d;
          --tx: 150px;
          --ty: 50px;
          --r: -160deg;
        }
        .confirmation-celebration__particle:nth-child(23) {
          background: #E8AB1B;
          --tx: -150px;
          --ty: -70px;
          --r: 40deg;
        }
        .confirmation-celebration__particle:nth-child(24) {
          background: #1b3bc3;
          --tx: 40px;
          --ty: -120px;
          --r: -40deg;
        }
        @keyframes confirmation-confetti {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) rotate(var(--r));
          }
        }
      `}</style>
      <div className="max-w-screen-sm mx-auto p-8">
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
    const booking = bookingRes?.data?.results ?? null;
    const bookingConfig = bookingConfigRes?.data?.results?.value;

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
