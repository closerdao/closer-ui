import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

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
import { CURRENCIES, DEFAULT_CURRENCY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { BookingSettings, CloserCurrencies, Listing } from '../../../types';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import {
  __,
  getMaxBookingHorizon,
  sendAnalyticsEvent,
} from '../../../utils/helpers';
import { priceFormat } from '../../../utils/helpers';
import {
  checkListingAvailability,
  formatDate,
  getBlockedDateRanges,
  getUnavailableDates,
} from '../../../utils/listings.helpers';

const MAX_DAYS_TO_CHECK_AVAILABILITY = 60;

interface Props {
  listing: Listing | null;
  error?: string;
  settings: BookingSettings | null;
  descriptionText?: string | null;
}

const ListingPage: NextPage<Props> = ({
  listing,
  settings,
  error,
  descriptionText,
}) => {
  const config = useConfig();
  const { LOCATION_COORDINATES, PLATFORM_LEGAL_ADDRESS } = config || {};
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
    currency: savedCurrency,
    useTokens: savedUseTokens,
  } = router.query || {};
  const guestsDropdownRef = useOutsideClick(
    handleClickOutsideDepartureDropdown,
  );

  const defaultCheckInDate = new Date().toISOString();
  const defaultCheckOutDate = dayjs(new Date()).add(7, 'day').toISOString();

  const [maxHorizon, maxDuration] = getMaxBookingHorizon(settings, isMember);

  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [start, setStartDate] = useState<string | null | Date>(
    (savedStartDate as string) || null,
  );
  const [end, setEndDate] = useState<string | null | Date>(
    (savedEndDate as string) || null,
  );
  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [doesNeedPickup, setDoesNeedPickup] = useState(false);
  const [doesNeedSeparateBeds, setDoesNeedSeparateBeds] = useState(false);
  const [rentalPrice, setRentalPrice] = useState<{ val: 0; cur: '' } | null>(
    null,
  );
  const [utilityPrice, setUtilityPrice] = useState<{ val: 0; cur: '' } | null>(
    null,
  );
  const [tokenPrice, setTokenPrice] = useState<{ val: 0; cur: '' } | null>(
    null,
  );

  const [apiError, setApiError] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isListingAvailable, setIsListingAvailable] = useState(true);

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

  const getAvailability = async (
    startDate: Date | string | null,
    endDate: Date | string | null,
  ) => {
    try {
      const {
        data: { results, availability },
      } = await api.post('/bookings/availability', {
        start: formatDate(startDate),
        end: formatDate(endDate),
        adults,
        children: kids,
        infants,
        pets,
        useTokens: isTokenPaymentSelected,
      });

      return { results, availability };
    } catch (error) {
      return { results: null, availability: null };
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
        const listingPrices = await fetchPrices();
        setIsListingAvailable(listingPrices.isListingAvailable);
        setRentalPrice(listingPrices?.prices[0]);
        setUtilityPrice(listingPrices?.prices[1]);
        setTokenPrice(listingPrices?.prices[2]);
      })();
    }
  }, [adults, start, end]);

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
    const { availability } = await getAvailability(
      availableStart,
      availableEnd,
    );
    const listingId = listing?._id;
    setUnavailableDates(getUnavailableDates(availability, listingId || null));

    const listingPrices = await fetchPrices();

    if (!listingPrices.isListingAvailable && !savedStartDate && !savedEndDate) {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchPrices = async () => {
    setApiError(null);
    try {
      const { availability, results } = await getAvailability(
        start || defaultCheckInDate,
        end || defaultCheckOutDate,
      );

      const isListingAvailable = checkListingAvailability(
        listing?._id,
        availability,
      );

      const currentListing = results?.filter((result: Listing) => {
        return result.name === listing?.name;
      });

      return {
        isListingAvailable,
        prices: currentListing.length
          ? [
              currentListing[0].rentalFiat,
              currentListing[0].utilityFiat,
              currentListing[0].rentalToken,
            ]
          : [0, 0, 0],
      };
    } catch (error) {
      setApiError(parseMessageFromError(error));
      return {
        isListingAvailable: false,
        prices: [0, 0, 0],
      };
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
            <section className="flex justify-left min-h-[400px]">
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
                    <GoogleMaps height={400} location={LOCATION_COORDINATES} />
                  </div>
                </div>

                <div className="min-w-[220px] w-full sm:w-auto  md:min-w-[280px] fixed left-0 bottom-0 sm:sticky sm:top-[100px]">
                  <Card className="bg-white flex-row sm:flex-col items-center border border-gray-100">
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
                            {priceFormat(
                              tokenPrice && tokenPrice?.val,
                              tokenPrice?.cur,
                            )}{' '}
                            +{' '}
                            {priceFormat(
                              utilityPrice && utilityPrice?.val,
                              utilityPrice?.cur,
                            )}
                          </div>
                        ) : (
                          <div className=" font-bold text-lg">
                            {priceFormat(
                              utilityPrice &&
                                rentalPrice &&
                                utilityPrice?.val + rentalPrice?.val,
                              utilityPrice?.cur,
                            )}
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
                          className="min-h-[20px] font-bold sm:font-normal underline sm:no-underline text-black border-0 sm:border-2 border-black normal-case w-auto sm:w-full py-1 px-0 sm:px-3 sm:p-3 sm:py-2 text-sm bg-white"
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
                          <div className="static sm:relative">
                            <Card className="border border-gray-100 absolute bottom-[125px] sm:top-0 left-0 sm:bottom-auto sm:left-auto right-auto sm:right-0 bg-white p-4 w-full sm:w-[350px]">
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
                              />
                              <div className="my-0 flex flex-row justify-between flex-wrap">
                                <label
                                  htmlFor="separateBeds"
                                  className="text-sm"
                                >
                                  {__('bookings_pickup')}
                                </label>
                                <Switch
                                  disabled={false}
                                  name="pickup"
                                  label=""
                                  onChange={setDoesNeedPickup}
                                  checked={doesNeedPickup}
                                />
                                <div className="w-full text-xs">
                                  {__('bookings_pickup_disclaimer')}
                                </div>
                              </div>
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
                            {dayjs(end).diff(dayjs(start), 'day') < 7 && (
                              <p className="text-left">
                                <span className="font-bold">
                                  {priceFormat(
                                    listing.fiatPrice.val,
                                    listing.fiatPrice.cur,
                                  )}{' '}
                                </span>
                                {__('listing_preview_per_night')}
                              </p>
                            )}
                            {dayjs(end).diff(dayjs(start), 'day') >= 7 &&
                              dayjs(end).diff(dayjs(start), 'day') < 30 && (
                                <p className="text-left">
                                  <span className="font-bold">
                                    {settings &&
                                      priceFormat(
                                        listing.fiatPrice.val *
                                          (1 - settings.discounts.weekly) *
                                          7,
                                        listing.fiatPrice.cur,
                                      )}{' '}
                                  </span>
                                  {__('listing_preview_per_week')}
                                </p>
                              )}
                            {dayjs(end).diff(dayjs(start), 'day') >= 30 && (
                              <p className="text-left">
                                <span className="font-bold">
                                  {settings &&
                                    priceFormat(
                                      listing.fiatPrice.val *
                                        (1 - settings.discounts.monthly) *
                                        30,
                                      listing.fiatPrice.cur,
                                    )}{' '}
                                </span>
                                {__('listing_preview_per_month')}
                              </p>
                            )}
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
                          {__('listing_not_available')}
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
                                ? priceFormat(tokenPrice?.val, tokenPrice?.cur)
                                : priceFormat(
                                    rentalPrice?.val,
                                    rentalPrice?.cur,
                                  )}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <p>{__('bookings_summary_step_utility_total')}</p>
                            <p>
                              {priceFormat(
                                utilityPrice?.val,
                                utilityPrice?.cur,
                              )}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <p>
                              {__('bookings_checkout_step_total_title')} (
                              {__('token_sale_checkout_vat')}):
                            </p>
                            <div className="font-bold text-right text-xl">
                              {currency === CURRENCIES[1] ? (
                                <div>
                                  {priceFormat(
                                    tokenPrice && tokenPrice?.val,
                                    tokenPrice?.cur,
                                  )}{' '}
                                  +{' '}
                                  {priceFormat(
                                    utilityPrice && utilityPrice?.val,
                                    utilityPrice?.cur,
                                  )}
                                </div>
                              ) : (
                                priceFormat(
                                  utilityPrice &&
                                    rentalPrice &&
                                    utilityPrice?.val + rentalPrice?.val,
                                  utilityPrice?.cur,
                                )
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Information>{__('listing_not_available')}</Information>
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
