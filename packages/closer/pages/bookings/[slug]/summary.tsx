import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import {
  IconBanknote,
  IconCheckCircle,
  IconMail,
  IconXCircle,
} from '../../../components/BookingIcons';
import Conditions from '../../../components/Conditions';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import BookingSurface from '../../../components/booking/bookingSurface';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import config from '../../../configCached';
import { BOOKING_STEPS, BOOKING_STEP_TITLE_KEYS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { useRedirectPaidBookingToDetail } from '../../../hooks';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  CloserCurrencies,
  Listing,
  PaymentConfig,
} from '../../../types';
import type { Event } from '../../../types/event';
import type { Stay } from '../../../types/stay';
import api from '../../../utils/api';
import {
  buildBookingAccomodationUrl,
  buildBookingDatesUrl,
  getBookingPaymentCheckoutPath,
  getBookingTokenCurrency,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { logMetricIfAuthenticated } from '../../../utils/metrics';
import {
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  isStayShapedBooking,
} from '../../../utils/stays.api';

interface Props extends BaseBookingParams {
  error?: string;
  bookingConfig: BookingConfig | null;
  paymentConfig: PaymentConfig | null;
  tokenCurrency: string;
  booking?: Booking | null;
  listing?: Listing | null;
  event?: Event | null;
}

const Summary = ({
  error,
  bookingConfig,
  paymentConfig,
  tokenCurrency,
  booking: bookingProp,
  listing: listingProp,
  event: eventProp,
}: Props) => {
  const router = useRouter();
  const { platform }: any = usePlatform();
  const slugParam = router.query.slug;
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0];

  useEffect(() => {
    if (!router.isReady || !slug) return;
    void platform.booking.getOne(slug, { force: true });
  }, [router.isReady, slug, platform]);

  const bookingFromStore = slug
    ? platform.booking.findOne(slug)?.toJS?.() ?? null
    : null;
  const booking = bookingFromStore ?? bookingProp ?? null;
  const listingFromStore = booking?.listing
    ? platform.listing.findOne(booking.listing)?.toJS?.() ?? null
    : null;
  const listing = listingProp ?? listingFromStore ?? null;
  const eventFromStore = booking?.eventId
    ? platform.event.findOne(booking.eventId)?.toJS?.() ?? null
    : null;
  const event = eventProp ?? eventFromStore ?? null;

  useEffect(() => {
    if (booking?.listing) {
      void platform.listing.getOne(booking.listing);
    }
    if (booking?.eventId) {
      void platform.event.getOne(booking.eventId);
    }
  }, [booking?.listing, booking?.eventId, platform]);

  const t = useTranslations();

  const cancellationPolicy = bookingConfig
    ? {
        lastday: bookingConfig.cancellationPolicyLastday,
        lastweek: bookingConfig.cancellationPolicyLastweek,
        lastmonth: bookingConfig.cancellationPolicyLastmonth,
        default: bookingConfig.cancellationPolicyDefault,
      }
    : null;

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { VISITORS_GUIDE } = useConfig();
  const { isAuthenticated, user } = useAuth();

  useRedirectPaidBookingToDetail(booking);

  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const [handleNextError, setHandleNextError] = useState<string | null>(null);
  const [hasComplied, setCompliance] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const onComply = (isComplete: boolean) => setCompliance(isComplete);

  const {
    utilityFiat,
    foodFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    useCredits,
    start,
    end,
    adults,
    children,
    pets,
    infants,
    eventId,
    ticketOption,
    eventFiat,
    total,
    dailyRentalToken,
    duration,
    volunteerInfo,
  } = booking || {};

  const stepUrlParams =
    start && end && booking
      ? {
          start,
          end,
          adults: adults ?? 0,
          ...(booking.children && { children: booking.children }),
          ...(booking.infants && { infants: booking.infants }),
          ...(booking.pets && { pets: booking.pets }),
          currency: booking.useTokens ? tokenCurrency : undefined,
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

  const isHourlyBooking = listing?.priceDuration === 'hour';

  const stayShaped = booking
    ? isStayShapedBooking(booking as Record<string, unknown>)
    : false;
  const stayLike = booking as unknown as Stay;
  const afterSummaryCheckoutPath = booking?._id
    ? getBookingPaymentCheckoutPath({
        bookingId: booking._id,
        stayShaped,
        status: String(booking.status ?? ''),
        paymentDelta: booking.paymentDelta,
        useTokens: Boolean(booking.useTokens),
        fiatOwed: stayShaped ? computeFiatOwed(stayLike) : 0,
        tokensOwed: stayShaped ? computeTokensOwed(stayLike) : 0,
        creditsOwed: stayShaped ? computeCreditsOwed(stayLike) : 0,
      })
    : `/bookings/${slug ?? ''}/checkout`;

  useEffect(() => {
    if (booking?.status === 'pending' || booking?.status === 'paid') {
      router.push(`/bookings/${booking?._id}`);
    }
  }, [booking?.status]);

  useEffect(() => {
    if (user) {
      setIsMember(user?.roles?.includes('member') ?? false);
    }
  }, [user]);

  const handleNext = async () => {
    setLoading(true);
    setHandleNextError(null);
    const metricPoint = Math.round(Number(duration ?? adults ?? 0)) || 0;
    if (booking?.status === 'confirmed') {
      void logMetricIfAuthenticated(user, {
        event: 'booking-summary-to-checkout',
        value: 'booking',
        point: metricPoint,
      });
      setLoading(false);
      return router.push(afterSummaryCheckoutPath);
    }
    try {
      const res = await platform.bookings.complete(booking?._id);
      const status = res.data.results.status;

      if (status === 'confirmed') {
        void logMetricIfAuthenticated(user, {
          event: 'booking-summary-complete-success',
          value: 'booking',
          point: metricPoint,
        });
        router.push(afterSummaryCheckoutPath);
      } else if (status === 'pending') {
        void logMetricIfAuthenticated(user, {
          event: 'booking-summary-pending-success',
          value: 'booking',
          point: metricPoint,
        });
        router.push(`/bookings/${booking?._id}`);
      }
    } catch (err) {
      void logMetricIfAuthenticated(user, {
        event: 'booking-summary-complete-error',
        value: 'booking',
        point: metricPoint,
      });
      setHandleNextError(parseMessageFromError(err));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    const dateFormat = 'YYYY-MM-DD';
    if (router.query.back) {
      router.push(
        `/${router.query.back}?start=${dayjs(start).format(
          dateFormat,
        )}&end=${dayjs(end).format(
          dateFormat,
        )}&adults=${adults}&useTokens=${useTokens}`,
      );
    } else {
      router.push(`/bookings/${booking?._id}/questions?goBack=true`);
    }
  };

  const handleSendToFriends = async () => {
    setEmailError(null);
    setApiLoading(true);

    try {
      const res = await api.post(`/bookings/${booking?._id}/send-to-friend`, {
        friendEmails: booking?.friendEmails,
      });

      if (res.status === 200) {
        void logMetricIfAuthenticated(user, {
          event: 'booking-friends-send-success',
          value: 'booking',
          point: Math.round(Number(duration ?? adults ?? 0)) || 0,
        });
        setEmailSuccess(true);
      } else {
        void logMetricIfAuthenticated(user, {
          event: 'booking-friends-send-error',
          value: 'booking',
          point: Math.round(Number(duration ?? adults ?? 0)) || 0,
        });
        setEmailSuccess(false);
        setEmailError(res.data.error);
      }
    } catch (error) {
      void logMetricIfAuthenticated(user, {
        event: 'booking-friends-send-error',
        value: 'booking',
        point: Math.round(Number(duration ?? adults ?? 0)) || 0,
      });
      setEmailSuccess(false);
      setEmailError(parseMessageFromError(error));
    } finally {
      setApiLoading(false);
    }
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

  let buttonContent;

  if (booking?.volunteerInfo) {
    buttonContent = (
      <section className="space-y-6">
        <Conditions
          cancellationPolicy={cancellationPolicy}
          setComply={onComply}
          visitorsGuide={VISITORS_GUIDE}
        />
        <Button
          isEnabled={hasComplied && !loading}
          className="booking-btn"
          onClick={handleNext}
        >
          {t('apply_submit_button')}
        </Button>
      </section>
    );
  } else if (eventId && event?.requireApproval) {
    buttonContent = (
      <div>
        <Button className="booking-btn" onClick={handleNext}>
          {t('buttons_booking_request')}
        </Button>
      </div>
    );
  } else if (booking?.isFriendsBooking) {
    buttonContent = (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <Button onClick={handleNext} isEnabled={!loading}>
            <span className="inline-flex items-center gap-2">
              <IconBanknote className="mr-0 shrink-0" />
              {t('friends_booking_pay_now_summary')}
            </span>
          </Button>

          <Button
            onClick={handleSendToFriends}
            isEnabled={!loading && !apiLoading}
          >
            <span className="inline-flex items-center gap-2">
              {apiLoading ? (
                'Sending...'
              ) : (
                <>
                  <IconMail className="mr-0 shrink-0" />
                  {t('friends_booking_send_to_friend_summary')}
                </>
              )}
            </span>
          </Button>

          {emailSuccess && (
            <div className="text-green-600 text-sm font-medium inline-flex items-center gap-2">
              <IconCheckCircle className="shrink-0" />
              {t('friends_booking_checkout_sent')}
            </div>
          )}

          {emailError && (
            <div className="text-red-600 text-sm font-medium inline-flex items-center gap-2">
              <IconXCircle className="shrink-0" />
              {emailError}
            </div>
          )}
        </div>
      </div>
    );
  } else if (eventId || (user && isMember)) {
    buttonContent = (
      <Button className="booking-btn" onClick={handleNext}>
        {t('buttons_checkout')}
      </Button>
    );
  } else {
    buttonContent = (
      <div>
        <Button className="booking-btn" onClick={handleNext}>
          {t('buttons_booking_request')}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-sm mx-auto p-4 md:p-8">
      <div className="relative flex items-center min-h-[2.75rem] mb-6">
        <BookingBackButton
          onClick={goBack}
          name={t('buttons_back')}
          className="relative z-10"
        />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading
            level={1}
            className="text-2xl md:text-3xl pb-0 mt-0 text-center"
          >
            <span>{t('bookings_summary_step_title')}</span>
          </Heading>
        </div>
      </div>
      <FriendsBookingBlock isFriendsBooking={booking?.isFriendsBooking} />
      {handleNextError && <div className="error-box">{handleNextError}</div>}
      <ProgressBar
        steps={BOOKING_STEPS}
        stepTitleKeys={BOOKING_STEP_TITLE_KEYS}
        stepHrefs={
          stepUrlParams
            ? [
                buildBookingDatesUrl(stepUrlParams),
                buildBookingAccomodationUrl(stepUrlParams),
                `/bookings/${booking?._id}/food`,
                `/bookings/${booking?._id}/rules`,
                `/bookings/${booking?._id}/questions`,
                null,
                null,
              ]
            : undefined
        }
      />
      {booking && (
        <div className="mt-16 flex flex-col gap-8">
          <BookingSurface
            as="details"
            tone="elevated"
            padding="none"
            open
            className="overflow-hidden [&>summary]:list-none"
          >
            <summary className="flex flex-wrap items-center justify-end gap-2 px-5 py-3 font-medium text-foreground transition-colors hover:bg-foreground/[0.04] md:px-6">
              <Link
                href={stepUrlParams ? buildBookingDatesUrl(stepUrlParams) : '#'}
                className="text-sm text-accent-dark font-medium hover:underline"
              >
                {t('generic_edit_button')}
              </Link>
            </summary>
            <div className="px-5 pb-5 pt-0 md:px-6">
              <SummaryDates
                isDayTicket={booking?.isDayTicket}
                totalGuests={adults || 0}
                kids={children}
                infants={infants}
                pets={pets}
                startDate={start || ''}
                endDate={end || ''}
                listingName={listing?.name || ''}
                listingId={listing?._id}
                eventName={event?.name}
                isFriendsBooking={Boolean(booking?.isFriendsBooking)}
                eventId={booking?.eventId}
                ticketOption={ticketOption?.name}
                priceDuration={listing?.priceDuration}
                numSpacesRequired={
                  listing?.private
                    ? Math.ceil(booking.adults / (listing?.beds || 1))
                    : booking.adults
                }
                isVolunteer={volunteerInfo?.bookingType === 'volunteer'}
              />
            </div>
          </BookingSurface>

          <BookingSurface
            as="details"
            tone="elevated"
            padding="none"
            open
            className="overflow-hidden [&>summary]:list-none"
          >
            <summary className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 font-medium text-foreground transition-colors hover:bg-foreground/[0.04] md:px-6">
              <span>{t('bookings_summary_step_costs_title')}</span>
              <Link
                href={
                  stepUrlParams
                    ? buildBookingAccomodationUrl(stepUrlParams)
                    : '#'
                }
                className="text-sm text-accent-dark font-medium hover:underline"
              >
                {t('generic_edit_button')}
              </Link>
            </summary>
            <div className="px-5 pb-5 pt-0 md:px-6">
              <SummaryCosts
                hideTitle
                utilityFiat={utilityFiat}
                rentalFiat={rentalFiat}
                rentalToken={rentalToken}
                foodFiat={foodFiat}
                useTokens={useTokens || false}
                useCredits={useCredits || false}
                accomodationCost={useTokens ? rentalToken : rentalFiat}
                totalToken={
                  rentalToken || { val: 0, cur: CloserCurrencies.EUR }
                }
                creditsPrice={(dailyRentalToken?.val || 0) * (duration || 0)}
                totalFiat={total || { val: 0, cur: CloserCurrencies.EUR }}
                eventCost={eventFiat}
                isFoodIncluded={Boolean(booking?.foodOptionId)}
                foodOptionEnabled={bookingConfig?.foodOptionEnabled}
                utilityOptionEnabled={bookingConfig?.utilityOptionEnabled}
                eventDefaultCost={
                  booking?.ticketOption?.price
                    ? booking?.ticketOption.price * booking?.adults
                    : undefined
                }
                accomodationDefaultCost={
                  (listing && listing?.fiatPrice?.val * booking?.adults) ||
                  undefined
                }
                priceDuration={listing?.priceDuration}
                vatRate={vatRate}
                numberOfUnits={booking?.numberOfUnits}
                listingPrivate={listing?.private}
                bookingAdults={booking?.adults}
                bookingChildren={booking?.children}
              />
            </div>
          </BookingSurface>

          <div>{buttonContent}</div>
        </div>
      )}
    </div>
  );
};

Summary.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingConfig = config.booking;
    const web3Config = config.web3;
    const tokenCurrency = getBookingTokenCurrency(web3Config, bookingConfig);
    const paymentConfig = config.payment;

    return {
      error: null,
      bookingConfig,
      paymentConfig,
      tokenCurrency,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      paymentConfig: null,
      tokenCurrency: getBookingTokenCurrency(),
    };
  }
};

export default Summary;
