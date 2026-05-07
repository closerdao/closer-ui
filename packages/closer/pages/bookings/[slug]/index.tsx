import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useMemo, useState } from 'react';

import BookingRequestButtons from '../../../components/BookingRequestButtons';
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
import {
  Booking,
  BookingConfig,
  CloserCurrencies,
  Event,
  GeneralConfig,
  Listing,
  PaymentConfig,
  PaymentType,
  Project,
  UpdatedPrices,
  VolunteerOpportunity,
} from '../../../types';
import { FoodOption } from '../../../types/food';
import config from '../../../configCached';
import { useBookingLinkedCharges } from '../../../hooks/useBookingLinkedCharges';
import api from '../../../utils/api';
import { mergeBookingLedgerCharges } from '../../../utils/bookingChargesLedger.helpers';
import { getBearerAuthHeaders } from '../../../utils/authHeaders.helpers';
import {
  areNumberArraysEqual,
  convertToDateString,
  dateToPropertyTimeZone,
  ensureEventPriceCurrency,
  formatCheckinDate,
  formatCheckoutDate,
  getBookingPaymentType,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageNotFound from '../../not-found';

dayjs.extend(LocalizedFormat);

const BOOKING_STATUS_BADGE_SURFACE: Record<string, string> = {
  failure: 'bg-failure',
  pending: 'bg-pending',
  success: 'bg-success',
};

const BookingStatusTag = ({ status }: { status?: string }) => {
  if (!status) {
    return null;
  }
  const tone = STATUS_COLOR[status];
  const surface =
    tone && BOOKING_STATUS_BADGE_SURFACE[tone]
      ? BOOKING_STATUS_BADGE_SURFACE[tone]
      : null;
  const label = status.replace(/-/g, ' ');
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        surface ? `${surface} text-white` : 'bg-neutral text-foreground'
      }`}
    >
      {label}
    </span>
  );
};

const statusOptions = [
  { label: 'Pending Payment', value: 'pending-payment' },
  { label: 'Pending', value: 'pending' },
  { label: 'Pending Refund', value: 'pending-refund' },
  { label: 'Paid', value: 'paid' },
  { label: 'Credits Paid', value: 'credits-paid' },
  { label: 'Tokens Staked', value: 'tokens-staked' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Confirmed', value: 'confirmed' },
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
  const router = useRouter();

  const config = useConfig();
  const { timeZone } = generalConfig || { timeZone: config.DEFAULT_TIMEZONE };
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { platform }: any = usePlatform();
  const { isAuthenticated, user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const isAdmin = Boolean(user?.roles.includes('admin'));
  const canManageBooking = isSpaceHost || isAdmin;
  const isEditMode = true;

  const isHourlyBooking = listing?.priceDuration !== 'night';

  const [liveBooking, setLiveBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLiveBooking(null);
  }, [booking?._id]);

  const bookingView = liveBooking ?? booking;

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
  } = bookingView || {};

  const { linkedCharges, refetchCharges } = useBookingLinkedCharges(_id);

  const ledgerChargesForSummary = useMemo(
    () => mergeBookingLedgerCharges(linkedCharges, bookingView?.charges),
    [linkedCharges, bookingView?.charges],
  );

  const latestStripePaymentIntentId = useMemo(() => {
    const rows = ledgerChargesForSummary
      .filter((c) => c.method === 'stripe' && c.meta?.stripePaymentIntentId)
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    return rows[0]?.meta?.stripePaymentIntentId;
  }, [ledgerChargesForSummary]);

  const eventFiatWithCurrency = ensureEventPriceCurrency(
    eventFiat,
    CloserCurrencies.EUR,
  );

  const isFriendBookingForCurrentUser =
    user?.email && bookingView?.friendEmails?.includes(user?.email);


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

  const [status, setStatus] = useState(bookingView?.status);
  const [updatedRoomNumbers, setUpdatedRoomNumbers] =
    useState(roomOrBedNumbers);
  const [updatedAdults, setUpdatedAdults] = useState(adults);
  const [updatedChildren, setUpdatedChildren] = useState(children);
  const [updatedInfants, setUpdatedInfants] = useState(infants);
  const [updatedPets, setUpdatedPets] = useState(pets);
  const [updatedStartDate, setUpdatedStartDate] = useState<
    string | Date | null
  >(
    (timeZone && dateToPropertyTimeZone(timeZone, bookingStart)) ??
      bookingStart ??
      null,
  );

  const [updatedEndDate, setUpdatedEndDate] = useState<string | Date | null>(
    (timeZone && dateToPropertyTimeZone(timeZone, bookingEnd)) ??
      bookingEnd ??
      null,
  );
  const [updatedListingId, setUpdatedListingId] = useState(listing?._id);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [updatedPrices, setUpdatedPrices] = useState<UpdatedPrices | null>(
    null,
  );
  const [updatedStatus, setUpdatedStatus] = useState<string | undefined>(
    bookingView?.status,
  );

  const [datesEditorOpen, setDatesEditorOpen] = useState(false);

  const [fiatDeltaBaseline, setFiatDeltaBaseline] = useState(() =>
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

  const isBookingOwnerEditor =
    user?._id === createdBy || user?._id === bookingView?.paidBy;

  const canGuestEditBookingDetails =
    Boolean(isBookingOwnerEditor) && !canManageBooking && canEditBooking;

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
    if (
      !_id ||
      !((canManageBooking || canGuestEditBookingDetails) && isEditMode)
    ) {
      return;
    }

    let cancelled = false;

    const fetchUpdatedPrice = async () => {
      try {
        const res = await api.post('/bookings/calculate-totals', {
          bookingId: _id,

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

        if (cancelled) return;
        setUpdatedPrices(res.data.results);
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching updated prices:', error);
        }
      }
    };

    void fetchUpdatedPrice();

    return () => {
      cancelled = true;
    };
  }, [
    _id,
    updatedAdults,
    updatedChildren,
    updatedInfants,
    updatedPets,
    updatedStartDate,
    updatedEndDate,
    updatedListingId,
    updatedDuration,
    paymentType,
    canManageBooking,
    canGuestEditBookingDetails,
    isEditMode,
  ]);

  useEffect(() => {
    const fetchPayerInfo = async () => {
      if (!bookingView?.paidBy) {
        setPayerInfo(null);
        return;
      }

      try {
        const {
          data: { results },
        } = await api.get(`/user/${bookingView.paidBy}`);
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
  }, [bookingView?.paidBy]);

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

  const previewPaymentDelta =
    updatedPrices != null && updatedPrices.paymentDelta !== undefined
      ? updatedPrices.paymentDelta
      : bookingView?.paymentDelta;

  const pendingSaveStart = formatCheckinDate(
    convertToDateString(updatedStartDate),
    timeZone,
    checkInTime,
  );
  const pendingSaveEnd = formatCheckoutDate(
    convertToDateString(updatedEndDate),
    timeZone,
    checkOutTime,
  );
  const pendingRoomOrBedNumbers =
    updatedAdults !== adults
      ? updatedRoomNumbers?.slice(0, updatedAdults)
      : updatedRoomNumbers;

  const updatedBookingValues = {
    ...(updatedStatus &&
      updatedStatus !== bookingView?.status && { overrideStatus: updatedStatus }),
    ...(Math.abs(bookingView?.paymentDelta?.fiat.val || 0) !== fiatDeltaBaseline && {
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
    roomOrBedNumbers: pendingRoomOrBedNumbers,
    listing: updatedListingId,
    start: pendingSaveStart,
    end: pendingSaveEnd,
  };

  const hasDateEdits =
    pendingSaveStart.valueOf() !== dayjs(bookingView?.start).valueOf() ||
    (pendingSaveEnd?.valueOf() ?? null) !==
      (bookingView?.end ? dayjs(bookingView.end).valueOf() : null);

  const hasGuestBookingEdits =
    updatedAdults !== adults ||
    updatedChildren !== children ||
    updatedInfants !== infants ||
    updatedPets !== pets ||
    String(updatedListingId ?? '') !== String(bookingView?.listing ?? '') ||
    hasDateEdits;

  const showPayNowChip =
    bookingView?.status !== 'pending' &&
    isNotPaid &&
    isBookingOwnerEditor;

  const hasHostBookingEdits =
    updatedStatus !== bookingView?.status ||
    hasGuestBookingEdits ||
    !areNumberArraysEqual(pendingRoomOrBedNumbers, roomOrBedNumbers);

  const previewUsesTokenPricing = useTokens || useCredits;
  const previewOriginalTotalVal = previewUsesTokenPricing
    ? rentalToken?.val ?? 0
    : total?.val ?? 0;
  const previewNewTotalVal = previewUsesTokenPricing
    ? updatedPrices?.rentalToken?.val ?? rentalToken?.val ?? 0
    : updatedPrices?.total?.val ?? total?.val ?? 0;
  const previewDeltaVal = previewNewTotalVal - previewOriginalTotalVal;
  const previewFormatCurrency = previewUsesTokenPricing
    ? rentalToken?.cur ?? CloserCurrencies.TDF
    : total?.cur ?? rentalFiat?.cur ?? CloserCurrencies.EUR;

  const syncBookingFromServer = async () => {
    try {
      const {
        data: { results: fresh },
      } = await api.get(`/booking/${_id}`);
      setLiveBooking(fresh);
      setStatus(fresh.status);
      setUpdatedStatus(fresh.status);
      setUpdatedRoomNumbers(fresh.roomOrBedNumbers ?? []);
      setUpdatedAdults(fresh.adults);
      setUpdatedChildren(fresh.children);
      setUpdatedInfants(fresh.infants);
      setUpdatedPets(fresh.pets);
      setUpdatedStartDate(
        (timeZone && dateToPropertyTimeZone(timeZone, fresh.start)) ??
          fresh.start ??
          null,
      );
      setUpdatedEndDate(
        (timeZone && dateToPropertyTimeZone(timeZone, fresh.end)) ??
          fresh.end ??
          null,
      );
      setUpdatedListingId(fresh.listing);
      setFiatDeltaBaseline(Math.abs(fresh.paymentDelta?.fiat.val || 0));
      setUpdatedPrices(null);
      refetchCharges();
    } catch (error) {
      console.error(error);
    }
  };

  const createdFormatted = dayjs(created).format('DD/MM/YYYY HH:mm A');

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
    await syncBookingFromServer();
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
    await syncBookingFromServer();
  };

  const persistBookingUpdate = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await platform.bookings.update(_id, {
        updatedBookingValues,
        paymentType,
      });
      return res.status === 200;
    } catch (error) {
      console.log('error=', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bookingCheckoutPath =
    status === 'open'
      ? `/bookings/${_id}/summary`
      : `/bookings/${_id}/checkout`;

  const openBookingCheckout = async () => {
    if (hasHostBookingEdits) {
      const ok = await persistBookingUpdate();
      if (!ok) return;
      await syncBookingFromServer();
    }
    await router.push(bookingCheckoutPath);
  };

  const handleCompleteBookingChange = async () => {
    const ok = await persistBookingUpdate();
    if (ok) {
      await syncBookingFromServer();
      await router.push(bookingCheckoutPath);
    }
  };

  const handleSaveBooking = async () => {
    setHasUpdated(false);
    const ok = await persistBookingUpdate();
    if (ok) {
      await syncBookingFromServer();
      setHasUpdated(true);
      setTimeout(() => setHasUpdated(false), 3000);
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

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (
   ( !booking ||
    (user?._id !== booking.createdBy &&
      user?._id !== booking.paidBy &&
        !canManageBooking) )
      &&
    !isFriendBookingForCurrentUser
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
      <main className="main-content booking mx-auto flex w-full max-w-2xl flex-col gap-4 pb-6">
        <Card className="flex flex-col gap-3 border-line bg-neutral-light p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Heading level={3} className="!mt-0 max-w-[85%] flex-1 text-xl md:text-2xl">
              {t(`bookings_title_${status}`)}
            </Heading>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <BookingStatusTag status={status} />
              {showPayNowChip && (
                <Button
                  variant="inline"
                  size="small"
                  isFullWidth={false}
                  isLoading={isLoading}
                  className="!min-h-0 shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  onClick={() => void openBookingCheckout()}
                >
                  {t('booking_pay_now')}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 text-xs text-disabled">
            <p>{createdFormatted}</p>
            <p className="break-all">
              <span className="font-medium text-foreground">
                {t('bookings_id')}
              </span>{' '}
              {_id}
            </p>
          </div>

          {bookingView?.adminBookingReason && (
            <Card className="bg-accent font-semibold text-white">
              {bookingView.adminBookingReason}
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-disabled">
              {t('bookings_dates_step_title')}
            </p>
            <SummaryDates
              isDayTicket={bookingView?.isDayTicket}
              totalGuests={
                canManageBooking || canGuestEditBookingDetails
                  ? updatedAdults
                  : adults
              }
              kids={
                canManageBooking || canGuestEditBookingDetails
                  ? updatedChildren
                  : children
              }
              infants={
                canManageBooking || canGuestEditBookingDetails
                  ? updatedInfants
                  : infants
              }
              pets={
                canManageBooking || canGuestEditBookingDetails
                  ? updatedPets
                  : pets
              }
              startDate={
                canManageBooking || canGuestEditBookingDetails
                  ? updatedStartDate
                  : bookingStart
              }
              endDate={
                canManageBooking || canGuestEditBookingDetails
                  ? updatedEndDate
                  : bookingEnd
              }
              listingName={listing?.name}
              listingUrl={listing?.slug}
              isVolunteer={volunteerInfo?.bookingType === 'volunteer'}
              eventName={event?.name}
              volunteerName={volunteer?.name}
              ticketOption={ticketOption?.name}
              doesNeedPickup={doesNeedPickup}
              doesNeedSeparateBeds={doesNeedSeparateBeds}
              isEditMode={
                (canManageBooking || canGuestEditBookingDetails) && isEditMode
              }
              setters={setters}
              updatedListingId={updatedListingId}
              listings={listings}
              updatedMaxBeds={updatedMaxBeds}
              priceDuration={listing?.priceDuration}
              workingHoursStart={listing?.workingHoursStart}
              workingHoursEnd={listing?.workingHoursEnd}
              listingId={updatedListingId ?? listing?._id}
              showHeading={false}
              collapseDatesEditor
              datesEditorOpen={datesEditorOpen}
              onToggleDatesEditor={() =>
                setDatesEditorOpen((open) => !open)
              }
              compact
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-disabled">
              {t('bookings_dates_step_guests_title')}
            </p>
            {(userInfo || payerInfo) && (
              <div className="flex flex-col gap-1">
                {bookingView?.paidBy &&
                payerInfo &&
                bookingView.paidBy !== createdBy ? (
                  <>
                    {userInfo && (
                      <UserInfoButton
                        variant="preview"
                        userInfo={{
                          ...userInfo,
                          name:
                            userInfo.name +
                            (adults > 1 ? ` +${adults - 1}` : ''),
                        }}
                        createdBy={createdBy}
                      />
                    )}
                    <UserInfoButton
                      variant="preview"
                      userInfo={payerInfo}
                      createdBy={bookingView.paidBy}
                    />
                  </>
                ) : (
                  <UserInfoButton
                    variant="preview"
                    userInfo={{
                      ...(payerInfo || userInfo)!,
                      name:
                        (payerInfo || userInfo)!.name +
                        (adults > 1 ? ` +${adults - 1}` : ''),
                    }}
                    createdBy={payerInfo ? bookingView.paidBy || '' : createdBy}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-disabled">
              {t('bookings_summary_step_costs_title')}
            </p>
            <SummaryCosts
              hideTitle
              compact
              rentalFiat={rentalFiat}
              rentalToken={rentalToken}
              isFoodIncluded={Boolean(bookingView?.foodOptionId)}
              utilityFiat={utilityFiat}
              foodFiat={foodFiat}
              useTokens={useTokens}
              useCredits={useCredits}
              accomodationCost={
                useTokens || useCredits ? rentalToken : rentalFiat
              }
              totalToken={rentalToken}
              totalFiat={total}
              foodOptionEnabled={bookingConfig?.foodOptionEnabled}
              utilityOptionEnabled={bookingConfig?.utilityOptionEnabled}
              eventCost={eventFiatWithCurrency}
              eventDefaultCost={
                ticketOption?.price ? ticketOption.price * adults : undefined
              }
              accomodationDefaultCost={listing?.fiatPrice?.val * adults}
              isNotPaid={isNotPaid}
              updatedAccomodationTotal={{
                val: updatedAccomodationTotal,
                cur: useTokens ? rentalToken.cur : rentalFiat?.cur,
              }}
              isEditMode={canManageBooking || canGuestEditBookingDetails}
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
                cur: eventFiatWithCurrency?.cur ?? CloserCurrencies.EUR,
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
              charges={ledgerChargesForSummary}
              paymentDelta={previewPaymentDelta}
              guestCostsLedger={!canManageBooking}
              pricingPreviewAvailable={Boolean(updatedPrices)}
              onBookingCheckout={
                isBookingOwnerEditor ? openBookingCheckout : undefined
              }
              bookingCheckoutLoading={isLoading}
            />
          </div>
        </Card>

        {canGuestEditBookingDetails &&
          hasGuestBookingEdits &&
          updatedPrices && (
            <Card className="flex flex-col gap-3 border-2 border-accent bg-accent-light p-4">
              <Heading level={4} className="!mt-0 text-lg">
                {t('booking_details_complete_change')}
              </Heading>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5 rounded-lg bg-white/80 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-disabled">
                    {t('booking_details_previous_total')}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {priceFormat(
                      previewOriginalTotalVal,
                      previewFormatCurrency,
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg bg-white/80 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-disabled">
                    {t('booking_details_new_total')}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {priceFormat(previewNewTotalVal, previewFormatCurrency)}
                  </p>
                </div>
                <div
                  className={`flex flex-col gap-0.5 rounded-lg p-3 ${
                    previewDeltaVal > 0
                      ? 'bg-failure/10 text-failure'
                      : previewDeltaVal < 0
                        ? 'bg-success/10 text-success'
                        : 'bg-neutral text-foreground'
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide">
                    {t('booking_details_difference')}
                  </p>
                  <p className="text-2xl font-bold">
                    {previewDeltaVal > 0 ? '+' : ''}
                    {priceFormat(previewDeltaVal, previewFormatCurrency)}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                isLoading={isLoading}
                onClick={handleCompleteBookingChange}
                isEnabled={
                  hasGuestBookingEdits &&
                  !isLoading &&
                  canEditBooking &&
                  Boolean(updatedPrices)
                }
              >
                {t('booking_details_complete_change')}
              </Button>
            </Card>
          )}

        {bookingView?.volunteerInfo && (
          <section className="flex flex-col gap-2">
            {bookingView.volunteerInfo.bookingType === 'volunteer' ? (
              <HeadingRow>
                {t('projects_volunteer_application_title')}
              </HeadingRow>
            ) : (
              <HeadingRow>
                {t('projects_residence_application_title')}
              </HeadingRow>
            )}

            {bookingView?.volunteerInfo?.projectId &&
              bookingView.volunteerInfo.projectId?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Heading level={5}>{t('projects_build_title')}</Heading>
                  {bookingView.volunteerInfo.projectId?.map((projectId) => (
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
              {bookingView.volunteerInfo.skills?.map((skill) => (
                <Tag color="primary" size="small" key={skill}>
                  {skill}
                </Tag>
              ))}
            </div>
            <Heading level={5}>{t('projects_food_title')}</Heading>
            <div className="flex flex-wrap gap-2">
              {bookingView.volunteerInfo.diet?.map((diet) => (
                <Tag color="primary" size="small" key={diet}>
                  {diet}
                </Tag>
              ))}
            </div>
            <Heading level={5}>{t('projects_suggestions_title')}</Heading>
            <p>
              {!bookingView.volunteerInfo.suggestions
                ? 'No suggestions'
                : bookingView.volunteerInfo.suggestions}
            </p>
          </section>
        )}

        {canManageBooking && (
          <Card className="flex flex-col gap-2 border-line bg-neutral-light p-3">
            <Heading level={4} className="!mt-0 text-base font-semibold">
              {t('booking_details_space_host_heading')}
            </Heading>

            {bookingView?.roomOrBedNumbers &&
              bookingView.roomOrBedNumbers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {listing?.private
                      ? t('booking_card_room_number')
                      : t('booking_card_bed_numbers')}{' '}
                    {bookingView.roomOrBedNumbers.join(', ')}
                  </p>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-disabled" htmlFor="roomNumbers">
                      {roomOrBedNumbers && roomOrBedNumbers?.length > 0
                        ? 'Enter new bed numbers (comma delimited, must match updated number of adults):'
                        : 'Enter new room number:'}
                    </label>
                    <Input
                      onChange={handleUpdateRoomNumbers}
                      placeholder="Number (s)"
                      id="roomNumbers"
                      type="text"
                      className="max-w-xs bg-white py-1.5 px-2 text-sm"
                    />
                  </div>
                </div>
              )}

            <div className="flex flex-col gap-1.5 border-t border-line pt-3">
              <label className="text-xs font-semibold text-foreground">
                {t('booking_card_set_booking_status')}
              </label>
              <Select
                className="rounded-full border-foreground"
                value={updatedStatus}
                options={statusOptions}
                onChange={(value: string) => setUpdatedStatus(value)}
                isRequired
                placeholder={t('booking_card_set_booking_status')}
              />
            </div>

            {previewPaymentDelta?.token?.val &&
            (paymentType === PaymentType.FULL_TOKENS ||
              paymentType === PaymentType.PARTIAL_TOKENS) ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-semibold">
                  {previewPaymentDelta.token.val >= 0
                    ? t('bookings_amount_due')
                    : t('bookings_amount_to_refund')}
                </p>
                <p className="font-semibold tabular-nums">
                  {priceFormat(
                    Math.abs(previewPaymentDelta.token?.val || 0),
                    previewPaymentDelta.token.cur,
                  )}
                </p>
              </div>
            ) : null}

            {previewPaymentDelta?.fiat.val ? (
              <div className="flex flex-col gap-2 border-t border-line pt-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {previewPaymentDelta.fiat.val >= 0
                      ? t('bookings_amount_due')
                      : t('bookings_amount_to_refund')}
                  </p>
                  <p className="font-semibold tabular-nums">
                    {priceFormat(
                      Math.abs(previewPaymentDelta.fiat.val || 0),
                      previewPaymentDelta.fiat.cur,
                    )}
                  </p>
                </div>
                {previewPaymentDelta.fiat.val < 0 &&
                  latestStripePaymentIntentId && (
                  <Link
                    className="text-xs font-semibold underline"
                    href={`https://dashboard.stripe.com/payments/${latestStripePaymentIntentId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('bookings_go_to_stripe_dashboard')}
                  </Link>
                )}
              </div>
            ) : null}

            {!canEditBooking && (
              <Information className="border-error/30 bg-error/10 text-foreground">
                WARNING: editing this type of booking is not currently supported.
                Please handle these operations manually.
              </Information>
            )}

            <div className="flex flex-col gap-2">
              <Button
                isLoading={isLoading}
                onClick={handleSaveBooking}
                isEnabled={
                  hasHostBookingEdits && !isLoading && canEditBooking
                }
              >
                {t('booking_card_save_booking')}
              </Button>
              {hasUpdated && (
                <Information>{t('booking_card_booking_updated')}</Information>
              )}
            </div>
          </Card>
        )}

        <section className="flex flex-col gap-3">
          <BookingRequestButtons
            isFiatBooking={
              !bookingView?.useCredits && !bookingView?.useTokens
            }
            openCheckout={
              isBookingOwnerEditor ? openBookingCheckout : undefined
            }
            checkoutLoading={isLoading}
            _id={_id}
            status={status}
            createdBy={createdBy}
            paidBy={bookingView?.paidBy}
            end={bookingEnd}
            start={bookingStart}
            confirmBooking={confirmBooking}
            rejectBooking={rejectBooking}
          />
        </section>

        {status === 'confirmed' && (
          <section className="rounded-xl border border-line bg-neutral-light p-3 text-sm">
            {t('bookings_confirmation')}
          </section>
        )}
      </main>
    </>
  );
};

BookingPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [bookingRes, listingRes, foodRes, projectsRes, messages] =
      await Promise.all([
        api
          .get(`/booking/${query.slug}`, {
            headers: getBearerAuthHeaders(req as NextApiRequest),
          })
          .catch(() => null),
        api
          .get('/listing', {
            params: { limit: MAX_LISTINGS_TO_FETCH },
          })
          .catch(() => null),
        api.get('/food').catch(() => null),
        api.get('/project').catch(() => null),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = config.booking;
    const generalConfig = config.general;
    const listings = listingRes?.data?.results;
    const paymentConfig = config.payment;

    const foodOptions = foodRes?.data?.results;
    const projects = projectsRes?.data?.results;

    const [optionalEvent, optionalListing, optionalVolunteer] =
      await Promise.all([
        booking.eventId &&
          api.get(`/event/${booking.eventId}`, {
            headers: getBearerAuthHeaders(req as NextApiRequest),
          }),
        booking.listing &&
          api.get(`/listing/${booking.listing}`, {
            headers: getBearerAuthHeaders(req as NextApiRequest),
          }),
        booking.volunteerId &&
          api.get(`/volunteer/${booking.volunteerId}`, {
            headers: getBearerAuthHeaders(req as NextApiRequest),
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
          headers: getBearerAuthHeaders(req as NextApiRequest),
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
