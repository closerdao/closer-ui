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
import { NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';

import PageNotFound from '../../404';
import {
  CURRENCIES,
  DEFAULT_AVAILABILITY_RANGE_TO_CHECK,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { CloserCurrencies, Listing } from '../../../types';
import api, { cdn } from '../../../utils/api';
import { getFiatTotal } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  __,
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

const MAX_DAYS_TO_CHECK_AVAILABILITY = 60;

interface Props {
  listing: Listing | null;
  error?: string;
  settings: any | null;
  descriptionText?: string | null;
}

const ListingPage: NextPage<Props> = ({
  listing,
  settings,
  error,
  descriptionText,
}) => {
  const config = useConfig();
  const { APP_NAME, LOCATION_LAT, LOCATION_LON, PLATFORM_LEGAL_ADDRESS } =
    config || {};
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

  const [maxHorizon, maxDuration] = getMaxBookingHorizon(settings, isMember);

  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [start, setStartDate] = useState<string | null | Date>(
    (savedStartDate as string) || null,
  );
  const [end, setEndDate] = useState<string | null | Date>(
    (savedEndDate as string) || null,
  );
  const durationInDays = dayjs(end).diff(dayjs(start), 'day') || 30;
  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [doesNeedPickup, setDoesNeedPickup] = useState(false);
  const [doesNeedSeparateBeds, setDoesNeedSeparateBeds] = useState(false);
  const [isTeamBooking, setIsTeamBooking] = useState(false);
  const [foodOption, setFoodOption] = useState('no_food');
  const [bookingError, setBookingError] = useState<null | string>(null);
  const durationRateDays =
    durationInDays >= 28 ? 30 : durationInDays >= 7 ? 7 : 1;
  const durationName = getBookingRate(durationInDays);

  const discountRate = settings
    ? 1 - getDiscountRate(durationName, settings)
    : 0;
  const accomodationTotal = listing
    ? listing.fiatPrice?.val *
      (listing.private ? 1 : adults) *
      durationInDays *
      discountRate
    : 0;
  const nightlyTotal = listing
    ? listing.fiatPrice?.val * (listing.private ? 1 : adults) * discountRate
    : 0;
  const utilityTotal = settings
    ? settings.utilityFiatVal * adults * durationInDays
    : 0;

  const [apiError, setApiError] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isListingAvailable, setIsListingAvailable] = useState(true);
  const [isGuestLimit, setIsGuestLimit] = useState(false);

  const [currency, setCurrency] = useState<CloserCurrencies>(
    savedUseTokens === 'true' ? CURRENCIES[1] : DEFAULT_CURRENCY,
  );

  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<any[]>([]);

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';

  const photo = listing && listing.photos && listing.photos[0];

  const isTokenPaymentSelected =
    savedUseTokens === 'true' || currency === CURRENCIES[1];
  const isTeamMember = user?.roles.some((roles) =>
    ['space-host', 'steward', 'land-manager', 'team'].includes(roles),
  );

  const fiatTotal = getFiatTotal(
    isTeamBooking,
    foodOption,
    utilityTotal,
    accomodationTotal,
  );

  const getAvailability = async (
    startDate: Date | string | null,
    endDate: Date | string | null,
    listingId?: string | null,
  ) => {
    try {
      const {
        data: { results, availability },
      } = await api.post('/bookings/listing/availability', {
        start: formatDate(startDate),
        end: formatDate(endDate),
        listing: listingId,
        adults,
        children: kids,
        infants,
        pets,
        useTokens: isTokenPaymentSelected,
      });

      console.log('availability=', availability);

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

    const isCalendarSelectionValid =
      end && formatDate(start) !== formatDate(end);
    if (!end) {
      setCalendarError(__('bookings_incomplete_dates_error'));
    }
    if (formatDate(start) === formatDate(end)) {
      setCalendarError(__('bookings_date_range_error'));
    }
    if (isCalendarSelectionValid) {
      (async function updatePrices() {
        setBookingError(null);
        const { results, error } = await getAvailability(
          start,
          end,
          listing?._id,
        );
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
    const dateFormat = 'YYYY-MM-DD';
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

  const redirectToSummary = (bookingId: string) => {
    router.push(
      `/bookings/${bookingId}/summary?back=stay/${
        listing?.slug
      }&${getUrlParams()}`,
    );
  };
  const redirectToSignup = () => {
    router.push(`/signup?back=stay/${listing?.slug}&${getUrlParams()}`);
  };

  const bookListing = async () => {
    if (!isAuthenticated) {
      redirectToSignup();
    }
    setApiError(null);
    try {
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        useTokens: currency === CURRENCIES[1],
        start: formatDate(start),
        end: formatDate(end),
        adults,
        infants,
        pets,
        listing: listing?._id,
        children: kids,
        discountCode: '',
        doesNeedPickup: doesNeedPickup.toString(),
        isTeamBooking: isTeamBooking.toString(),
        doesNeedSeparateBeds: doesNeedSeparateBeds.toString(),
      });
      sendAnalyticsEvent('Click', 'ListingPage', 'Book');
      redirectToSummary(newBooking._id);
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
              <div className="max-w-4xl w-full flex flex-col md:flex-row place-items-start justify-between">
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
                      {__('listing_preview_location')}
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

                <div className="w-full sm:w-auto fixed left-0 bottom-0 right-0 sm:sticky">
                  <Card className="min-w-[250px] bg-white flex-row sm:flex-col items-center border border-gray-100 pb-8">
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
                            {settings?.utilityFiat &&
                              priceFormat(
                                utilityTotal,
                                settings.utilityFiatCur,
                              )}
                          </div>
                        ) : (
                          <div>
                            <b className="text-lg">
                              {priceFormat(
                                nightlyTotal * durationRateDays,
                                settings?.utilityFiat?.cur,
                              )}
                            </b>{' '}
                            <span className="opacity-70">
                              {__(`booking_rate_${durationName}`)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <ListingDateSelector
                          setStartDate={setStartDate}
                          setEndDate={setEndDate}
                          end={end}
                          start={start}
                          isSmallScreen={isSmallScreen}
                          blockedDateRanges={getBlockedDateRanges(
                            start,
                            end,
                            maxHorizon,
                            maxDuration,
                            unavailableDates,
                          )}
                        />
                      </div>

                      <div ref={guestsDropdownRef}>
                        <label className="my-2 hidden sm:block">
                          {__('bookings_dates_step_guests_title')}
                        </label>
                        <Button
                          onClick={() =>
                            setShowGuestsDropdown(!showGuestsDropdown)
                          }
                          className="font-bold sm:font-normal underline sm:no-underline text-black border-0 sm:border-2 border-black normal-case w-auto sm:w-full py-1 px-0 sm:px-3 sm:p-3 sm:py-2 text-sm bg-white"
                        >
                          {adults}{' '}
                          {adults > 1
                            ? __(
                                'bookings_dates_step_guests_title',
                              ).toLowerCase()
                            : __(
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

                              {APP_NAME && APP_NAME === 'tdf' && (
                                <div className="my-0 flex flex-row justify-between items-start ">
                                  <label
                                    htmlFor="separateBeds"
                                    className="text-sm w-3/4"
                                  >
                                    {__('bookings_pickup')}
                                    <span className="w-full text-xs ml-2">
                                      ({__('bookings_pickup_disclaimer')})
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
                    </div>

                    <div className="flex flex-col w-1/2 sm:w-full">
                      <div className="">
                        {error && (
                          <ErrorMessage error={parseMessageFromError(error)} />
                        )}
                        {apiError && (
                          <ErrorMessage
                            error={parseMessageFromError(apiError)}
                          />
                        )}
                        {calendarError &&
                          calendarError !== __('bookings_date_range_error') && (
                            <ErrorMessage
                              error={parseMessageFromError(calendarError)}
                            />
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="hidden sm:block">
                          {listing.quantity} {__('listing_listings_available')}
                        </div>
                        {isWeb3BookingEnabled && (
                          <CurrencySwitcher
                            className="block sm:hidden"
                            selectedCurrency={currency}
                            onSelect={setCurrency as any}
                            currencies={CURRENCIES}
                          />
                        )}

                        {!isSmallScreen && (
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
                              {__(`listing_preview_per_${durationName}`)}
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={bookListing}
                          isEnabled={Boolean(
                            start &&
                              end &&
                              isListingAvailable &&
                              !calendarError,
                          )}
                          className=" text-lg btn-primary text-center h-[32px] sm:h-auto sm:mt-4"
                        >
                          {__('listings_slug_link')}
                        </Button>
                      </div>
                      {!isListingAvailable && (
                        <div className="block sm:hidden text-xs">
                          {isGuestLimit
                            ? __('listing_not_available_guest_limit')
                            : bookingError || __('listing_not_available')}
                        </div>
                      )}
                    </div>

                    <div className="hidden sm:block w-full">
                      {isListingAvailable && !calendarError ? (
                        <>
                          {' '}
                          <div className="flex justify-between items-center mt-3">
                            <p>
                              {__(
                                'bookings_summary_step_dates_accomodation_type',
                              )}
                            </p>
                            <p>
                              {currency === CURRENCIES[1]
                                ? priceFormat(
                                    listing.tokenPrice?.val,
                                    listing.tokenPrice?.cur,
                                  )
                                : priceFormat(
                                    accomodationTotal,
                                    listing.fiatPrice?.cur,
                                  )}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <p>{__('bookings_summary_step_utility_total')}</p>
                            <p>
                              {foodOption === 'no_food' ? (
                                <b title={__('stay_food_not_included_tooltip')}>
                                  {__('stay_food_not_included')}
                                </b>
                              ) : (
                                priceFormat(
                                  isTeamBooking ? 0 : utilityTotal,
                                  settings?.utilityFiat?.cur,
                                )
                              )}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <p>
                              {__('bookings_checkout_step_total_title')} (
                              {__('token_sale_checkout_vat')}):
                            </p>
                            <div className="font-bold text-right text-xl">
                              {currency === CURRENCIES[1] && fiatTotal > 0 ? (
                                <div>
                                  {priceFormat(
                                    listing.tokenPrice &&
                                      listing.tokenPrice?.val,
                                    listing.tokenPrice?.cur,
                                  )}{' '}
                                  +{' '}
                                  {settings &&
                                    priceFormat(
                                      isTeamBooking || foodOption === 'no_food'
                                        ? 0
                                        : utilityTotal,
                                      settings.utilityFiat?.cur,
                                    )}
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
                        <Information>
                          {isGuestLimit
                            ? __('listing_not_available_guest_limit')
                            : bookingError || __('listing_not_available')}
                        </Information>
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

ListingPage.getInitialProps = async ({ query }: { query: ParsedUrlQuery }) => {
  const { convert } = require('html-to-text');
  try {
    const [listing, settings] = await Promise.all([
      await api.get(`/listing/${query.slug}`),
      await api.get('/config/booking'),
    ]);

    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };
    const descriptionText = convert(listing.data.results.description, options)
      .trim()
      .slice(0, 100);

    return {
      listing: listing.data.results,
      settings: settings.data.results.value,
      descriptionText,
    };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      listing: null,
      settings: null,
      descriptionText: null,
    };
  }
};

export default ListingPage;
