import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
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
import PageNotFound from '../../not-found';

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

  const { STAY_BOOKING_ALLOWED_PLANS, VISITORS_GUIDE, PLATFORM_NAME } =
    useConfig();
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
    isFriendsBooking,
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
    console.log('user?.subscription?.plan=', user?.subscription?.plan);
    console.log('user.roles=', user?.roles);
    if (user) {
      setIsMember(
        STAY_BOOKING_ALLOWED_PLANS.includes(user?.subscription?.plan) ||
          user?.roles.includes('member'),
      );
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
      console.log('error=', error);
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
      console.error('error=', error);
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
      } else {
        console.log(`Could not redirect: ${status}`);
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

    console.log('booking?.friendEmails=', booking?.friendEmails);
    console.log('booking?.isFriendsBooking=', booking?.isFriendsBooking);
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
            💰 {t('friends_booking_pay_now_summary')}
          </Button>

          <Button
            onClick={handleSendToFriends}
            isEnabled={!loading && !apiLoading}
          >
            {apiLoading ? 'Sending...' : '📧 Send to friends for payment'}
          </Button>

          {emailSuccess && (
            <div className="text-green-600 text-sm font-medium">
              ✅ {t('friends_booking_checkout_sent')}
            </div>
          )}

          {emailError && (
            <div className="text-red-600 text-sm font-medium">
              ❌ {emailError}
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
    <div className="w-full max-w-screen-sm mx-auto p-8">
      <BookingBackButton onClick={goBack} name={t('buttons_back')} />
      <FriendsBookingBlock isFriendsBooking={booking?.isFriendsBooking} />
      <Heading level={1} className="pb-4 mt-8">
        <span className="mr-4">📑</span>
        <span>{t('bookings_summary_step_title')}</span>
      </Heading>
      {handleNextError && <div className="error-box">{handleNextError}</div>}
      <ProgressBar steps={BOOKING_STEPS} />
      {booking && (
        <div className="mt-16 flex flex-col gap-16">
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
          <SummaryCosts
            utilityFiat={utilityFiat}
            rentalFiat={rentalFiat}
            foodFiat={foodFiat}
            useTokens={useTokens || false}
            useCredits={useCredits || false}
            accomodationCost={useTokens ? rentalToken : rentalFiat}
            totalToken={rentalToken || { val: 0, cur: CloserCurrencies.EUR }}
            creditsPrice={(dailyRentalToken?.val || 0) * (duration || 0)}
            totalFiat={total || { val: 0, cur: CloserCurrencies.EUR }}
            eventCost={eventFiat}
            isFoodIncluded={Boolean(booking?.foodOptionId)}
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
    console.log('Error', err);
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
