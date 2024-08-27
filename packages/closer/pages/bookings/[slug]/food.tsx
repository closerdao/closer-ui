import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import FoodPhotoGallery from '../../../components/FoodPhotoGallery';
import PageError from '../../../components/PageError';
import Switch from '../../../components/Switch';
import { Button, Information } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import HeadingRow from '../../../components/ui/HeadingRow';
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
  Event,
  Listing,
} from '../../../types';
import api from '../../../utils/api';
import {
  calculateFoodPrice,
  getFoodOption,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props extends BaseBookingParams {
  listing: Listing | null;
  booking: Booking | null;
  error?: string;
  event?: Event;
  bookingConfig: BookingConfig | null;
  discountCode?: string;
}

const FoodSelectionPage = ({
  booking,
  listing,
  event,
  error,
  bookingConfig,
  discountCode,
}: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const eventFoodOptionSet =
    event?.foodOption !== 'default' && event?.foodOption;

  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFood, setIsFood] = useState(Boolean(eventFoodOptionSet) || false);

  const {
    useTokens,
    start,
    end,
    adults,
    duration,
    children,
    pets,
    infants,
    eventId,
  } = booking || {};

  const foodOption = getFoodOption({ eventId, event });


  const foodPrice = calculateFoodPrice({
    foodOption: foodOption.value,
    isTeamBooking: booking?.isTeamBooking,
    isFood,
    eventId,
    adults,
    duration,
    bookingConfig,
  });

  useEffect(() => {
    if (booking?.status === 'pending' || booking?.status === 'paid') {
      router.push(`/bookings/${booking?._id}`);
    }
  }, [booking?.status]);

  const handleNext = async () => {
    try {
      setApiError(null);
      setIsLoading(true);
      await api.post(`/bookings/${booking?._id}/update-food`, {
        foodOption: isFood ? foodOption.value : 'no_food',
        discountCode,
      });

      if (event?.fields) {
        router.push(`/bookings/${booking?._id}/questions`);
        return;
      }
    } catch (err: any) {
      setApiError(err);
    } finally {
      setIsLoading(false);
    }

    router.push(
      `/bookings/${booking?._id}/summary?back=stay/${
        listing?.slug
      }&${getUrlParams()}`,
    );
  };

  const getUrlParams = () => {
    const dateFormat = 'YYYY-MM-DD HH:mm';
    const params = {
      start: dayjs(start as string).format(dateFormat),
      end: dayjs(end as string).format(dateFormat),
      adults: String(adults),
      ...(children && { kids: String(children) }),
      ...(infants && { infants: String(infants) }),
      ...(pets && { pets: String(pets) }),
      useTokens: String(booking?.useTokens),
    };
    const urlParams = new URLSearchParams(params);

    return urlParams;
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

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <div className="w-full max-w-screen-sm mx-auto p-8">
      <BookingBackButton onClick={goBack} name={t('buttons_back')} />
      <Heading level={1} className="pb-4 mt-8">
        <span className="mr-4">🥦</span>
        <span>{t('bookings_food_step_title')}</span>
      </Heading>
      {apiError && <div className="error-box">{apiError}</div>}
      <ProgressBar steps={BOOKING_STEPS} />

      <section className="flex flex-col gap-12 py-12">
        {foodOption.value !== 'no_food' && (
          <div className="flex justify-between items-center">
            <label htmlFor="food">
              {t('booking_add_food')} {foodOption.label}
            </label>
            <Switch
              disabled={eventFoodOptionSet}
              name="food"
              onChange={() => setIsFood((oldValue) => !oldValue)}
              checked={isFood}
              label=""
            />
          </div>
        )}

        <div>
          <HeadingRow>
            <span className="mr-2">💰</span>
            <span>{t('bookings_checkout_step_food_cost')}</span>
          </HeadingRow>
          <div className="flex justify-between items-top mt-3">
            <p> {t('bookings_summary_step_food_total')}</p>
            <p className="font-bold text-right">
              {booking?.isTeamBooking && 'Free for team members'} {priceFormat(foodPrice)}
            </p>
          </div>
          <p className="text-right text-xs">
            {t('bookings_summary_step_utility_description')}
          </p>
        </div>

        <div className="flex items-start gap-2 sm:items-center font-bold mt-1 sm:mt-0">
          <FoodPhotoGallery foodOption={foodOption.value} />
        </div>

        {!isFood && (
          <Information className=" hidden sm:flex">
            {t('food_no_food_disclaimer')}
          </Information>
        )}

        <Button
          className="booking-btn"
          onClick={handleNext}
          isEnabled={!isLoading}
        >
          {t('token_sale_button_continue')}
        </Button>
      </section>
    </div>
  );
};

FoodSelectionPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;

  const discountCode = query?.discountCode;

  try {
    const [bookingRes, bookingConfigRes, messages] = await Promise.all([
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

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;

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
      discountCode,
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
    };
  }
};

export default FoodSelectionPage;
