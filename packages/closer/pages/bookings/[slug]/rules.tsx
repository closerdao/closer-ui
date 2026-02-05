import { useRouter } from 'next/router';

import { useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingRules from '../../../components/BookingRules';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import { Button } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  BookingRulesConfig,
  Event,
  Listing,
} from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props extends BaseBookingParams {
  listing: Listing | null;
  booking: Booking | null;
  error?: string;
  event?: Event;
  bookingConfig: BookingConfig | null;
  bookingRules: BookingRulesConfig | null;
}

const BookingRulesPage = ({
  booking,
  error,
  bookingConfig,
  bookingRules,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { start, end, adults, useTokens, isFriendsBooking, _id } =
    booking || {};

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const hasRules =
    bookingRules?.enabled &&
    bookingRules?.elements?.length > 0 &&
    bookingRules?.elements?.some((el) => el?.title);

  const handleNext = async () => {
    setIsLoading(true);

    router.push(`/bookings/${booking?._id}/questions`);
    // if (event?.fields) {
    //   router.push(`/bookings/${booking?._id}/questions`);
    //   return;
    // }

    // router.push(`/bookings/${booking?._id}/summary`);
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
        stepHrefs={
          start && end
            ? [
                `/bookings/create/dates?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
                `/bookings/create/accomodation?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${useTokens ? '&currency=TDF' : ''}${isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
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
  const { query, req } = context;

  try {
    const [bookingRes, bookingConfigRes, bookingRulesRes, messages] =
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
        api.get('/config/booking-rules').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);

    const booking = bookingRes?.data?.results || null;
    const bookingConfig = bookingConfigRes?.data?.results?.value || null;
    const bookingRules = bookingRulesRes?.data?.results?.value || null;

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
      bookingRules,
      messages,
    };
  } catch (err) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      bookingConfig: null,
      bookingRules: null,
      messages: null,
    };
  }
};

export default BookingRulesPage;
