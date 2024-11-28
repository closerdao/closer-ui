import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingGuests from '../../../components/BookingGuests';
import CurrencySwitcher from '../../../components/CurrencySwitcher';
import GoogleMaps from '../../../components/GoogleMaps';
import ListingDateSelector from '../../../components/ListingDateSelector';
import Slider from '../../../components/Slider';
import Switch from '../../../components/Switch';
import {
  Button,
  Card,
  ErrorMessage,
  Information,
} from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  CURRENCIES,
  DEFAULT_AVAILABILITY_RANGE_TO_CHECK,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import {
  BookingSettings,
  CloserCurrencies,
  GeneralConfig,
  Listing,
} from '../../../types';
import api, { cdn } from '../../../utils/api';
import {
  getFiatTotal,
  getFoodTotal,
  getLocalTimeAvailability,
  getTimeOnly,
  getTimeOptions,
  getUtilityTotal,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  getBookingRate,
  getDiscountRate,
  getMaxBookingHorizon,
  priceFormat,
  sendAnalyticsEvent,
} from '../../../utils/helpers';
import {
  formatDate,
  getBlockedDateRanges,
} from '../../../utils/listings.helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

const MAX_DAYS_TO_CHECK_AVAILABILITY = 60;

interface Props {
  listing: Listing | null;
  error?: string;
  settings: BookingSettings | null;
  descriptionText?: string | null;
  generalSettings: GeneralConfig | null;
}

const ListingPage: NextPage<Props> = ({
  listing,
  settings,
  generalSettings,
  error,
  descriptionText,
}) => {
  const t = useTranslations();
  const config = useConfig();
  const { LOCATION_LAT, LOCATION_LON, PLATFORM_LEGAL_ADDRESS } = config || {};
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const isMember = user && user.roles.includes('member');
  const {
    start: savedStartDate,
    end: savedEndDate,
    adults: savedAdults,
    kids: savedKids,
    infants: savedInfants,
    pets: savedPets,
    useTokens: savedUseTokens,
  } = router.query || {};
  const guestsDropdownRef = useOutsideClick(
    handleClickOutsideDepartureDropdown,
  );
  const timeZone = generalSettings?.timeZone;
  const { workingHoursStart, workingHoursEnd } = listing || {};

  const timeOptions = getTimeOptions(
    workingHoursStart,
    workingHoursEnd,
    timeZone,
  );

  const [maxHorizon, maxDuration] = getMaxBookingHorizon(settings, isMember);

  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [start, setStartDate] = useState<string | null | Date>(
    (savedStartDate as string) || null,
  );
  const [end, setEndDate] = useState<string | null | Date>(
    (savedEndDate as string) || null,
  );
  const durationInDays = dayjs(end).diff(dayjs(start), 'day') || 30;
  const durationInHours = dayjs(end).diff(dayjs(start), 'hour') || 1;

  const isDurationValid = durationInDays >= (settings?.minDuration || 1);

  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [doesNeedPickup, setDoesNeedPickup] = useState(false);
  const [doesNeedSeparateBeds, setDoesNeedSeparateBeds] = useState(false);
  const [isTeamBooking, setIsTeamBooking] = useState(false);
  const [hourAvailability, setHourAvailability] = useState<
    { hour: string; isAvailable: boolean }[] | []
  >([]);

  const isTimeSet =
    timeOptions?.includes(String(getTimeOnly(start))) &&
    timeOptions?.includes(String(getTimeOnly(end))) &&
    String(getTimeOnly(start)) !== String(getTimeOnly(end));

  const [bookingError, setBookingError] = useState<null | string>(null);
  const durationRateDays =
    durationInDays >= 28 ? 30 : durationInDays >= 7 ? 7 : 1;
  const durationName = getBookingRate(durationInDays);

  const discountRate = settings
    ? 1 - getDiscountRate(durationName, settings)
    : 0;

  const isHourlyBooking = listing?.priceDuration === 'hour';

  let accomodationTotal: number | undefined | false = 0;
  if (isHourlyBooking) {
    accomodationTotal =
      isTimeSet && (listing?.fiatHourlyPrice?.val || 1) * durationInHours;
  } else {
    accomodationTotal = listing
      ? listing.fiatPrice?.val *
        (listing.private ? 1 : adults) *
        durationInDays *
        discountRate
      : 0;
  }
  const numPrivateSpacesRequired = listing?.private
    ? Math.ceil(adults / (listing?.beds || 1))
    : 1;
  const accommodationFiatTotal = listing
    ? listing.fiatPrice?.val *
      (listing.private ? 1 : adults) *
      durationInDays *
      discountRate *
      numPrivateSpacesRequired
    : 0;
  const accommodationTokenTotal = listing
    ? listing.tokenPrice?.val *
      (listing.private ? 1 : adults) *
      durationInDays 
    : 0;
  const nightlyTotal = listing
    ? listing.fiatPrice?.val * (listing.private ? 1 : adults) * discountRate
    : 0;
  const utilityTotal = getUtilityTotal({
    utilityFiatVal: settings?.utilityFiatVal,
    updatedAdults: adults,
    updatedDuration: durationInDays,
    discountRate,
    isTeamBooking,
    isUtilityOptionEnabled: settings?.utilityOptionEnabled || false,
  });

  const foodTotal =
    getFoodTotal({
      isHourlyBooking,
      foodPrice: 0, // we do not add food price at this stage of booking
      adults,
      durationInDays,
      isFoodOptionEnabled: settings?.foodOptionEnabled || false,
      isTeamMember: isTeamBooking || false,
    }) || 0;

  const [apiError, setApiError] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isListingAvailable, setIsListingAvailable] = useState(true);
  const [isGuestLimit, setIsGuestLimit] = useState(false);

  const [currency, setCurrency] = useState<CloserCurrencies>(
    savedUseTokens === 'true' ? CURRENCIES[1] : DEFAULT_CURRENCY,
  );

  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<any[]>([]);
  const [numSpacesAvailable, setNumSpacesAvailable] = useState<number>(0);

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';

  const photo = listing && listing.photos && listing.photos[0];

  const isTokenPaymentSelected =
    savedUseTokens === 'true' || currency === CURRENCIES[1];
  const isTeamMember = user?.roles.some((roles) =>
    ['space-host', 'steward', 'land-manager', 'team'].includes(roles),
  );

  const isStartToday = start && dayjs(start).isSame(dayjs(), 'day');
  const isTodayAndToken = Boolean(isStartToday && isTokenPaymentSelected);

  const isBookingAvailable = Boolean(
    start &&
      end &&
      isListingAvailable &&
      !calendarError &&
    (isHourlyBooking ? isTimeSet : true) &&
    !isTodayAndToken
  );


  const fiatTotal = getFiatTotal({
    isTeamBooking,
    foodTotal,
    utilityTotal,
    accommodationFiatTotal,
  });

  const getAvailability = async (
    startDate: Date | string | null,
    endDate: Date | string | null,
    listingId?: string | null,
  ) => {
    try {
      const {
        data: { results, availability },
      } = await api.post('/bookings/listing/availability', {
        start: isHourlyBooking ? startDate : formatDate(startDate),
        end: isHourlyBooking ? endDate : formatDate(endDate),
        listing: listingId,
        adults,
        children: kids,
        infants,
        pets,
        useTokens: isTokenPaymentSelected,
      });

      setIsGuestLimit(availability[0].reason === 'Guest limit');
      return { results, availability, error: null };
    } catch (error: any) {
      return {
        results: null,
        availability: null,
        error: error.response.data.error || 'Unknown error',
      };
    }
  };

  useEffect(() => {
    if (savedStartDate) {
      setStartDate(savedStartDate as string);
    }
    if (savedEndDate) {
      setEndDate(savedEndDate as string);
    }

    handleDefaultBookingDates();
  }, [router.query]);

  useEffect(() => {
    setCalendarError(null);

    const isCalendarSelectionValid = isHourlyBooking
      ? start && end
      : end && formatDate(start) !== formatDate(end);

    if (!end) {
      setCalendarError(t('bookings_incomplete_dates_error'));
    }
    if (formatDate(start) === formatDate(end) && !isHourlyBooking) {
      setCalendarError(t('bookings_date_range_error'));
    }

    if (isCalendarSelectionValid) {
      (async function updatePrices() {
        setBookingError(null);
        const { results, availability, error } = await getAvailability(
          start,
          end,
          listing?._id,
        );
        if (availability) {
          setHourAvailability(getLocalTimeAvailability(availability, timeZone));
          const minNumSpacesAvailable = availability.reduce(
            (min: number, day: { numSpacesAvailable: number }) =>
              Math.min(min, day.numSpacesAvailable),
            Infinity,
          ) || 0;
          setNumSpacesAvailable(minNumSpacesAvailable);
        }
        setIsListingAvailable(results);
        setBookingError(error);
      })();
    }
  }, [adults, start, end]);

  useEffect(() => {
    // Load availability for the entire booking horizon once.
    (async function loadAvailability() {
      const { availability } = await getAvailability(
        dayjs().startOf('day').toDate(),
        dayjs()
          .add(DEFAULT_AVAILABILITY_RANGE_TO_CHECK, 'days')
          .endOf('day')
          .toDate(),
        listing?._id,
      );
      if (availability) {
        const dates = availability
          .map(
            (day: any) =>
              !day.available && { day: day.day, reason: day.reason },
          )
          .filter((d: { day: string; reason: string }) => {
            return (
              d.day &&
              !['Fully booked', 'Guest limit'].includes(d.reason) &&
              d.day
            );
          })
          .map((d: { day: string; reason: string }) => new Date(d.day));

        setUnavailableDates(dates);
      }
    })();
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerWidth < 640) {
        setIsSmallScreen(true);
      } else {
        setIsSmallScreen(false);
      }
    };
    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const handleDefaultBookingDates = async () => {
    if (listing?.priceDuration !== 'night' && !savedStartDate) {
      setStartDate(new Date());
      setEndDate(new Date());
      return;
    }
    const availableStart = new Date();
    const availableEnd = new Date(
      new Date(new Date()).setDate(
        new Date().getDate() + MAX_DAYS_TO_CHECK_AVAILABILITY,
      ),
    );
    const { results: isListingAvailable } = await getAvailability(
      availableStart,
      availableEnd,
      listing?._id,
    );

    if (!isListingAvailable && !savedStartDate && !savedEndDate) {
      setStartDate('');
      setEndDate('');
    }
  };

  const getUrlParams = () => {
    const dateFormat = 'YYYY-MM-DD HH:mm';
    const params = {
      start: dayjs(start as string).format(dateFormat),
      end: dayjs(end as string).format(dateFormat),
      adults: String(adults),
      ...(kids && { kids: String(kids) }),
      ...(infants && { infants: String(infants) }),
      ...(pets && { pets: String(pets) }),
      useTokens: String(isTokenPaymentSelected),
    };
    const urlParams = new URLSearchParams(params);

    return urlParams;
  };

  const redirectToNextStep = (bookingId: string) => {
    if (settings?.foodOptionEnabled) {
      router.push(
        `/bookings/${bookingId}/food?back=stay/${
          listing?.slug
        }&${getUrlParams()}`,
      );
    } else {
      router.push(
        `/bookings/${bookingId}/summary?back=stay/${
          listing?.slug
        }&${getUrlParams()}`,
      );
    }
  };

  const redirectToSignup = () => {
    router.push(`/signup?back=stay/${listing?.slug}&${getUrlParams()}`);
  };

  const bookListing = async () => {
    if (!isAuthenticated) {
      redirectToSignup();
      return;
    }

    try {
      setApiError(null);
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        useTokens: currency === CURRENCIES[1],
        start: isHourlyBooking ? start : formatDate(start),
        end: isHourlyBooking ? end : formatDate(end),
        adults,
        infants,
        pets,
        listing: listing?._id,
        children: kids,
        discountCode: '',
        doesNeedPickup: doesNeedPickup,
        isTeamBooking: isTeamBooking,
        doesNeedSeparateBeds: doesNeedSeparateBeds,
        isHourlyBooking,
      });
      sendAnalyticsEvent('Click', 'ListingPage', 'Book');
      redirectToNextStep(newBooking._id);
    } catch (err: any) {
      setApiError(err);
    } finally {
    }
  };

  function handleClickOutsideDepartureDropdown() {
    setShowGuestsDropdown(false);
  }

  if (!listing) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{listing.name}</title>
        <meta name="description" content={descriptionText || ''} />
        <meta name="description" content={descriptionText || ''} />
        <meta property="og:type" content="listing" />
        {photo && (
          <meta
            key="og:image"
            property="og:image"
            content={`${cdn}${photo}-max-lg.jpg`}
          />
        )}
        {photo && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={`${cdn}${photo}-max-lg.jpg`}
          />
        )}
      </Head>
      <main className="flex justify-center flex-wrap my-4 ">
        <div className="flex flex-col gap-8  max-w-4xl">
          <Heading level={1}>{listing.name}</Heading>

          {listing.photos && listing.photos.length > 0 && (
            <Slider
              reverse={false}
              isListing={true}
              slides={listing.photos.map((id) => ({
                image: `${cdn}${id}-max-lg.jpg`,
              }))}
            />
          )}

          <div>
            <section className="flex justify-left">
              <div className="max-w-4xl w-full flex flex-col sm:flex-row place-items-start justify-between">
                <div className="p-2 sm:pr-8 flex flex-col w-full">
                  <div className="flex flex-col gap-6">
                    <section className="w-full md:min-w-[450px]">
                      <div
                        className="rich-text w-full"
                        dangerouslySetInnerHTML={{
                          __html: listing.description,
                        }}
                      />
                    </section>
                  </div>

                  <div className="my-8 flex flex-col gap-6">
                    <Heading level={2} className="text-lg uppercase mt-6">
                      {t('listing_preview_location')}
                    </Heading>
                    <Heading level={3} className="text-md font-normal">
                      {PLATFORM_LEGAL_ADDRESS}
                    </Heading>
                    {LOCATION_LAT && LOCATION_LON && (
                      <GoogleMaps
                        height={400}
                        locationLat={LOCATION_LAT}
                        locationLon={LOCATION_LON}
                      />
                    )}
                  </div>
                </div>

                <div className="w-full  sm:w-auto fixed left-0 bottom-0 right-0 sm:sticky">
                  <Card className="bg-white min-w-[250px]  flex-row sm:flex-col items-center border border-gray-100 pb-4">
                    <div className="w-1/2 sm:w-full flex flex-col gap-2">
                      {isWeb3BookingEnabled && (
                        <CurrencySwitcher
                          className="hidden sm:block"
                          selectedCurrency={currency}
                          onSelect={setCurrency as any}
                          currencies={CURRENCIES}
                        />
                      )}

                      <div className="block sm:hidden">
                        {currency === CURRENCIES[1] ? (
                          <div className=" font-bold text-md">
                            {listing?.tokenPrice &&
                              priceFormat(
                                listing.tokenPrice?.val,
                                listing.tokenPrice?.cur,
                              )}{' '}
                            +{' '}
                            {settings?.utilityFiatVal &&
                              priceFormat(foodTotal, settings.utilityFiatCur)}
                          </div>
                        ) : (
                          <div>
                            <b className="text-lg">
                              {priceFormat(
                                nightlyTotal * durationRateDays,
                                settings?.utilityFiatCur,
                              )}
                            </b>{' '}
                            <span className="opacity-70">
                              {t(`booking_rate_${durationName}`)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <ListingDateSelector
                          priceDuration={listing?.priceDuration || 'night'}
                          setStartDate={setStartDate}
                          setEndDate={setEndDate}
                          end={end}
                          start={start}
                          isSmallScreen={isSmallScreen}
                          blockedDateRanges={getBlockedDateRanges({
                            start,
                            end,
                            maxHorizon,
                            maxDuration,
                            unavailableDates,
                            isHourlyBooking,
                          })}
                          timeOptions={timeOptions}
                          hourAvailability={hourAvailability}
                        />
                      </div>

                      {!isHourlyBooking && (
                        <div ref={guestsDropdownRef}>
                          <label className="my-2 hidden sm:block">
                            {t('bookings_dates_step_guests_title')}
                          </label>
                          <Button
                            onClick={() =>
                              setShowGuestsDropdown(!showGuestsDropdown)
                            }
                            className="bg-white min-h-[20px] font-bold sm:font-normal underline sm:no-underline text-black border-0 sm:border-2 border-black normal-case  w-auto sm:w-full  sm:px-3 sm:p-3 sm:py-2 text-sm py-1 px-0"
                          >
                            {adults}{' '}
                            {adults > 1
                              ? t(
                                  'bookings_dates_step_guests_title',
                                ).toLowerCase()
                              : t(
                                  'bookings_dates_step_guest_title',
                                ).toLowerCase()}
                          </Button>
                          {showGuestsDropdown && (
                            <div className="">
                              <Card className="absolute border border-gray-100 sm:w-auto z-10 sm:left-auto bottom-[175px] sm:bottom-auto sm:top-auto bg-white shadow-md rounded-md p-3">
                                <BookingGuests
                                  shouldHideTitle={true}
                                  adults={adults}
                                  kids={kids}
                                  infants={infants}
                                  pets={pets}
                                  setAdults={setAdults}
                                  setKids={setKids}
                                  setInfants={setInfants}
                                  setPets={setPets}
                                  doesNeedSeparateBeds={doesNeedSeparateBeds}
                                  setDoesNeedSeparateBeds={
                                    setDoesNeedSeparateBeds
                                  }
                                  isPrivate={listing?.private}
                                />

                                {settings?.pickUpEnabled && (
                                  <div className="my-0 flex flex-row justify-between items-start ">
                                    <label
                                      htmlFor="separateBeds"
                                      className="text-sm w-3/4"
                                    >
                                      {t('bookings_pickup')}
                                      <span className="w-full text-xs ml-2 ">
                                        ({t('bookings_pickup_disclaimer')})
                                      </span>
                                    </label>
                                    <Switch
                                      disabled={false}
                                      name="pickup"
                                      label=""
                                      onChange={setDoesNeedPickup}
                                      checked={doesNeedPickup}
                                    />
                                  </div>
                                )}

                                {isTeamMember && (
                                  <div className="my-0 flex flex-row justify-between flex-wrap">
                                    <label
                                      htmlFor="separateBeds"
                                      className="text-sm"
                                    >
                                      Team booking?
                                    </label>
                                    <Switch
                                      disabled={false}
                                      name="team-booking"
                                      label=""
                                      onChange={setIsTeamBooking}
                                      checked={isTeamBooking}
                                    />
                                  </div>
                                )}
                              </Card>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col w-1/2 sm:w-full">
                      <div className="">
                        {isTodayAndToken && (
                          <ErrorMessage error={t('booking_token_same_day_error')} />
                        )}
                        {error && (
                          <ErrorMessage error={parseMessageFromError(error)} />
                        )}
                        {apiError && (
                          <ErrorMessage
                            error={parseMessageFromError(apiError)}
                          />
                        )}
                        {calendarError &&
                          calendarError !== t('bookings_date_range_error') && (
                            <ErrorMessage
                              error={parseMessageFromError(calendarError)}
                            />
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="hidden sm:block">
                          {listing.quantity === 1
                            ? `${
                                start && end
                                  ? numSpacesAvailable
                                  : listing?.quantity
                              } ${t('listing_listings_available_singular')}`
                            : `${
                                start && end
                                  ? numSpacesAvailable
                                  : listing?.quantity
                              } ${t('listing_listings_available')}`}
                        </div>
                        {isWeb3BookingEnabled && (
                          <CurrencySwitcher
                            className="block sm:hidden"
                            selectedCurrency={currency}
                            onSelect={setCurrency as any}
                            currencies={CURRENCIES}
                          />
                        )}
                        {!isSmallScreen && isHourlyBooking && (
                          <div>
                            <p className="text-left">
                              <span className="font-bold">
                                {priceFormat(
                                  listing?.fiatHourlyPrice?.val || 0,
                                  listing.fiatPrice.cur,
                                )}{' '}
                              </span>
                              {t('listing_preview_per_hourly')}
                            </p>
                          </div>
                        )}

                        {!isSmallScreen && !isHourlyBooking && (
                          <div>
                            <p className="text-left">
                              <span className="font-bold">
                                {priceFormat(
                                  listing.fiatPrice.val *
                                    durationRateDays *
                                    discountRate,
                                  listing.fiatPrice.cur,
                                )}{' '}
                              </span>
                              {t(`listing_preview_per_${durationName}`)}
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={bookListing}
                          isEnabled={isBookingAvailable}
                          className=" text-lg btn-primary text-center h-[32px] sm:h-auto sm:mt-4"
                        >
                          {t('listings_slug_link')}
                        </Button>
                      </div>
                      {!isListingAvailable && (
                        <div className="block sm:hidden text-xs">
                          {isGuestLimit
                            ? t('listing_not_available_guest_limit')
                            : bookingError || t('listing_not_available')}
                        </div>
                      )}
                    </div>

                    {isHourlyBooking && accomodationTotal && (
                      <div className="w-full flex justify-between items-center mt-3">
                        <p>
                          {t('bookings_checkout_step_total_title')} (
                          {t('token_sale_checkout_vat')}):
                        </p>
                        <div className="font-bold text-right text-xl">
                          {currency === CURRENCIES[1] && fiatTotal > 0 ? (
                            <div>
                              {priceFormat(
                                listing.tokenPrice && listing.tokenPrice?.val,
                                listing.tokenPrice?.cur,
                              )}{' '}
                              +{' '}
                            </div>
                          ) : (
                            <span>
                              {priceFormat(
                                settings && listing && accomodationTotal,
                                listing.fiatPrice?.cur,
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="hidden sm:block w-full">
                      {isListingAvailable &&
                      !calendarError &&
                      !isHourlyBooking ? (
                        <>
                          {' '}
                          <div className="flex justify-between items-center mt-3">
                            <p>
                              {t(
                                'bookings_summary_step_dates_accomodation_type',
                              )}
                            </p>
                            <p>
                              {currency === CURRENCIES[1]
                                ? priceFormat(
                                    accommodationTokenTotal,
                                    listing.tokenPrice?.cur,
                                  )
                                : priceFormat(
                                    isTeamBooking ? 0 : accommodationFiatTotal,
                                    listing.fiatPrice?.cur,
                                  )}
                            </p>
                          </div>
                          {settings?.utilityOptionEnabled && (
                            <div className="flex justify-between items-center mt-3">
                              <p>{t('bookings_summary_step_utility_total')}</p>
                              <p>
                                {priceFormat(
                                  isTeamBooking ? 0 : utilityTotal,
                                  settings?.utilityFiatCur,
                                )}
                              </p>
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-3">
                            <p>
                              {t('bookings_checkout_step_total_title')} (
                              {t('token_sale_checkout_vat')}):
                            </p>
                            <div className="font-bold text-right text-xl">
                              {currency === CURRENCIES[1] && fiatTotal > 0 ? (
                                <div>
                                  {priceFormat(
                                    accommodationTokenTotal,
                                    listing.tokenPrice?.cur,
                                  )}{' '}
                                    +{' '}
                                    {priceFormat(utilityTotal)}
                                </div>
                              ) : (
                                <span>
                                  {priceFormat(
                                    settings && listing && fiatTotal,
                                    listing.fiatPrice?.cur,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        !isListingAvailable && (
                          <Information>
                            {!isListingAvailable &&
                              !isGuestLimit &&
                              isDurationValid &&
                              t('listing_not_available')}
                            {!isDurationValid &&
                              t('bookings_dates_min_duration_error', {
                                var: settings?.minDuration,
                              })}
                            {isGuestLimit &&
                              t('listing_not_available_guest_limit')}
                          </Information>
                        )
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

ListingPage.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  const { convert } = require('html-to-text');
  try {
    const [listing, settings, generalSettings, messages] = await Promise.all([
      api.get(`/listing/${query.slug}`).catch((err) => {
        console.error('Error fetching listing:', err);
        return null;
      }),
      api.get('/config/booking').catch((err) => {
        console.error('Error fetching booking config:', err);
        return null;
      }),
      api.get('/config/general').catch((err) => {
        console.error('Error fetching general config:', err);
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };
    const descriptionText = convert(listing?.data.results.description, options)
      .trim()
      .slice(0, 100);

    return {
      listing: listing?.data.results,
      settings: settings?.data.results.value,
      generalSettings: generalSettings?.data.results.value,
      descriptionText,
      messages,
    };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      listing: null,
      settings: null,
      generalSettings: null,
      descriptionText: null,
      messages: null,
    };
  }
};

export default ListingPage;
