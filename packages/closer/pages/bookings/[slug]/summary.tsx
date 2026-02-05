import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import { IconBanknote, IconCheckCircle, IconMail, IconXCircle } from '../../../components/BookingIcons';
import Conditions from '../../../components/Conditions';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  CloserCurrencies,
  Event,
  Listing,
  PaymentConfig,
  PaymentType,
} from '../../../types';
import api from '../../../utils/api';
import { getPaymentType } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props extends BaseBookingParams {
  listing: Listing | null;
  booking: Booking | null;
  error?: string;
  event?: Event;
  bookingConfig: BookingConfig | null;
  paymentConfig: PaymentConfig | null;
}

const Summary = ({
  booking,
  listing,
  event,
  error,
  bookingConfig,
  paymentConfig,
}: Props) => {
  const t = useTranslations();

  const cancellationPolicy = bookingConfig
    ? {
        lastday: bookingConfig.cancellationPolicyLastday,
        lastweek: bookingConfig.cancellationPolicyLastweek,
        lastmonth: bookingConfig.cancellationPolicyLastmonth,
        default: bookingConfig.cancellationPolicyDefault,
      }
    : null;

  const { balanceAvailable: tokenBalanceAvailable, isWalletReady } =
    useContext(WalletState);

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { VISITORS_GUIDE } = useConfig();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const [handleNextError, setHandleNextError] = useState<string | null>(null);
  const [hasComplied, setCompliance] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [updatedBooking, setUpdatedBooking] = useState<Booking | null>(null);
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
  } = updatedBooking || booking || {};

  const isHourlyBooking = listing?.priceDuration === 'hour';

  const creditsOrTokensPricePerNight = listing?.tokenPrice?.val;
  const maxNightsToPayWithTokens =
    (creditsOrTokensPricePerNight &&
      isWalletReady &&
      creditsOrTokensPricePerNight > 0 &&
      Math.floor(tokenBalanceAvailable / creditsOrTokensPricePerNight)) ||
    0;

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

  useEffect(() => {
    const type = getPaymentType({
      useCredits: useCredits || false,
      duration: duration || 0,
      currency: useTokens ? CURRENCIES[1] : DEFAULT_CURRENCY,
      maxNightsToPayWithTokens,
      maxNightsToPayWithCredits: 0,
    });

    const processTokenPayment = (paymentType: PaymentType) => {
      if (useTokens && tokenBalanceAvailable) {
        const nights = maxNightsToPayWithTokens;
        const price = (nights || 0) * (creditsOrTokensPricePerNight || 0);
        switchToToken(nights, price, paymentType);
      }
    };

    switch (type) {
      case PaymentType.PARTIAL_TOKENS:
        {
          processTokenPayment(PaymentType.PARTIAL_TOKENS);
        }
        break;
      case PaymentType.FULL_TOKENS:
        {
          processTokenPayment(PaymentType.FULL_TOKENS);
        }
        break;
    }
  }, [tokenBalanceAvailable, useTokens]);

  const updateBooking = async ({
    useTokens,
    useCredits,
    paymentType,
    partialTokenPaymentNights,
    partialPriceInTokens,
  }: {
    useTokens: boolean;
    useCredits?: boolean;
    partialTokenPaymentNights?: number;
    partialPriceInTokens?: number;
    paymentType?: PaymentType;
  }) => {
    try {
      const res = await api.post(`/bookings/${booking?._id}/update-payment`, {
        useCredits,
        useTokens,
        isHourlyBooking,
        maxNightsToPayWithCredits: 0,
        paymentType,
        partialTokenPaymentNights,
        partialPriceInTokens,
      });
      return res.data.results;
    } catch (error) {
    }
  };

  const switchToToken = async (
    nights: number,
    price: number,
    type: PaymentType,
  ) => {
    try {
      const localUpdatedBooking = await updateBooking({
        useTokens: true,
        useCredits: false,
        partialTokenPaymentNights: nights,
        partialPriceInTokens: price,
        paymentType: type,
      });
      setUpdatedBooking(localUpdatedBooking);
    } catch (error) {
    }
  };

  const handleNext = async () => {
    setLoading(true);
    setHandleNextError(null);
    if (booking?.status === 'confirmed') {
      return router.push(`/bookings/${booking?._id}/checkout`);
    }
    try {
      const res = await api.post(`/bookings/${booking?._id}/complete`, {});
      const status = res.data.results.status;

      if (status === 'confirmed') {
        router.push(`/bookings/${booking?._id}/checkout`);
      } else if (status === 'pending') {
        router.push(`/bookings/${booking?._id}/confirmation`);
      }
    } catch (err: any) {
      setHandleNextError(err.response?.data?.error || err.message);
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
        setEmailSuccess(true);
      } else {
        setEmailSuccess(false);
        setEmailError(res.data.error);
      }
    } catch (error) {
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
        <BookingBackButton onClick={goBack} name={t('buttons_back')} className="relative z-10" />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading level={1} className="text-2xl md:text-3xl pb-0 mt-0 text-center">
            <span>{t('bookings_summary_step_title')}</span>
          </Heading>
        </div>
      </div>
      <FriendsBookingBlock isFriendsBooking={booking?.isFriendsBooking} />
      {handleNextError && <div className="error-box">{handleNextError}</div>}
      <ProgressBar
        steps={BOOKING_STEPS}
        stepHrefs={
          booking?.start && booking?.end
            ? [
                `/bookings/create/dates?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${children ? `&kids=${children}` : ''}${pets ? `&pets=${pets}` : ''}${infants ? `&infants=${infants}` : ''}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
                `/bookings/create/accomodation?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${children ? `&kids=${children}` : ''}${pets ? `&pets=${pets}` : ''}${infants ? `&infants=${infants}` : ''}${booking?.useTokens ? '&currency=TDF' : ''}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
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
          <details
            className="rounded-lg border border-neutral-dark bg-neutral-light overflow-hidden"
            open
          >
            <summary className="list-none flex flex-wrap items-center justify-end gap-2 px-4 py-2 font-medium cursor-pointer hover:bg-neutral-dark/30">
              <Link
                href={`/bookings/create/dates?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${children ? `&kids=${children}` : ''}${pets ? `&pets=${pets}` : ''}${infants ? `&infants=${infants}` : ''}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`}
                className="text-sm text-accent-dark font-medium hover:underline"
              >
                {t('generic_edit_button')}
              </Link>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <SummaryDates
                isDayTicket={booking?.isDayTicket}
                totalGuests={adults || 0}
                kids={children}
                infants={infants}
                pets={pets}
                startDate={start || ''}
                endDate={end || ''}
                listingName={listing?.name || ''}
                listingUrl={listing?.slug || ''}
                eventName={event?.name}
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
          </details>

          <details
            className="rounded-lg border border-neutral-dark bg-neutral-light overflow-hidden"
            open
          >
            <summary className="list-none flex flex-wrap items-center justify-between gap-2 px-4 py-3 font-medium cursor-pointer hover:bg-neutral-dark/30">
              <span>{t('bookings_summary_step_costs_title')}</span>
              <Link
                href={`/bookings/create/accomodation?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${children ? `&kids=${children}` : ''}${pets ? `&pets=${pets}` : ''}${infants ? `&infants=${infants}` : ''}${useTokens ? '&currency=TDF' : ''}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`}
                className="text-sm text-accent-dark font-medium hover:underline"
              >
                {t('generic_edit_button')}
              </Link>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <SummaryCosts
                hideTitle
                utilityFiat={utilityFiat}
                rentalFiat={rentalFiat}
                rentalToken={rentalToken}
                foodFiat={foodFiat}
                useTokens={useTokens || false}
                useCredits={useCredits || false}
                accomodationCost={useTokens ? rentalToken : rentalFiat}
                totalToken={rentalToken || { val: 0, cur: CloserCurrencies.EUR }}
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
              />
            </div>
          </details>

          <div>{buttonContent}</div>
        </div>
      )}
    </div>
  );
};

Summary.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;

  try {
    const [bookingRes, bookingConfigRes, paymentConfigRes, messages] =
      await Promise.all([
        api
          .get(`/booking/${query.slug}`, {
            headers: (req as NextApiRequest)?.cookies?.access_token && {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            },
          })
          .catch(() => {
            return null;
          }),
        api.get('/config/booking').catch(() => {
          return null;
        }),
        api.get('/config/payment').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;
    const paymentConfig = paymentConfigRes?.data?.results?.value;

    const [optionalEvent, optionalListing] = await Promise.all([
      booking?.eventId &&
        api.get(`/event/${booking?.eventId}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }),
      booking?.listing &&
        api.get(`/listing/${booking?.listing}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }),
    ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;

    return {
      booking,
      listing,
      event,
      error: null,
      bookingConfig,
      paymentConfig,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      bookingConfig: null,
      messages: null,
      paymentConfig: null,
    };
  }
};

export default Summary;
