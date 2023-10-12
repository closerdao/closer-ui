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
  checkListingAvaialbility,
  formatDate,
} from '../../../utils/listings.helpers';

interface Props {
  listing: Listing | null;
  error?: string;
  settings: BookingSettings | null;
}

const ListingPage: NextPage<Props> = ({ listing, settings, error }) => {
  const config = useConfig();
  const { LOCATION_COORDINATES } = config || {};
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

  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [start, setStartDate] = useState<string | null | Date>(
    (savedStartDate as string) || (defaultCheckInDate as string),
  );
  const [end, setEndDate] = useState<string | null | Date>(
    (savedEndDate as string) || (defaultCheckOutDate as string),
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
  const [isListingAvailable, setIsListingAvailable] = useState(false);

  const [currency, setCurrency] = useState<CloserCurrencies>(
    savedUseTokens === 'true' ? CURRENCIES[1] : DEFAULT_CURRENCY,
  );

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';

  const photo = listing && listing.photos && listing.photos[0];

  const isTokenPaymentSelected =
    savedUseTokens === 'true' || currency === CURRENCIES[1];

  useEffect(() => {
    if (savedStartDate) {
      setStartDate(savedStartDate as string);
    }
    if (savedEndDate) {
      setEndDate(savedEndDate as string);
    }
    setStartDate(defaultCheckInDate);
    setEndDate(defaultCheckOutDate);
  }, [router.query]);

  useEffect(() => {
    (async () => {
      const listingPrices = await fetchPrices();
      setIsListingAvailable(listingPrices.isListingAvailable);
      setRentalPrice(listingPrices?.prices[0]);
      setUtilityPrice(listingPrices?.prices[1]);
      setTokenPrice(listingPrices?.prices[2]);
    })();
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

  function getBlockedDateRanges() {
    const [maxHorizon, maxDuration] = getMaxBookingHorizon(settings, isMember);
    const dateRanges: any[] = [];
    dateRanges.push({ before: new Date() });
    dateRanges.push({
      after: new Date().setDate(new Date().getDate() + maxHorizon),
    });

    if (start) {
      dateRanges.push({
        after: new Date(
          new Date(start as string).getTime() +
            maxDuration * 24 * 60 * 60 * 1000,
        ),
      });
      dateRanges.push({
        before: new Date(
          new Date(end as string).getTime() - maxDuration * 24 * 60 * 60 * 1000,
        ),
      });
      dateRanges.push({
        before: new Date(
          new Date(start as string).getTime() -
            maxDuration * 24 * 60 * 60 * 1000,
        ),
      });
    }
    if (end) {
      dateRanges.push({
        before: new Date(
          new Date(start as string).getTime() -
            maxDuration * 24 * 60 * 60 * 1000,
        ),
      });
    }
    return dateRanges;
  }

  const bookListing = async () => {
    if (!isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
    setApiError(null);
    try {
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        useTokens: currency === CURRENCIES[1],
        start: String(start),
        end: String(end),
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

      router.push(`/bookings/${newBooking._id}/summary?back=${listing?.slug}`);
    } catch (err: any) {
      setApiError(err);
    } finally {
    }
  };

  const fetchPrices = async () => {
    setApiError(null);
    try {
      const {
        data: { results, availability },
      } = await api.post('/bookings/availability', {
        start: formatDate(start),
        end: formatDate(end),
        adults,
        children: kids,
        infants,
        pets,
        useTokens: isTokenPaymentSelected,
      });

      const isListingAvailable = checkListingAvaialbility(
        listing?._id,
        availability,
      );

      const currentListing = results.filter((result: any) => {
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
        prices: [0, 0],
      };
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
        <meta name="description" content={listing.description} />
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
            <section className="flex justify-left min-h-[400px] ">
              <div className="max-w-4xl w-full  flex flex-col sm:flex-row place-items-start justify-between">
                <div className="w-auto p-2 sm:pr-8 flex flex-col">
                  <div className="flex flex-col gap-6 ">
                    <section>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: listing.description,
                        }}
                      />
                    </section>

                    {/* TODO: possible alternative to hardcoding amenities is adding this block to listing description with new rich text editor */}
                    <Heading level={2} className="text-lg uppercase mt-6">
                      Amenities:
                    </Heading>
                    <div className="flex gap-6">
                      <div className="flex flex-col gap-6 w-1/2">
                        <div>
                          <Heading level={3} className="text-lg">
                            🍽️ Food
                          </Heading>
                          <ul className="list-disc pl-5">
                            <li>Farm to table experience</li>
                            <li>
                              Breakfast is self serve, lunch and dinner are
                              cocreated
                            </li>
                            <li>Food is included in your utitity fee</li>
                          </ul>
                        </div>
                        <div>
                          <Heading level={3} className="text-lg">
                            💦 Sauna
                          </Heading>
                          We have a wood fired sauna available
                        </div>
                        <div>
                          <Heading level={3} className="text-lg">
                            💻 Work
                          </Heading>
                          Starlink Wifi Coworking space
                        </div>
                      </div>

                      <div className="flex flex-col gap-6 w-1/2">
                        <div>
                          <Heading level={3} className="text-lg">
                            🛁 Bathroom
                          </Heading>
                          <ul className="list-disc pl-5">
                            <li>Compost toilets on the land</li>
                            <li>Outdoor showers (hot + cold)</li>
                          </ul>
                        </div>

                        <div>
                          <Heading level={3} className="text-lg">
                            {' '}
                            🌳 Nature{' '}
                          </Heading>
                          You will be surrounded by a 5ha playground with over
                          3k trees planted
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className=" my-16 flex flex-col gap-6">
                    <Heading level={2} className="text-lg uppercase mt-6">
                      {__('listing_preview_location')}
                    </Heading>
                    <Heading level={3} className="text-md font-normal">
                      {__('listing_preview_address')}
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
                          end={(savedEndDate as string) || end}
                          start={(savedStartDate as string) || start}
                          isSmallScreen={isSmallScreen}
                          blockedDateRanges={getBlockedDateRanges()}
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

                        <Button
                          onClick={bookListing}
                          isEnabled={Boolean(
                            start && end && isListingAvailable,
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
                      {isListingAvailable ? (
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
  try {
    const [listing, settings] = await Promise.all([
      await api.get(`/listing/${query.slug}`),
      await api.get('/config/booking'),
    ]);

    return {
      listing: listing.data.results,
      settings: settings.data.results.value,
    };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      listing: null,
      settings: null,
    };
  }
};

export default ListingPage;
