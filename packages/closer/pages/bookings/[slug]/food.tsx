import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import { IconBanknote, IconUtensils } from '../../../components/BookingIcons';
import FoodDescription from '../../../components/FoodDescription';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
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
import { FoodOption } from '../../../types/food';
import api from '../../../utils/api';
import { getFoodOption } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props extends BaseBookingParams {
  listing: Listing | null;
  booking: Booking | null;
  error?: string;
  event?: Event;
  bookingConfig: BookingConfig | null;
  discountCode?: string;
  foodOptions: FoodOption[];
}

const FoodSelectionPage = ({
  booking,
  event,
  error,
  bookingConfig,
  discountCode,
  foodOptions,
}: Props) => {
  const t = useTranslations();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const { useTokens, start, end, adults, eventId, isFriendsBooking } =
    booking || {};

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const eventFoodOptionSet = Boolean(event?.foodOptionId);
  const isFoodAvailable = event?.foodOptionId !== 'no_food';

  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFood, setIsFood] = useState(true);

  const foodOption = getFoodOption({ eventId, event, foodOptions });

  const foodPricePerNight =
    booking?.volunteerInfo?.bookingType === 'residence' ? 0 : foodOption?.price;

  const durationNights =
    start && end
      ? Math.max(0, dayjs(end).diff(dayjs(start), 'day'))
      : 0;
  const foodTotalForStay =
    (foodPricePerNight ?? 0) * (adults ?? 0) * durationNights;

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
        foodOptionId:
          isFood && foodOption && isFoodAvailable ? foodOption._id : null,
        discountCode,
        isDayTicket: booking?.isDayTicket,
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

    router.push(`/bookings/${booking?._id}/rules`);
  };

  const goBack = () => {
    const dateFormat = 'YYYY-MM-DD';
    router.push(
      `/bookings/create/accomodation?start=${dayjs(start).format(
        dateFormat,
      )}&end=${dayjs(end).format(
        dateFormat,
      )}&adults=${adults}&useTokens=${useTokens}${isFriendsBooking?'&isFriendsBooking=true':''}`,
    );
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
    <div className="w-full max-w-screen-sm mx-auto p-8">
      <div className="flex items-center justify-between gap-6 mb-6">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="flex items-center gap-2 flex-1 min-w-0 pb-0 mt-0">
          <IconUtensils className="!mr-0" />
          <span>{t('bookings_food_step_title')}</span>
        </Heading>
      </div>
      <FriendsBookingBlock isFriendsBooking={isFriendsBooking} />
      {apiError && <div className="error-box">{apiError}</div>}
      <ProgressBar
        steps={BOOKING_STEPS}
        stepHrefs={
          booking?.start && booking?.end
            ? [
                `/bookings/create/dates?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
                `/bookings/create/accomodation?start=${dayjs(start).format('YYYY-MM-DD')}&end=${dayjs(end).format('YYYY-MM-DD')}&adults=${adults}${useTokens ? '&currency=TDF' : ''}${booking?.isFriendsBooking ? '&isFriendsBooking=true' : ''}`,
                null,
                null,
                null,
                null,
                null,
              ]
            : undefined
        }
      />

      <section className="flex flex-col gap-12 py-12">
        {foodOption &&
          foodOption?.name !== 'no_food' &&
          !eventFoodOptionSet && (
            <div className="rounded-lg border border-neutral-dark bg-neutral-light p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label htmlFor="food" className="font-medium flex items-center min-h-6">
                  {eventFoodOptionSet
                    ? foodOption?.name
                    : t('booking_add_food') + ' ' + foodOption?.name}
                </label>
                {!eventFoodOptionSet && (
                  <div className="flex items-center gap-2 [&_.switch]:mb-0">
                    <span
                      className={`text-sm font-medium ${
                        isFood ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {isFood
                        ? `✓ ${t('bookings_food_included')}`
                        : `✗ ${t('bookings_food_not_included')}`}
                    </span>
                    <Switch
                      disabled={false}
                      name="food"
                      onChange={() => setIsFood((oldValue) => !oldValue)}
                      checked={isFood}
                      label=""
                    />
                  </div>
                )}
              </div>
              {!isFood &&
                isFoodAvailable &&
                foodTotalForStay > 0 &&
                !booking?.isTeamBooking && (
                  <p className="text-sm text-foreground">
                    {t('bookings_food_save_by_opting_out', {
                      amount: priceFormat(foodTotalForStay),
                    })}
                  </p>
                )}
            </div>
          )}

        {isFoodAvailable && (
          <div>
            <HeadingRow>
              <IconBanknote />
              <span>{t('bookings_checkout_step_food_cost')}</span>
            </HeadingRow>
            <div className="flex justify-between items-center mt-3">
              <p>{t('bookings_summary_step_food_total')}</p>
              <p className="font-bold text-right">
                {booking?.isTeamBooking && 'Free for team members'}{' '}
                {isFood && !booking?.isTeamBooking
                  ? priceFormat(foodPricePerNight || 0)
                  : priceFormat(0)}
              </p>
            </div>
            <p className="text-right text-xs">
              {t('booking_price_per_night_per_adult')}
            </p>
            {durationNights > 0 && isFood && !booking?.isTeamBooking && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-dark">
                <p className="font-medium">{t('bookings_food_total_for_stay')}</p>
                <p className="font-bold">
                  {priceFormat(foodTotalForStay)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 font-bold mt-1 sm:mt-0">
          {isFoodAvailable ? (
            <FoodDescription foodOption={foodOption} />
          ) : (
            <div>
              <p>{t('food_no_food_available')}</p>
            </div>
          )}
        </div>

        {!isFood ||
          (!isFoodAvailable && (
            <Information className=" hidden sm:flex">
              {t('food_no_food_disclaimer')}
            </Information>
          ))}

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
    const [bookingRes, bookingConfigRes, foodRes, messages] = await Promise.all(
      [
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
        api.get('/food').catch(() => {
          return null;
        }),

        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ],
    );
    const booking = bookingRes?.data?.results || null;
    const bookingConfig = bookingConfigRes?.data?.results?.value || null;
    const foodOptions = foodRes?.data?.results || null;

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
      foodOptions,
    };
  } catch (err) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      bookingConfig: null,
      messages: null,
      foodOptions: null,
    };
  }
};

export default FoodSelectionPage;
