import { useRouter } from 'next/router';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import Switch from '../../../components/Switch';
import { Button, Information } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS, BOOKING_STEP_TITLE_KEYS } from '../../../constants';
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
import {
  buildBookingAccomodationUrl,
  buildBookingDatesUrl,
  getBookingTokenCurrency,
  getFoodOption,
  getFoodOptionsForBookingContext,
  getDefaultSelectedFoodOptionId,
  FoodBookingContext,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import { cdn } from '../../../utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props extends BaseBookingParams {
  listing: Listing | null;
  booking: Booking | null;
  error?: string;
  event?: Event;
  bookingConfig: BookingConfig | null;
  discountCode?: string;
  foodOptions: FoodOption[];
  tokenCurrency: string;
}

const SingleOptionPhotoPreview = ({
  option,
  photoSlideByOptionId,
  setPhotoSlideByOptionId,
  cdnUrl,
}: {
  option: FoodOption;
  photoSlideByOptionId: Record<string, number>;
  setPhotoSlideByOptionId: Dispatch<
    SetStateAction<Record<string, number>>
  >;
  cdnUrl: string | undefined;
}) => {
  const photos = option.photos ?? [];
  const currentPhotoIndex = photoSlideByOptionId[option._id] ?? 0;
  const setCurrentPhotoIndex = (next: number) => {
    setPhotoSlideByOptionId((prev) => ({ ...prev, [option._id]: next }));
  };
  const cdn = cdnUrl ?? '';
  return (
    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-dark/10 relative">
      <img
        src={`${cdn}${photos[currentPhotoIndex]}-post-md.jpg`}
        alt=""
        className="w-full h-full object-cover"
      />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-r text-neutral-dark hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPhotoIndex(
                currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1,
              );
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-l text-neutral-dark hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPhotoIndex(
                currentPhotoIndex >= photos.length - 1 ? 0 : currentPhotoIndex + 1,
              );
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="absolute bottom-0.5 right-0.5 bg-white/80 text-[10px] px-1 rounded">
            {currentPhotoIndex + 1}/{photos.length}
          </span>
        </>
      )}
    </div>
  );
};

const FoodSelectionPage = ({
  booking,
  event,
  error,
  bookingConfig,
  discountCode,
  foodOptions,
  tokenCurrency,
}: Props) => {
  const t = useTranslations();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const { useTokens, start, end, adults, eventId, isFriendsBooking } =
    booking || {};

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const eventFoodOptionSet = Boolean(
    event?.foodOption === 'food_package'
      ? event?.foodOptionId
      : event?.foodOptionId && event?.foodOptionId !== 'no_food',
  );
  const isFoodAvailable =
    event?.foodOption !== undefined
      ? event.foodOption !== 'no_food'
      : event?.foodOptionId !== 'no_food';

  const foodBookingContext: FoodBookingContext =
    eventId && event?.foodOption === 'default'
      ? 'guests'
      : eventId
        ? 'events'
        : booking?.volunteerInfo?.bookingType === 'volunteer' ||
            booking?.volunteerInfo?.bookingType === 'residence'
          ? 'volunteer'
          : booking?.isTeamBooking
            ? 'team'
            : 'guests';

  const selectableFoodOptions = getFoodOptionsForBookingContext(
    foodOptions || [],
    foodBookingContext,
  );
  const isGuestSelectMode =
    isFoodAvailable &&
    Boolean(eventId && event?.foodOption === 'default') &&
    selectableFoodOptions.length > 0;

  const fixedFoodOption = getFoodOption({ eventId, event, foodOptions });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFoodOptionId, setSelectedFoodOptionId] = useState<
    string | null
  >(null);
  const [isFood, setIsFood] = useState(true);
  const [photoSlideByOptionId, setPhotoSlideByOptionId] = useState<
    Record<string, number>
  >({});

  const defaultId = getDefaultSelectedFoodOptionId(selectableFoodOptions);
  const bookingSelectedId =
    booking?.foodOptionId &&
    selectableFoodOptions.some((o) => o._id === booking.foodOptionId)
      ? booking.foodOptionId
      : null;
  const resolvedSelectedId = isGuestSelectMode
    ? isFood
      ? selectedFoodOptionId ?? bookingSelectedId ?? defaultId
      : null
    : null;
  const selectedFoodOption =
    isGuestSelectMode && resolvedSelectedId
      ? selectableFoodOptions.find((o) => o._id === resolvedSelectedId)
      : null;
  const foodOption = isGuestSelectMode
    ? selectedFoodOption ?? fixedFoodOption
    : getFoodOption({
        eventId,
        event,
        foodOptions:
          selectableFoodOptions.length > 0
            ? selectableFoodOptions
            : foodOptions || [],
      });

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
      const hasSelection =
        isGuestSelectMode && resolvedSelectedId && isFood
          ? true
          : !isGuestSelectMode && isFood && foodOption && isFoodAvailable;
      const foodOptionIdValue = hasSelection
        ? (isGuestSelectMode ? resolvedSelectedId : foodOption?._id) ?? null
        : null;
      const payload = {
        foodOption: hasSelection ? 'food_package' : 'no_food',
        foodOptionId: foodOptionIdValue,
      };
      await api.post(`/bookings/${booking?._id}/update-food`, payload);

      if (event?.fields) {
        router.push(`/bookings/${booking?._id}/questions`);
        return;
      }

      router.push(`/bookings/${booking?._id}/rules`);
    } catch (err: any) {
      setApiError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const stepUrlParams =
    booking?.start && booking?.end
      ? {
          start: booking.start,
          end: booking.end,
          adults: adults ?? 0,
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

  const goBack = () => {
    if (stepUrlParams) {
      router.push(buildBookingAccomodationUrl(stepUrlParams));
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

  return (
    <div className="w-full max-w-screen-sm mx-auto p-4 md:p-8">
      <div className="relative flex items-center min-h-[2.75rem] mb-6">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} className="relative z-10" />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading level={1} className="text-2xl md:text-3xl pb-0 mt-0 text-center">
            <span>{t('bookings_food_step_title')}</span>
          </Heading>
        </div>
      </div>
      <FriendsBookingBlock isFriendsBooking={isFriendsBooking} />
      {apiError && (
        <div className="error-box mb-4" role="alert">
          {apiError}
        </div>
      )}
      <ProgressBar
        steps={BOOKING_STEPS}
        stepTitleKeys={BOOKING_STEP_TITLE_KEYS}
        stepHrefs={
          stepUrlParams
            ? [
                buildBookingDatesUrl(stepUrlParams),
                buildBookingAccomodationUrl(stepUrlParams),
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
        {isGuestSelectMode && (
          <div className="flex flex-col gap-6">
            <Heading level={2} className="text-xl">
              {t('bookings_food_step_title')}
            </Heading>
            {selectableFoodOptions.map((option) => {
              const isSelected = resolvedSelectedId === option._id;
              const optionPricePerNight =
                booking?.volunteerInfo?.bookingType === 'residence'
                  ? 0
                  : option.price;
              const optionTotal =
                optionPricePerNight * (adults ?? 0) * durationNights;
              const photos = option.photos ?? [];
              const currentPhotoIndex =
                photoSlideByOptionId[option._id] ?? 0;
              const setCurrentPhotoIndex = (next: number) => {
                setPhotoSlideByOptionId((prev) => ({
                  ...prev,
                  [option._id]: next,
                }));
              };
              return (
                <div
                  key={option._id}
                  className="rounded-lg border border-neutral-dark/30 bg-neutral-light/50 p-4 flex gap-4"
                >
                  <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-dark/10 relative">
                    {photos.length > 0 ? (
                      <>
                        <img
                          src={`${cdn}${photos[currentPhotoIndex]}-post-md.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {photos.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="absolute left-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-r text-neutral-dark hover:bg-white"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPhotoIndex(
                                  currentPhotoIndex === 0
                                    ? photos.length - 1
                                    : currentPhotoIndex - 1,
                                );
                              }}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-l text-neutral-dark hover:bg-white"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPhotoIndex(
                                  currentPhotoIndex >= photos.length - 1
                                    ? 0
                                    : currentPhotoIndex + 1,
                                );
                              }}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-0.5 right-0.5 bg-white/80 text-[10px] px-1 rounded">
                              {currentPhotoIndex + 1}/{photos.length}
                            </span>
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{option.name}</p>
                        {option.description && (
                          <div
                            className="text-sm text-foreground/80 mt-0.5 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: option.description,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 [&_.switch]:mb-0 shrink-0">
                        <span
                          className={`text-sm font-medium ${
                            isSelected ? 'text-success' : 'text-foreground'
                          }`}
                        >
                          {isSelected
                            ? `✓ ${t('bookings_food_included')}`
                            : `✗ ${t('bookings_food_not_included')}`}
                        </span>
                        <Switch
                          disabled={false}
                          name={`food-${option._id}`}
                          onChange={() => {
                            setSelectedFoodOptionId(
                              isSelected ? null : option._id,
                            );
                            setIsFood(!isSelected);
                          }}
                          checked={isSelected}
                          label=""
                        />
                      </div>
                    </div>
                    {isSelected &&
                      optionPricePerNight > 0 &&
                      durationNights > 0 &&
                      !booking?.isTeamBooking && (
                        <div className="text-sm mt-0.5 flex flex-col gap-0.5">
                          <p>
                            {t('bookings_food_price_per_day_x_days', {
                              price: priceFormat(optionPricePerNight),
                              days: durationNights,
                            })}
                          </p>
                          <p>
                            {t('bookings_food_total_for_stay')}:{' '}
                            {priceFormat(optionTotal)}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isGuestSelectMode &&
          foodOption &&
          foodOption?.name !== 'no_food' &&
          eventFoodOptionSet && (
            <div className="rounded-lg border border-neutral-dark/30 bg-neutral-light/50 p-4 flex gap-4">
              {(foodOption.photos ?? []).length > 0 && (
                <SingleOptionPhotoPreview
                  option={foodOption}
                  photoSlideByOptionId={photoSlideByOptionId}
                  setPhotoSlideByOptionId={setPhotoSlideByOptionId}
                  cdnUrl={cdn}
                />
              )}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{foodOption.name}</p>
                    {foodOption.description && (
                      <div
                        className="text-sm text-foreground/80 mt-0.5 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: foodOption.description,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 [&_.switch]:mb-0 shrink-0">
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
                {isFoodAvailable &&
                  isFood &&
                  durationNights > 0 &&
                  !booking?.isTeamBooking &&
                  (foodPricePerNight ?? 0) > 0 && (
                    <div className="text-sm mt-0.5 flex flex-col gap-0.5">
                      <p>
                        {t('bookings_food_price_per_day_x_days', {
                          price: priceFormat(foodPricePerNight || 0),
                          days: durationNights,
                        })}
                      </p>
                      <p>
                        {t('bookings_food_total_for_stay')}:{' '}
                        {priceFormat(foodTotalForStay)}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

        {!isGuestSelectMode &&
          isFoodAvailable &&
          !(foodOption && foodOption?.name !== 'no_food' && eventFoodOptionSet) &&
          foodOption &&
          foodOption?.name !== 'no_food' && (
            <div className="rounded-lg border border-neutral-dark/30 bg-neutral-light/50 p-4 flex gap-4">
              {(foodOption.photos ?? []).length > 0 && (
                <SingleOptionPhotoPreview
                  option={foodOption}
                  photoSlideByOptionId={photoSlideByOptionId}
                  setPhotoSlideByOptionId={setPhotoSlideByOptionId}
                  cdnUrl={cdn}
                />
              )}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {t('booking_add_food')} {foodOption.name}
                    </p>
                    {foodOption.description && (
                      <div
                        className="text-sm text-foreground/80 mt-0.5 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: foodOption.description,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 [&_.switch]:mb-0 shrink-0">
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
                </div>
                {!isFood &&
                  foodTotalForStay > 0 &&
                  !booking?.isTeamBooking && (
                    <p className="text-sm text-foreground">
                      {t('bookings_food_save_by_opting_out', {
                        amount: priceFormat(foodTotalForStay),
                      })}
                    </p>
                  )}
                {isFood &&
                  durationNights > 0 &&
                  !booking?.isTeamBooking &&
                  (foodPricePerNight ?? 0) > 0 && (
                    <div className="text-sm mt-0.5 flex flex-col gap-0.5">
                      <p>
                        {t('bookings_food_price_per_day_x_days', {
                          price: priceFormat(foodPricePerNight || 0),
                          days: durationNights,
                        })}
                      </p>
                      <p>
                        {t('bookings_food_total_for_stay')}:{' '}
                        {priceFormat(foodTotalForStay)}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

        {!isFoodAvailable && (
          <div>
            <p>{t('food_no_food_available')}</p>
          </div>
        )}

        {(!isFood || !isFoodAvailable) && (
          <Information className="hidden sm:flex">
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
    const [bookingRes, bookingConfigRes, web3ConfigRes, foodRes, messages] =
      await Promise.all([
        api
          .get(`/booking/${query.slug}`, {
            headers: (req as NextApiRequest)?.cookies?.access_token && {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            },
          })
          .catch(() => null),
        api.get('/config/booking').catch(() => null),
        api.get('/config/web3').catch(() => null),
        api.get('/food').catch(() => null),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);
    const booking = bookingRes?.data?.results || null;
    const bookingConfig = bookingConfigRes?.data?.results?.value || null;
    const web3Config = web3ConfigRes?.data?.results?.value || null;
    const tokenCurrency = getBookingTokenCurrency(web3Config, bookingConfig);
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
      tokenCurrency,
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
      tokenCurrency: getBookingTokenCurrency(),
    };
  }
};

export default FoodSelectionPage;
