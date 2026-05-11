import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingResult from '../../../components/BookingResult';
import ConfirmationCelebrationOverlay, {
  CONFIRMATION_CELEBRATION_DURATION_MS,
} from '../../../components/ConfirmationCelebrationOverlay';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import config from '../../../configCached';
import { usePlatform } from '../../../contexts/platform';
import { BaseBookingParams, Booking, BookingConfig } from '../../../types';
import { parseMessageFromError } from '../../../utils/common';

interface Props extends BaseBookingParams {
  error?: string;
  bookingConfig: BookingConfig | null;
  booking?: Booking | null;
}

const ConfirmationStep = ({
  error,
  bookingConfig,
  booking: bookingProp,
}: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const router = useRouter();
  const { platform }: any = usePlatform();
  const slugParam = router.query.slug;
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0];

  const [hasRequestedBooking, setHasRequestedBooking] = useState(false);
  const [fetchedBooking, setFetchedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    setHasRequestedBooking(true);
    let cancelled = false;
    void (async () => {
      const action = await platform.booking.getOne(slug, { force: true });
      if (cancelled) return;
      const payload = action?.results;
      if (!payload) return;
      const js =
        typeof payload.toJS === 'function'
          ? (payload.toJS() as Booking)
          : (payload as Booking);
      setFetchedBooking(js);
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug, platform]);

  const platformBooking = slug ? platform.booking.findOne(slug) : null;
  const fromPlatform = platformBooking?.toJS?.() as Booking | undefined;
  const resolvedBooking =
    fromPlatform ?? fetchedBooking ?? bookingProp ?? undefined;
  const { status, _id, volunteerId, eventId } = resolvedBooking || {};
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
    if (!hasRequestedBooking && !resolvedBooking) return;
    const b = resolvedBooking;
    if (!b?._id) return;
    const { status: redirectStatus, _id: redirectId } = b;
    if (
      redirectStatus === 'open' ||
      redirectStatus === 'confirmed' ||
      redirectStatus === 'pending-payment' ||
      redirectStatus === 'tokens-staked' ||
      redirectStatus === 'credits-paid'
    ) {
      // router.replace(`/bookings/${redirectId}/checkout`);
      alert(redirectStatus);
    } else if (redirectStatus === 'pending') {
      // router.replace(`/bookings/${redirectId}`);
      alert(redirectStatus);
    } else if (redirectStatus !== 'paid' && redirectStatus !== 'checked-in') {
      // router.replace(`/bookings/${redirectId}`);
      alert(redirectStatus);
    }
  }, [hasRequestedBooking, resolvedBooking, router]);

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
            booking={resolvedBooking ?? null}
            eventName=""
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
  try {
    const bookingConfig = config.booking;
    return { error: null, bookingConfig };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      };
  }
};

export default ConfirmationStep;
