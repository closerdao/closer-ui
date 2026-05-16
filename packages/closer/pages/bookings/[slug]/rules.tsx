import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingRules from '../../../components/BookingRules';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import { Button } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS, BOOKING_STEP_TITLE_KEYS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useRedirectPaidBookingToDetail } from '../../../hooks';
import {
  BaseBookingParams,
  BookingConfig,
  BookingRulesConfig,
} from '../../../types';
import config from '../../../configCached';
import {
  bookingGuestNightsMetricPoint,
  buildBookingAccomodationUrl,
  buildBookingDatesUrl,
  getBookingTokenCurrency,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { linkedMetricFields, logMetric } from '../../../utils/metrics';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props extends BaseBookingParams {
  error?: string;
  bookingConfig: BookingConfig | null;
  bookingRules: BookingRulesConfig | null;
  tokenCurrency: string;
}

const BookingRulesPage = ({
  error,
  bookingConfig,
  bookingRules,
  tokenCurrency,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const slugParam = router.query.slug;
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0];
  const { isAuthenticated, user } = useAuth();
  const { platform }: any = usePlatform();

  useEffect(() => {
    if (!router.isReady || !slug) return;
    void platform.booking.getOne(slug, { force: true });
  }, [router.isReady, slug, platform]);

  const booking = slug ? platform.booking.findOne(slug)?.toJS?.() ?? null : null;

  const bookingMetricFields = useMemo(
    () => linkedMetricFields('Booking', booking?._id),
    [booking?._id],
  );

  const rulesStepMetricLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!booking?._id) return;
    const idKey = String(booking._id);
    if (rulesStepMetricLoggedRef.current === idKey) return;
    rulesStepMetricLoggedRef.current = idKey;
    void logMetric({
      event: 'booking-rules-view',
      category: 'booking',
      value: 'view',
      ...bookingMetricFields,
    });
  }, [booking?._id]);

  useRedirectPaidBookingToDetail(booking);
  const [isLoading, setIsLoading] = useState(false);
  const { start, end, adults, useTokens, isFriendsBooking, _id } =
    booking || {};

  const stepUrlParams =
    start && end && booking
      ? {
          start,
          end,
          adults: adults ?? 1,
          ...(booking.children && { children: booking.children }),
          ...(booking.infants && { infants: booking.infants }),
          ...(booking.pets && { pets: booking.pets }),
          currency: useTokens ? tokenCurrency : undefined,
          ...(booking.eventId && { eventId: booking.eventId }),
          ...(booking.volunteerId && { volunteerId: booking.volunteerId }),
          ...(booking.volunteerInfo && {
            volunteerInfo: {
              ...(booking.volunteerInfo.bookingType && {
                bookingType: booking.volunteerInfo.bookingType,
              }),
              ...(booking.volunteerInfo.skills?.length && {
                skills: booking.volunteerInfo.skills,
              }),
              ...(booking.volunteerInfo.diet?.length && {
                diet: booking.volunteerInfo.diet,
              }),
              ...(booking.volunteerInfo.projectId?.length && {
                projectId: booking.volunteerInfo.projectId,
              }),
              ...(booking.volunteerInfo.suggestions && {
                suggestions: booking.volunteerInfo.suggestions,
              }),
            },
          }),
          ...(booking.isFriendsBooking && { isFriendsBooking: true }),
          ...(booking.friendEmails && { friendEmails: booking.friendEmails }),
        }
      : null;

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const hasRules =
    bookingRules?.enabled &&
    bookingRules?.elements?.length > 0 &&
    bookingRules?.elements?.some((el) => el?.title);

  const handleNext = async () => {
    setIsLoading(true);
    const metricPoint = bookingGuestNightsMetricPoint(
      booking?.duration,
      booking?.adults,
    );
    void logMetric({
      event: 'booking-rules-continue-success',
      category: 'booking',
      value: 'continue', point: metricPoint,
      ...bookingMetricFields,
    });
    try {
      await router.push(`/bookings/${booking?._id}/questions`);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    router.push(`/bookings/${booking?._id}/food`);
  };

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <div className="w-full max-w-screen-sm mx-auto p-4 md:p-8">
      <div className="relative flex items-center min-h-[2.75rem] mb-6">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} className="relative z-10" />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading level={1} className="text-2xl md:text-3xl pb-0 mt-0 text-center">
            <span>{t('booking_rules_heading')}</span>
          </Heading>
        </div>
      </div>
      <FriendsBookingBlock isFriendsBooking={booking?.isFriendsBooking} />
        <ProgressBar
          steps={BOOKING_STEPS}
          stepTitleKeys={BOOKING_STEP_TITLE_KEYS}
          stepHrefs={
            stepUrlParams
              ? [
                  buildBookingDatesUrl(stepUrlParams),
                  buildBookingAccomodationUrl(stepUrlParams),
                  `/bookings/${_id}/food`,
                  null,
                  null,
                  null,
                  null,
                ]
              : undefined
          }
        />

      <section className="flex flex-col gap-12 py-12">
        {hasRules ? (
          <BookingRules rules={bookingRules.elements} />
        ) : (
          <p className="text-foreground text-sm">
            {t('booking_rules_no_rules')}
          </p>
        )}

        <Button
          className="booking-btn"
          onClick={handleNext}
          isEnabled={!isLoading}
        >
          {t('buttons_i_agree')}
        </Button>
      </section>
    </div>
  );
};

BookingRulesPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingConfig = config.booking || null;
    const web3Config = config.web3 || null;
    const tokenCurrency = getBookingTokenCurrency(web3Config, bookingConfig);
    const bookingRules = config['booking-rules'] || null;

    return {
      error: null,
      bookingConfig,
      bookingRules,
      tokenCurrency,
    };
  } catch (err) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      bookingRules: null,
      tokenCurrency: getBookingTokenCurrency(),
    };
  }
};

export default BookingRulesPage;
