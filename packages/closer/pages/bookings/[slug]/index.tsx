import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect, useState } from 'react';

import BookingRequestButtons from '../../../components/BookingRequestButtons';
import Charges from '../../../components/Charges';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import UserInfoButton from '../../../components/UserInfoButton';
import { Button, Card, Information } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select/Dropdown';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { HeadingRow, Tag, useConfig } from '../../..';
import { MAX_LISTINGS_TO_FETCH, STATUS_COLOR } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { usePlatform } from '../../../contexts/platform';
import { PaymentType } from '../../../types';
import {
  Booking,
  BookingConfig,
  Event,
  GeneralConfig,
  Listing,
  PaymentConfig,
  Project,
  UpdatedPrices,
  VolunteerOpportunity,
} from '../../../types';
import { FoodOption } from '../../../types/food';
import api from '../../../utils/api';
import {
  convertToDateString,
  dateToPropertyTimeZone,
  formatCheckinDate,
  formatCheckoutDate,
  getBookingPaymentType,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

dayjs.extend(LocalizedFormat);

const statusOptions = [
  { label: 'Pending Payment', value: 'pending-payment' },
  { label: 'Pending', value: 'pending' },
  { label: 'Pending Refund', value: 'pending-refund' },
  { label: 'Paid', value: 'paid' },
  { label: 'Credits Paid', value: 'credits-paid' },
  { label: 'Tokens Staked', value: 'tokens-staked' },
  { label: 'Cancelled', value: 'cancelled' },
];

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
  projects: Project[];
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
  projects,
}: Props) => {
  const t = useTranslations();

  const config = useConfig();
  const { timeZone } = generalConfig || { timeZone: config.DEFAULT_TIMEZONE };
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
    ticketOption,
    eventFiat,
    total,
    doesNeedSeparateBeds,
    doesNeedPickup,
    createdBy,
    _id,
    created,
    foodFiat,
    roomOrBedNumbers,
    volunteerInfo,
  } = booking || {};

  const userInfo = bookingCreatedBy && {
    name: bookingCreatedBy.screenname,
    photo: bookingCreatedBy.photo,
  };

  const [payerInfo, setPayerInfo] = useState<{
    name: string;
    photo: string;
  } | null>(null);

  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const [status, setStatus] = useState(booking?.status);
  const [updatedRoomNumbers, setUpdatedRoomNumbers] =
    useState(roomOrBedNumbers);
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
  const [updatedPrices, setUpdatedPrices] = useState<UpdatedPrices | null>(
    null,
  );
  const [updatedStatus, setUpdatedStatus] = useState<string | undefined>(
    booking?.status,
  );
  const [amountToRefund, setAmountToRefund] = useState<number | undefined>(
    Math.abs(booking?.paymentDelta?.fiat.val || 0),
  );

  const paymentType = getBookingPaymentType({
    useCredits,
    useTokens,
    rentalFiat,
  });

  const canEditBooking =
    paymentType === PaymentType.FULL_TOKENS ||
    paymentType === PaymentType.PARTIAL_TOKENS ||
    paymentType === PaymentType.FULL_CREDITS ||
    paymentType === PaymentType.PARTIAL_CREDITS ||
    paymentType === 'fiat';

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
    status !== 'tokens-staked' &&
    status !== 'checked-in' &&
    status !== 'checked-out' &&
    status !== 'cancelled' &&
    status !== 'pending-refund';

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

  useEffect(() => {
    const fetchUpdatedPrice = async () => {
      const paymentType = getBookingPaymentType({
        useCredits,
        useTokens,
        rentalFiat,
      });
      try {
        const res = await api.post('/bookings/calculate-totals', {
          bookingId: booking._id,
          updatedAdults,
          updatedDuration,
          updatedChildren,
          updatedInfants,
          updatedPets,
          updatedStart: updatedStartDate,
          updatedEnd: updatedEndDate,
          updatedListingId,
          isBookingEdit: true,
          paymentType,
        });

        setUpdatedPrices(res.data.results);
      } catch (error) {
        console.error('Error fetching updated prices:', error);
      }
    };

    if (isSpaceHost && isEditMode) {
      fetchUpdatedPrice();
    }
  }, [
    updatedAdults,
    updatedChildren,
    updatedInfants,
    updatedPets,
    updatedStartDate,
    updatedEndDate,
    updatedListingId,
    isSpaceHost,
    isEditMode,
  ]);

  useEffect(() => {
    const fetchPayerInfo = async () => {
      if (!booking?.paidBy) {
        setPayerInfo(null);
        return;
      }

      try {
        const {
          data: { results },
        } = await api.get(`/user/${booking.paidBy}`);
        setPayerInfo({
          name: results.screenname || results.name || '',
          photo: results.photo || '',
        });
      } catch (error) {
        console.error('Error fetching payer info:', error);
        setPayerInfo(null);
      }
    };

    fetchPayerInfo();
  }, [booking?.paidBy]);

  console.log('--------------------------------');
  console.log('updatedPrices==>', updatedPrices);

  const updatedAccomodationTotal =
    useTokens || useCredits
      ? updatedPrices?.rentalToken?.val || 0
      : updatedPrices?.rentalFiat?.val || 0;

  const updatedRentalFiat = updatedPrices?.rentalFiat || 0;
  const updatedRentalToken = updatedPrices?.rentalToken || 0;
  const updatedUtilityTotal = updatedPrices?.utilityFiat?.val || 0;
  const updatedFoodTotal = updatedPrices?.foodFiat?.val || 0;
  const updatedEventTotal = updatedPrices?.eventFiat?.val || 0;
  const updatedFiatTotal = updatedPrices?.total?.val || 0;

  console.log('updatedRentalFiat==>', updatedRentalFiat);
  console.log('updatedRentalToken==>', updatedRentalToken);

  console.log('booking==>', booking);

  // TODO:update paymentDelta, dailyrentaltoken, total, rentalfiat !!!!!!!!! don't update rentalfiat
  // when the price of token booking updated, but payment delta is not zero, rentalFiAt should match paymentdelta

  const updatedBookingValues = {
    ...(updatedStatus &&
      updatedStatus !== booking?.status && { overrideStatus: updatedStatus }),
    ...(Math.abs(booking?.paymentDelta?.fiat.val || 0) !== amountToRefund && {
      overridePaymentDelta: {
        fiat: {
          val: 0,
        },
      },
    }),
    adults: updatedAdults,
    duration: updatedDuration,
    children: updatedChildren,
    infants: updatedInfants,
    pets: updatedPets,
    roomOrBedNumbers:
      updatedAdults !== adults
        ? updatedRoomNumbers?.slice(0, updatedAdults)
        : updatedRoomNumbers,
    listing: updatedListingId,
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
  };

  const updatedBooking = {
    ...booking,
    ...(updatedStatus !== booking?.status && { overrideStatus: updatedStatus }),
    ...(Math.abs(booking?.paymentDelta?.fiat.val || 0) !== amountToRefund && {
      overridePaymentDelta: {
        fiat: {
          val: 0,
        },
      },
    }),
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
    roomOrBedNumbers:
      updatedAdults !== adults
        ? updatedRoomNumbers?.slice(0, updatedAdults)
        : updatedRoomNumbers,
    utilityFiat: { val: updatedUtilityTotal, cur: rentalFiat?.cur },
    rentalFiat: updatedRentalFiat,
    rentalToken:
      useTokens || useCredits
        ? { val: updatedRentalToken, cur: rentalToken?.cur }
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
    dailyRentalToken: updatedRentalToken,
    listing: updatedListingId,
    foodFiat: { val: updatedFoodTotal, cur: rentalFiat?.cur },
    total: { val: updatedFiatTotal, cur: rentalFiat?.cur },
  };

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
      const res = await api.post('/bookings/update', {
        updatedBookingValues,
        bookingId: _id,
        paymentType,
      });
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

  const handleUpdateRoomNumbers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRoomNumbers = e.target.value
      .split(',')
      .map((num) => parseInt(num.trim(), 10));
    if (e.target.value) {
      setUpdatedRoomNumbers(newRoomNumbers);
    }
  };

  if (
    !booking ||
    !isBookingEnabled ||
    (user?._id !== booking.createdBy &&
      user?._id !== booking.paidBy &&
      !isSpaceHost)
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
      <main className="main-content max-w-xl booking flex flex-col gap-8">
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

          {booking?.status !== 'pending' &&
          booking?.status !== 'pending-refund' &&
          isNotPaid &&
          (user?._id === createdBy || user?._id === booking?.paidBy) ? (
            <Link href={`/bookings/${_id}/checkout`} passHref>
              <Button variant="primary" className="w-full">
                {t('checkout_complete_payment')}
              </Button>
            </Link>
          ) : (
            <p
              className={`bg-${STATUS_COLOR[status]}  mt-2
              capitalize opacity-100 text-base p-1 text-white text-center rounded-md`}
            >
              {status}
            </p>
          )}
        </section>

        {isSpaceHost &&
          booking.roomOrBedNumbers &&
          booking.roomOrBedNumbers.length > 0 && (
            <section className="rounded-md p-4 bg-accent-light">
              <p className="font-bold">
                {listing.private
                  ? t('booking_card_room_number')
                  : t('booking_card_bed_numbers')}{' '}
                {booking.roomOrBedNumbers &&
                  booking.roomOrBedNumbers.toString()}
              </p>
              <div className="flex flex-col gap-2">
                <label htmlFor="roomNumbers">
                  {roomOrBedNumbers && roomOrBedNumbers?.length > 0
                    ? 'Enter new bed numbers (comma delimited, must match updated number of adults):'
                    : 'Enter new room number:'}
                </label>
                <Input
                  onChange={handleUpdateRoomNumbers}
                  placeholder="Number (s)"
                  id="roomNumbers"
                  type="text"
                  className="w-[100px] bg-white py-0.5 px-2"
                />
              </div>
            </section>
          )}

        {booking.volunteerInfo && (
          <section className="flex flex-col gap-4">
            {booking.volunteerInfo.bookingType === 'volunteer' ? (
              <HeadingRow>
                {t('projects_volunteer_application_title')}
              </HeadingRow>
            ) : (
              <HeadingRow>
                {t('projects_residence_application_title')}
              </HeadingRow>
            )}

            {booking?.volunteerInfo?.projectId &&
              booking?.volunteerInfo?.projectId?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Heading level={5}>{t('projects_build_title')}</Heading>
                  {booking.volunteerInfo.projectId?.map((projectId) => (
                    <p key={projectId}>
                      <Link
                        href={`/projects/${
                          projects?.find((project) => project._id === projectId)
                            ?.slug ?? projectId
                        }`}
                      >
                        {
                          projects?.find((project) => project._id === projectId)
                            ?.name
                        }
                      </Link>
                    </p>
                  ))}
                </div>
              )}

            <Heading level={5}>
              {t('projects_skills_and_qualifications_title')}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {booking.volunteerInfo.skills?.map((skill) => (
                <Tag color="primary" size="small" key={skill}>
                  {skill}
                </Tag>
              ))}
            </div>
            <Heading level={5}>{t('projects_food_title')}</Heading>
            <div className="flex flex-wrap gap-2">
              {booking.volunteerInfo.diet?.map((diet) => (
                <Tag color="primary" size="small" key={diet}>
                  {diet}
                </Tag>
              ))}
            </div>
            <Heading level={5}>{t('projects_suggestions_title')}</Heading>
            <p>
              {!booking.volunteerInfo.suggestions
                ? 'No suggestions'
                : booking.volunteerInfo.suggestions}
            </p>
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
            isVolunteer={volunteerInfo?.bookingType === 'volunteer'}
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

          <div className="flex flex-col gap-4">
            <Heading level={3}>{t('bookings_dates_step_guests_title')}</Heading>
            {(payerInfo || userInfo) && (
              <UserInfoButton
                userInfo={{
                  ...(payerInfo || userInfo),
                  name:
                    (payerInfo || userInfo)?.name +
                    (adults > 1 ? ` +${adults - 1}` : ''),
                }}
                createdBy={payerInfo ? booking?.paidBy || '' : createdBy}
                size="md"
              />
            )}
          </div>

          <SummaryCosts
            rentalFiat={rentalFiat}
            rentalToken={rentalToken}
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
            updatedRentalFiat={
              updatedRentalFiat || { val: 0, cur: rentalFiat?.cur }
            }
            updatedRentalToken={
              updatedRentalToken || { val: 0, cur: rentalToken?.cur }
            }
            priceDuration={listing?.priceDuration}
            vatRate={vatRate}
            status={status}
          />

          {isSpaceHost && booking?.charges && booking.charges.length > 0 && (
            <Charges charges={booking.charges} />
          )}

          <div className="bg-accent-light rounded-md p-4 space-y-2">
            <label className=" font-bold">
              {t('booking_card_set_booking_status')}
            </label>
            <Select
              className="rounded-full  border-black"
              value={updatedStatus}
              options={statusOptions}
              onChange={(value: string) => setUpdatedStatus(value)}
              isRequired
              placeholder={t('booking_card_set_booking_status')}
            />
          </div>

          {booking.paymentDelta?.token?.val &&
          (paymentType === PaymentType.FULL_TOKENS ||
            paymentType === PaymentType.PARTIAL_TOKENS) ? (
            <div className="flex justify-between gap-2 p-4 bg-accent-light rounded-md">
              <div className="font-bold space-y-4">
                <p>
                  {booking.paymentDelta?.token.val >= 0
                    ? t('bookings_amount_due')
                    : t('bookings_amount_to_refund')}
                </p>

                <div className="flex gap-2 items-center">
                  <p className="font-bold">
                    {booking.paymentDelta?.token.cur}
                    {Math.abs(booking.paymentDelta?.token?.val || 0)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {booking.paymentDelta?.fiat.val ? (
            <div className="flex justify-between gap-2 p-4 bg-accent-light rounded-md">
              <div className="font-bold space-y-4">
                <p>
                  {booking.paymentDelta?.fiat.val >= 0
                    ? t('bookings_amount_due')
                    : t('bookings_amount_to_refund')}
                </p>

                <div className="flex gap-2 items-center">
                  <div className="font-bold">
                    {booking.paymentDelta?.fiat.cur} {amountToRefund?.toString()}
                  </div>
           
                </div>
              </div>
              {booking.paymentDelta?.fiat.val < 0 && (
                <p>
                  {' '}
                  <Link
                    className="font-bold"
                    href={`https://dashboard.stripe.com/payments/${
                      booking.charges?.at(-1)?.meta.stripePaymentIntentId
                    }`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('bookings_go_to_stripe_dashboard')}
                  </Link>
                </p>
              )}
            </div>
          ) : null}
        </section>

        <section>
          {!canEditBooking && (
            <div className="bg-yellow-100 rounded-md p-4 space-y-2 font-bold mb-8">
              WARNING: editing this type of booking is not currently supported.
              Please handle these operations manually.
            </div>
          )}

          {isSpaceHost && (
            <div className="flex flex-col gap-4">
              <Button
                isLoading={isLoading}
                onClick={handleSaveBooking}
                isEnabled={hasUpdatedBooking && !isLoading && canEditBooking}
              >
                {t('booking_card_save_booking')}
              </Button>
              {hasUpdated && (
                <Information>{t('booking_card_booking_updated')}</Information>
              )}
            </div>
          )}
          <BookingRequestButtons
            isFiatBooking={!booking.useCredits && !booking.useTokens}
            _id={_id}
            status={status}
            createdBy={createdBy}
            paidBy={booking?.paidBy}
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
      projectsRes,
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
      api.get('/project').catch(() => {
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
    const projects = projectsRes?.data?.results;

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
      projects,
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
      projects: null,
    };
  }
};

export default BookingPage;
