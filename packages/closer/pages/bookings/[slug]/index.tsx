import Head from 'next/head';

import { useState } from 'react';

import BookingRequestButtons from '../../../components/BookingRequestButtons';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import UserInfoButton from '../../../components/UserInfoButton';
import { Button, Card, Information } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { MAX_LISTINGS_TO_FETCH, STATUS_COLOR } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { usePlatform } from '../../../contexts/platform';
import {
  Booking,
  BookingConfig,
  Event,
  GeneralConfig,
  Listing,
  PaymentConfig,
  VolunteerOpportunity,
} from '../../../types';
import { FoodOption } from '../../../types/food';
import api from '../../../utils/api';
import {
  convertToDateString,
  dateToPropertyTimeZone,
  formatCheckinDate,
  formatCheckoutDate,
  getAccommodationTotal,
  getFiatTotal,
  getFoodTotal,
  getPaymentDelta,
  getUtilityTotal,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { getBookingRate, getDiscountRate } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

dayjs.extend(LocalizedFormat);

interface Props {
  booking: Booking;
  error?: string;
  listing: Listing;
  event: Event;
  volunteer: VolunteerOpportunity;
  bookingCreatedBy: User;
  bookingConfig: BookingConfig | null;
  listings: Listing[];
  generalConfig: GeneralConfig;
  paymentConfig: PaymentConfig | null;
  foodOptions: FoodOption[];
}

const BookingPage = ({
  booking,
  listing,
  event,
  volunteer,
  error,
  bookingCreatedBy,
  bookingConfig,
  listings,
  generalConfig,
  paymentConfig,
  foodOptions,
}: Props) => {
  const t = useTranslations();

  const { timeZone } = generalConfig;

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { platform }: any = usePlatform();
  const { isAuthenticated, user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const isEditMode = true;

  const isHourlyBooking = listing?.priceDuration !== 'night';

  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    useCredits,
    children,
    pets,
    infants,
    start: bookingStart,
    end: bookingEnd,
    adults,
    volunteerId,
    ticketOption,
    eventFiat,
    total,
    doesNeedSeparateBeds,
    doesNeedPickup,
    createdBy,
    _id,
    created,
    isTeamBooking,
    eventPrice,
    foodOption,
    foodOptionId,
    foodFiat,
  } = booking || {};

  const selectedFoodOption = foodOptions?.find(
    (option) => option._id === foodOptionId,
  );

  const userInfo = bookingCreatedBy && {
    name: bookingCreatedBy.screenname,
    photo: bookingCreatedBy.photo,
  };

  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const [status, setStatus] = useState(booking?.status);
  const [updatedAdults, setUpdatedAdults] = useState(adults);
  const [updatedChildren, setUpdatedChildren] = useState(children);
  const [updatedInfants, setUpdatedInfants] = useState(infants);
  const [updatedPets, setUpdatedPets] = useState(pets);
  const [updatedStartDate, setUpdatedStartDate] = useState<
    string | Date | null
  >(timeZone && dateToPropertyTimeZone(timeZone, bookingStart));

  const [updatedEndDate, setUpdatedEndDate] = useState<string | Date | null>(
    timeZone && dateToPropertyTimeZone(timeZone, bookingEnd),
  );
  const [updatedListingId, setUpdatedListingId] = useState(listing?._id);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);

  const checkInTime = bookingConfig?.checkinTime || 14;
  const checkOutTime = bookingConfig?.checkoutTime || 11;

  const setters = {
    setUpdatedAdults,
    setUpdatedChildren,
    setUpdatedInfants,
    setUpdatedPets,
    setUpdatedEndDate,
    setUpdatedStartDate,
    setUpdatedListingId,
  };
  const isNotPaid =
    status !== 'paid' &&
    status !== 'credits-paid' &&
    status !== 'tokens-staked';

  let updatedDuration = 0;

  updatedDuration = Math.ceil(
    dayjs(updatedEndDate).diff(dayjs(updatedStartDate), 'hour') / 24,
  );
  if (isHourlyBooking) {
    updatedDuration = dayjs(updatedEndDate).diff(
      dayjs(updatedStartDate),
      'hour',
    );
  }

  const updatedListing = listings?.find(
    (listing) => listing._id === updatedListingId,
  );
  const updatedMaxBeds = updatedListing?.beds || 1;

  const updatedDurationName = getBookingRate(updatedDuration);
  const updatedDiscountRate = bookingConfig
    ? 1 - getDiscountRate(updatedDurationName, bookingConfig)
    : 0;

  const updatedAccomodationTotal = getAccommodationTotal(
    updatedListing,
    useTokens,
    useCredits,
    updatedAdults,
    updatedDuration,
    updatedDiscountRate,
    volunteerId,
    isTeamBooking,
  );

  const updatedUtilityTotal = getUtilityTotal({
    utilityFiatVal: bookingConfig?.utilityFiatVal,
    updatedAdults,
    updatedDuration,
    discountRate: updatedDiscountRate,
    isTeamBooking,
    isUtilityOptionEnabled: bookingConfig?.utilityOptionEnabled || false,
  });

  const updatedFoodTotal = getFoodTotal({
    isHourlyBooking,
    foodPrice: selectedFoodOption?.price || 0,
    durationInDays: updatedDuration,
    adults:  updatedAdults,
    isFoodOptionEnabled: Boolean(selectedFoodOption?._id) || false,
    isTeamMember: isTeamBooking || false,
  });

  const updatedEventTotal = (eventPrice?.val || 0) * updatedAdults || 0;

  const updatedFiatTotal = getFiatTotal({
    isTeamBooking: Boolean(isTeamBooking),
    foodPrice: selectedFoodOption?.price || 0,
    foodTotal: updatedFoodTotal,
    utilityTotal: updatedUtilityTotal,
    accommodationFiatTotal: updatedAccomodationTotal,
    eventTotal: updatedEventTotal,
    useTokens,
    useCredits,
  });

  const paymentDelta = isNotPaid
    ? null
    : getPaymentDelta(
        total?.val,
        updatedFiatTotal,
        useTokens,
        useCredits,
        rentalToken,
        updatedAccomodationTotal,
        rentalFiat?.cur,
      );

  const updatedBooking = {
    ...booking,
    start: formatCheckinDate(
      convertToDateString(updatedStartDate),
      timeZone,
      checkInTime,
    ),
    end: formatCheckoutDate(
      convertToDateString(updatedEndDate),
      timeZone,
      checkOutTime,
    ),
    duration: updatedDuration,
    adults: updatedAdults,
    children: updatedChildren,
    pets: updatedPets,
    infants: updatedInfants,
    utilityFiat: { val: updatedUtilityTotal, cur: rentalFiat?.cur },
    rentalFiat:
      useTokens || useCredits
        ? rentalFiat
        : { val: updatedAccomodationTotal, cur: rentalFiat?.cur },
    rentalToken:
      useTokens || useCredits
        ? { val: updatedAccomodationTotal, cur: rentalToken?.cur }
        : booking?.rentalToken,
    ...(eventFiat
      ? {
          eventFiat: {
            val: updatedEventTotal,
            cur: eventFiat?.cur,
            _id: eventFiat?._id,
          },
        }
      : null),
    listing: updatedListingId,
    foodFiat: { val: updatedFoodTotal, cur: rentalFiat?.cur },
    total: { val: updatedFiatTotal, cur: rentalFiat?.cur },
    paymentDelta: paymentDelta ? paymentDelta : null,
  };

  if (booking?.paymentDelta) {
    booking.paymentDelta = null;
  }

  const hasUpdatedBooking =
    JSON.stringify(booking) !== JSON.stringify(updatedBooking);

  const refetchStatus = async () => {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${_id}`);

    setStatus(booking.status);
  };

  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
    await refetchStatus();
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
    await refetchStatus();
  };

  const handleSaveBooking = async () => {
    try {
      setIsLoading(true);
      const res = await api.patch(`/booking/${_id}`, updatedBooking);
      setHasUpdated(false);
      if (res.status === 200) {
        setHasUpdated(true);
        setTimeout(() => {
          setHasUpdated(false);
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.log('error=', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (
    !booking ||
    !isBookingEnabled ||
    (user?._id !== booking.createdBy && !isSpaceHost)
  ) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <Head>
        <title>{`${t('bookings_summary_step_dates_title')}`}</title>
        <meta
          name="description"
          content={`${t('bookings_summary_step_dates_title')}`}
        />
        <meta property="og:type" content="booking" />
      </Head>
      <main className="main-content max-w-prose booking flex flex-col gap-8">
        <Heading className="mb-4">
          {t(`bookings_title_${booking.status}`)}
        </Heading>

        <section className="flex flex-col gap-2 mb-6">
          <div className="text-sm text-disabled">
            <p>{createdFormatted}</p>
            <p>
              {t('bookings_id')} <b>{booking._id}</b>
            </p>
          </div>
          {booking?.adminBookingReason && (
            <Card className="bg-accent text-white my-4 font-bold">
              {booking?.adminBookingReason}
            </Card>
          )}

          <p
            className={`bg-${STATUS_COLOR[status]}  mt-2 
            capitalize opacity-100 text-base p-1 text-white text-center rounded-md`}
          >
            {status}
          </p>
          {isSpaceHost && (
            <UserInfoButton userInfo={userInfo} createdBy={createdBy} />
          )}
        </section>

        {isSpaceHost &&
          booking.roomOrBedNumbers &&
          booking.roomOrBedNumbers.length > 0 && (
            <section className="rounded-md p-4 bg-accent-light">
              {
                <p className="font-bold">
                  {listing.private
                    ? t('booking_card_room_number')
                    : t('booking_card_bed_numbers')}{' '}
                  {booking.roomOrBedNumbers &&
                    booking.roomOrBedNumbers.toString()}
                </p>
              }
            </section>
          )}

        <section className="flex flex-col gap-12">
          <SummaryDates
            isDayTicket={booking?.isDayTicket}
            totalGuests={isSpaceHost ? updatedAdults : adults}
            kids={isSpaceHost ? updatedChildren : children}
            infants={isSpaceHost ? updatedInfants : infants}
            pets={isSpaceHost ? updatedPets : pets}
            startDate={isSpaceHost ? updatedStartDate : bookingStart}
            endDate={isSpaceHost ? updatedEndDate : bookingEnd}
            listingName={listing?.name}
            listingUrl={listing?.slug}
            volunteerId={volunteerId}
            eventName={event?.name}
            volunteerName={volunteer?.name}
            ticketOption={ticketOption?.name}
            doesNeedPickup={doesNeedPickup}
            doesNeedSeparateBeds={doesNeedSeparateBeds}
            isEditMode={isSpaceHost && isEditMode}
            setters={setters}
            updatedListingId={updatedListingId}
            listings={listings}
            updatedMaxBeds={updatedMaxBeds}
            priceDuration={listing?.priceDuration}
            workingHoursStart={listing?.workingHoursStart}
            workingHoursEnd={listing?.workingHoursEnd}
            listingId={listing?._id}
          />
          <SummaryCosts
            isFoodIncluded={Boolean(booking?.foodOptionId)}
            utilityFiat={utilityFiat}
            foodFiat={foodFiat}
            useTokens={useTokens}
            useCredits={useCredits}
            accomodationCost={
              useTokens || useCredits ? rentalToken : rentalFiat
            }
            totalToken={rentalToken}
            totalFiat={total}
            eventCost={eventFiat}
            eventDefaultCost={
              ticketOption?.price ? ticketOption.price * adults : undefined
            }
            accomodationDefaultCost={listing?.fiatPrice?.val * adults}
            volunteerId={volunteerId}
            isNotPaid={isNotPaid}
            updatedAccomodationTotal={{
              val: updatedAccomodationTotal,
              cur: useTokens ? rentalToken.cur : rentalFiat?.cur,
            }}
            isEditMode={isSpaceHost}
            updatedUtilityTotal={{
              val: updatedUtilityTotal,
              cur: utilityFiat?.cur,
            }}
            updatedFoodTotal={{
              val: updatedFoodTotal,
              cur: utilityFiat?.cur,
            }}
            updatedFiatTotal={{
              val: updatedFiatTotal,
              cur: rentalFiat?.cur,
            }}
            updatedEventTotal={{
              val: updatedEventTotal,
              cur: eventFiat?.cur,
            }}
            priceDuration={listing?.priceDuration}
            vatRate={vatRate}
          />
        </section>

        <section>
          {isSpaceHost && (
            <div className="flex flex-col gap-4">
              <Button
                isLoading={isLoading}
                onClick={handleSaveBooking}
                isEnabled={hasUpdatedBooking && !isLoading}
              >
                {t('booking_card_save_booking')}
              </Button>
              {hasUpdated && (
                <Information>{t('booking_card_booking_updated')}</Information>
              )}
            </div>
          )}

          <BookingRequestButtons
            _id={_id}
            status={status}
            createdBy={createdBy}
            end={bookingEnd}
            start={bookingStart}
            confirmBooking={confirmBooking}
            rejectBooking={rejectBooking}
          />
        </section>

        {booking.status === 'confirmed' && (
          <section className="mt-3">{t('bookings_confirmation')}</section>
        )}
      </main>
    </>
  );
};

BookingPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [
      bookingRes,
      bookingConfigRes,
      listingRes,
      generalConfigRes,
      paymentConfigRes,
      foodRes,
      messages,
    ] = await Promise.all([
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
      api
        .get('/listing', {
          params: {
            limit: MAX_LISTINGS_TO_FETCH,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/payment').catch(() => {
        return null;
      }),
      api.get('/food').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;
    const generalConfig = generalConfigRes?.data?.results?.value;

    const listings = listingRes?.data?.results;
    const paymentConfig = paymentConfigRes?.data?.results?.value;

    const foodOptions = foodRes?.data?.results;

    const [optionalEvent, optionalListing, optionalVolunteer] =
      await Promise.all([
        booking.eventId &&
          api.get(`/event/${booking.eventId}`, {
            headers: (req as NextApiRequest)?.cookies?.access_token && {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            },
          }),
        booking.listing &&
          api.get(`/listing/${booking.listing}`, {
            headers: (req as NextApiRequest)?.cookies?.access_token && {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            },
          }),
        booking.volunteerId &&
          api.get(`/volunteer/${booking.volunteerId}`, {
            headers: (req as NextApiRequest)?.cookies?.access_token && {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            },
          }),
      ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;
    const volunteer = optionalVolunteer?.data?.results;

    let bookingCreatedBy = null;
    try {
      const optionalCreatedBy =
        booking.createdBy &&
        (await api.get(`/user/${booking.createdBy}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }));
      bookingCreatedBy = optionalCreatedBy?.data?.results;
    } catch (error) {}

    return {
      booking,
      listing,
      event,
      volunteer,
      error: null,
      bookingCreatedBy,
      bookingConfig,
      generalConfig,
      listings,
      messages,
      paymentConfig,
      foodOptions,
    };
  } catch (err: any) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      event: null,
      volunteer: null,
      createdBy: null,
      bookingConfig: null,
      generalConfig: null,
      listings: null,
      messages: null,
      paymentConfig: null,
      foodOptions: null,
    };
  }
};

export default BookingPage;
