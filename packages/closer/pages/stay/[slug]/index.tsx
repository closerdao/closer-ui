import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useMemo, useState } from 'react';

import BookingRequestButtons from '../../../components/BookingRequestButtons';
import BookingStatusTag from '../../../components/BookingStatusTag';
import BookingGuests from '../../../components/BookingGuests';
import Modal from '../../../components/Modal';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import UserInfoButton from '../../../components/UserInfoButton';
import { Button, Information } from '../../../components/ui';
import BookingSurface, {
  BookingSectionEyebrow,
} from '../../../components/booking/bookingSurface';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { HeadingRow, Tag, useConfig } from '../../..';
import { MAX_LISTINGS_TO_FETCH } from '../../../constants';
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
  Price,
  Project,
  UpdatedPrices,
  VolunteerOpportunity,
} from '../../../types';
import type { Stay } from '../../../types/stay';
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
  getBookingListingRefId,
  getBookingPaymentCheckoutPath,
  getBookingPaymentType,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  accommodationTokenTotalFromPriceLock,
  approveStayRequest,
  assignStayBeds,
  checkInStay,
  checkOutStay,
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  extendStay,
  getStay,
  isStayShapedBooking,
  mapStayQuoteToUpdatedPrices,
  quoteStay,
  rejectStayRequest,
  setStayStatusApi,
  shortenStay,
  upgradeStayListing,
  updateStayGuests,
} from '../../../utils/stays.api';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
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

const StayBookingSummaryPage = ({
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
  const isEditMode = false;

  const isHourlyBooking = listing?.priceDuration !== 'night';

  const [liveBooking, setLiveBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLiveBooking(null);
  }, [booking?._id]);

  const bookingView = liveBooking ?? booking;

  const stayShaped = useMemo(
    () => isStayShapedBooking(bookingView as unknown as Record<string, unknown>),
    [bookingView],
  );

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
    bookingView?.priceLock?.lines?.event ?? eventFiat,
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
  const [updatedListingId, setUpdatedListingId] = useState(
    getBookingListingRefId(booking?.listing as unknown) ?? listing?._id,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [stayEditError, setStayEditError] = useState<string | null>(null);
  const [updatedPrices, setUpdatedPrices] = useState<UpdatedPrices | null>(
    null,
  );
  const [updatedStatus, setUpdatedStatus] = useState<string | undefined>(
    bookingView?.status,
  );

  const [datesEditorOpen, setDatesEditorOpen] = useState(false);
  const [isGuestsModalOpen, setIsGuestsModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isShortenModalOpen, setIsShortenModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [modalAdults, setModalAdults] = useState(adults);
  const [modalChildren, setModalChildren] = useState(children ?? 0);
  const [modalInfants, setModalInfants] = useState(infants ?? 0);
  const [modalPets, setModalPets] = useState(pets ?? 0);
  const [modalExtendEndDate, setModalExtendEndDate] = useState(
    dayjs(bookingEnd).format('YYYY-MM-DD'),
  );
  const [modalShortenEndDate, setModalShortenEndDate] = useState(
    dayjs(bookingEnd).format('YYYY-MM-DD'),
  );
  const [modalListingId, setModalListingId] = useState(
    getBookingListingRefId(booking?.listing as unknown) ?? listing?._id ?? '',
  );
  const modalButtonClass =
    '!normal-case !tracking-normal enabled:!bg-neutral-light enabled:!border-line !text-foreground hover:!scale-100';

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

  const stayGuestEditableStatuses = ['confirmed', 'pending-payment', 'paid'];

  const canStayGuestEdit =
    stayShaped &&
    !isHourlyBooking &&
    Boolean(isBookingOwnerEditor) &&
    !canManageBooking &&
    canEditBooking &&
    stayGuestEditableStatuses.includes(String(bookingView?.status ?? ''));

  const canGuestEditBookingDetails =
    canStayGuestEdit ||
    (!stayShaped &&
      Boolean(isBookingOwnerEditor) &&
      !canManageBooking &&
      canEditBooking);

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

  const displayAccommodationFiat = (bookingView?.priceLock?.lines
    ?.accommodation ?? rentalFiat) as Price<CloserCurrencies.EUR>;
  const displayUtilityFiatRow = (bookingView?.priceLock?.lines?.utility ??
    utilityFiat) as Price<CloserCurrencies.EUR>;
  const displayFoodFiatRow = (bookingView?.priceLock?.lines?.food ??
    foodFiat) as Price<CloserCurrencies.EUR>;
  const displayRentalTokenForCosts = useMemo((): Price<
    CloserCurrencies.TDF | CloserCurrencies.ETH
  > => {
    const pl = bookingView?.priceLock;
    if (
      pl?.dailyRentalToken != null &&
      bookingView?.duration != null &&
      !Number.isNaN(bookingView.duration)
    ) {
      const val = accommodationTokenTotalFromPriceLock(
        pl,
        bookingView.duration,
        adults ?? 1,
        listing?.private,
      );
      return {
        val: val > 0 ? val : pl.dailyRentalToken.val * bookingView.duration,
        cur: pl.dailyRentalToken.cur as CloserCurrencies.TDF,
      };
    }
    return rentalToken;
  }, [
    bookingView?.priceLock,
    bookingView?.duration,
    rentalToken,
    adults,
    listing?.private,
  ]);
  const displayTotalForCosts = (bookingView?.priceLock?.total ??
    total) as Price<
    CloserCurrencies.EUR | CloserCurrencies.TDF | CloserCurrencies.ETH
  >;

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
        if (stayShaped && !isHourlyBooking) {
          const origListing =
            getBookingListingRefId(bookingView.listing as unknown) ??
            bookingView.listing;
          const listingIdForQuote =
            String(updatedListingId ?? '') !== String(origListing ?? '')
              ? updatedListingId
              : undefined;
          const res = await quoteStay(_id, {
            end: convertToDateString(updatedEndDate),
            duration: updatedDuration,
            adults: updatedAdults,
            children: updatedChildren,
            infants: updatedInfants,
            pets: updatedPets,
            ...(listingIdForQuote ? { listingId: listingIdForQuote } : {}),
          });
          if (cancelled) return;
          setUpdatedPrices(
            mapStayQuoteToUpdatedPrices(res, updatedDuration, {
              adults: updatedAdults,
              listingPrivate: listing?.private,
            }),
          );
          return;
        }

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
    stayShaped,
    isHourlyBooking,
    bookingView?.listing,
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
    String(updatedListingId ?? '') !==
      String(
        getBookingListingRefId(bookingView?.listing as unknown) ??
          bookingView?.listing ??
          '',
      ) ||
    hasDateEdits;

  const showPayNowChip =
    bookingView?.status !== 'pending' &&
    bookingView?.status !== 'cancelled' &&
    isNotPaid &&
    isBookingOwnerEditor;

  const hasHostBookingEdits =
    updatedStatus !== bookingView?.status ||
    hasGuestBookingEdits ||
    !areNumberArraysEqual(pendingRoomOrBedNumbers, roomOrBedNumbers);

  const previewUsesTokenPricing = useTokens || useCredits;
  const previewOriginalTotalVal = previewUsesTokenPricing
    ? displayRentalTokenForCosts?.val ?? 0
    : displayTotalForCosts?.val ?? total?.val ?? 0;
  const previewNewTotalVal = previewUsesTokenPricing
    ? updatedPrices?.rentalToken?.val ??
      displayRentalTokenForCosts?.val ??
      0
    : updatedPrices?.total?.val ?? displayTotalForCosts?.val ?? total?.val ?? 0;
  const previewDeltaVal = previewNewTotalVal - previewOriginalTotalVal;
  const previewFormatCurrency = previewUsesTokenPricing
    ? displayRentalTokenForCosts?.cur ?? CloserCurrencies.TDF
    : displayTotalForCosts?.cur ??
      rentalFiat?.cur ??
      CloserCurrencies.EUR;

  const syncBookingFromServer = async () => {
    try {
      const fresh = await getStay(_id);
      setLiveBooking(fresh as unknown as Booking);
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
      setUpdatedListingId(
        (getBookingListingRefId(fresh.listing as unknown) ??
          fresh.listing) as string,
      );
      setFiatDeltaBaseline(
        Math.abs((fresh as unknown as Booking).paymentDelta?.fiat?.val ?? 0),
      );
      setUpdatedPrices(null);
      setStayEditError(null);
      refetchCharges();
    } catch (error) {
      console.error(error);
    }
  };

  const createdFormatted = dayjs(created).format('DD/MM/YYYY HH:mm A');

  const confirmBooking = async () => {
    await approveStayRequest(_id);
    await syncBookingFromServer();
  };
  const rejectBooking = async () => {
    await rejectStayRequest(_id);
    await syncBookingFromServer();
  };

  const persistStayBookingUpdate = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setStayEditError(null);

      if (
        dayjs(pendingSaveStart).startOf('day').valueOf() !==
        dayjs(bookingView.start).startOf('day').valueOf()
      ) {
        setStayEditError(t('booking_details_stay_arrival_change_not_supported'));
        return false;
      }

      const origListing = String(
        getBookingListingRefId(bookingView.listing as unknown) ??
          bookingView.listing ??
          '',
      );
      const newListing = String(updatedListingId ?? '');

      if (newListing && newListing !== origListing) {
        await upgradeStayListing(_id, { listingId: newListing });
      }

      if (
        updatedAdults !== adults ||
        updatedChildren !== children ||
        updatedInfants !== infants ||
        updatedPets !== pets
      ) {
        await updateStayGuests(_id, {
          adults: updatedAdults,
          children: updatedChildren,
          infants: updatedInfants,
          pets: updatedPets,
        });
      }

      const baselineEnd = dayjs(bookingEnd).startOf('day');
      const targetEnd = dayjs(pendingSaveEnd).startOf('day');
      if (!baselineEnd.isSame(targetEnd)) {
        const endIso = dayjs(pendingSaveEnd).toISOString();
        if (targetEnd.isAfter(baselineEnd)) {
          await extendStay(_id, { end: endIso });
        } else {
          await shortenStay(_id, { end: endIso });
        }
      }

      if (canManageBooking) {
        if (isAdmin && updatedStatus && updatedStatus !== bookingView.status) {
          await setStayStatusApi(_id, { status: updatedStatus });
        }
        if (
          !areNumberArraysEqual(pendingRoomOrBedNumbers, roomOrBedNumbers)
        ) {
          await assignStayBeds(_id, {
            roomOrBedNumbers: pendingRoomOrBedNumbers ?? [],
          });
        }
      }

      return true;
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const persistBookingUpdate = async (): Promise<boolean> => {
    if (stayShaped && !isHourlyBooking) {
      return persistStayBookingUpdate();
    }
    try {
      setIsLoading(true);
      setStayEditError(null);
      const res = await platform.bookings.update(_id, {
        updatedBookingValues,
        paymentType,
      });
      return res.status === 200;
    } catch (error) {
      console.log('error=', error);
      setStayEditError(parseMessageFromError(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bookingCheckoutPath = useMemo(() => {
    const stayLike = bookingView as unknown as Stay;
    return getBookingPaymentCheckoutPath({
      bookingId: _id,
      stayShaped,
      status: String(status ?? ''),
      paymentDelta: bookingView?.paymentDelta,
      useTokens,
      fiatOwed: stayShaped ? computeFiatOwed(stayLike) : 0,
      tokensOwed: stayShaped ? computeTokensOwed(stayLike) : 0,
      creditsOwed: stayShaped ? computeCreditsOwed(stayLike) : 0,
    });
  }, [_id, stayShaped, status, bookingView?.paymentDelta, useTokens, bookingView]);

  const openBookingCheckout = async () => {
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

  const bv = bookingView as Record<string, unknown>;

  const handleApproveExtension = async () => {
    try {
      setIsLoading(true);
      setStayEditError(null);
      await platform.stays.approveExtension(_id);
      await syncBookingFromServer();
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };
  const handleRejectExtension = async () => {
    try {
      setIsLoading(true);
      setStayEditError(null);
      await platform.stays.rejectExtension(_id);
      await syncBookingFromServer();
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };
  const handleStayCheckIn = async () => {
    await checkInStay(_id);
    await syncBookingFromServer();
  };
  const handleStayCheckOut = async () => {
    await checkOutStay(_id);
    await syncBookingFromServer();
  };

  const editableStayStatuses = ['confirmed', 'pending-payment', 'paid'];
  const canUseStayEditActions =
    stayShaped &&
    !isHourlyBooking &&
    (isBookingOwnerEditor || canManageBooking) &&
    editableStayStatuses.includes(String(status ?? ''));

  const handleEditGuestsSubmit = async () => {
    try {
      setIsLoading(true);
      setStayEditError(null);
      await updateStayGuests(_id, {
        adults: Number(modalAdults) || 0,
        children: Number(modalChildren) || 0,
        infants: Number(modalInfants) || 0,
        pets: Number(modalPets) || 0,
      });
      setIsGuestsModalOpen(false);
      await syncBookingFromServer();
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendStaySubmit = async () => {
    try {
      setIsLoading(true);
      setStayEditError(null);
      await extendStay(_id, { end: dayjs(modalExtendEndDate).toISOString() });
      setIsExtendModalOpen(false);
      await syncBookingFromServer();
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortenStaySubmit = async () => {
    try {
      setIsLoading(true);
      setStayEditError(null);
      await shortenStay(_id, { end: dayjs(modalShortenEndDate).toISOString() });
      setIsShortenModalOpen(false);
      await syncBookingFromServer();
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeStaySubmit = async () => {
    try {
      setIsLoading(true);
      setStayEditError(null);
      await upgradeStayListing(_id, { listingId: modalListingId });
      setIsAccommodationModalOpen(false);
      await syncBookingFromServer();
    } catch (error) {
      setStayEditError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
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
      <main className="main-content booking mx-auto flex w-full max-w-2xl flex-col gap-6 pb-10 md:gap-8 md:pb-16">
        <BookingSurface
          tone="elevated"
          padding="lg"
          className="flex flex-col gap-4 md:gap-5"
        >
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
            <BookingSurface tone="banner" padding="sm">
              {bookingView.adminBookingReason}
            </BookingSurface>
          )}

          {bookingView?.pendingExtension?.requestedAt && (
            <BookingSurface tone="banner" padding="md" className="flex flex-col gap-3">
              <p className="text-sm">
                {t('stay_create_pending_extension', {
                  end: dayjs(bookingView.pendingExtension.end).format('LL'),
                })}
              </p>
              {isSpaceHost && stayShaped && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className={modalButtonClass}
                    isLoading={isLoading}
                    onClick={() => void handleApproveExtension()}
                  >
                    {t('booking_details_approve_extension')}
                  </Button>
                  <Button
                    variant="secondary"
                    className={modalButtonClass}
                    isLoading={isLoading}
                    onClick={() => void handleRejectExtension()}
                  >
                    {t('booking_details_reject_extension')}
                  </Button>
                </div>
              )}
            </BookingSurface>
          )}

          <div className="flex flex-col gap-2">
            <BookingSectionEyebrow>
              {t('bookings_dates_step_title')}
            </BookingSectionEyebrow>
            <SummaryDates
              isDayTicket={bookingView?.isDayTicket}
              isFriendsBooking={Boolean(bookingView?.isFriendsBooking)}
              eventId={bookingView?.eventId}
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
              listingId={updatedListingId ?? listing?._id}
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
            <BookingSectionEyebrow>
              {t('bookings_dates_step_guests_title')}
            </BookingSectionEyebrow>
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

          <div className="flex flex-col gap-3">
            <BookingSectionEyebrow>
              {t('bookings_checkout_step_payment_title')}
            </BookingSectionEyebrow>
            {stayShaped &&
              (bv.checkedIn != null || bv.checkedOut != null) && (
              <BookingSurface
                tone="inset"
                padding="md"
                className="flex flex-col gap-2 text-xs"
              >
                {bv.checkedIn != null && String(bv.checkedIn).length > 0 && (
                  <p>
                    {t('booking_details_checked_in_at')}:{' '}
                    {dayjs(String(bv.checkedIn)).format('LLL')}
                  </p>
                )}
                {bv.checkedOut != null && String(bv.checkedOut).length > 0 && (
                  <p>
                    {t('booking_details_checked_out_at')}:{' '}
                    {dayjs(String(bv.checkedOut)).format('LLL')}
                  </p>
                )}
              </BookingSurface>
            )}
            <SummaryCosts
              hideTitle
              compact
              rentalFiat={displayAccommodationFiat}
              rentalToken={displayRentalTokenForCosts}
              isFoodIncluded={Boolean(bookingView?.foodOptionId)}
              utilityFiat={displayUtilityFiatRow}
              foodFiat={displayFoodFiatRow}
              useTokens={useTokens}
              useCredits={useCredits}
              accomodationCost={
                useTokens || useCredits
                  ? displayRentalTokenForCosts
                  : displayAccommodationFiat
              }
              totalToken={displayRentalTokenForCosts}
              totalFiat={displayTotalForCosts}
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
                cur: useTokens
                  ? displayRentalTokenForCosts?.cur
                  : displayAccommodationFiat?.cur,
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
                status !== 'cancelled' && isBookingOwnerEditor
                  ? openBookingCheckout
                  : undefined
              }
              bookingCheckoutLoading={isLoading}
              numberOfUnits={bookingView?.numberOfUnits}
              listingPrivate={listing?.private}
              bookingAdults={adults}
              bookingChildren={children}
            />
          </div>
        </BookingSurface>

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

        {canUseStayEditActions && (
          <BookingSurface
            tone="elevated"
            padding="md"
            className="flex flex-col gap-3"
          >
            <Heading level={4} className="!mt-0 text-base font-semibold">
              Manage booking changes
            </Heading>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                isLoading={isLoading}
                className={modalButtonClass}
                onClick={() => setIsGuestsModalOpen(true)}
              >
                Edit guests
              </Button>
              <Button
                variant="secondary"
                isLoading={isLoading}
                className={modalButtonClass}
                onClick={() => setIsExtendModalOpen(true)}
              >
                Extend stay
              </Button>
              <Button
                variant="secondary"
                isLoading={isLoading}
                className={modalButtonClass}
                onClick={() => setIsShortenModalOpen(true)}
              >
                Shorten stay
              </Button>
              <Button
                variant="secondary"
                isLoading={isLoading}
                className={modalButtonClass}
                onClick={() => setIsAccommodationModalOpen(true)}
              >
                Change accommodation
              </Button>
            </div>
            {stayEditError && (
              <Information className="border-error/30 bg-error/10 text-foreground">
                {stayEditError}
              </Information>
            )}
          </BookingSurface>
        )}

        <section className="flex flex-col gap-3">
          <BookingRequestButtons
            isFiatBooking={
              !bookingView?.useCredits && !bookingView?.useTokens
            }
            openCheckout={
              status !== 'cancelled' && isBookingOwnerEditor
                ? openBookingCheckout
                : undefined
            }
            checkoutLoading={isLoading}
            hideCheckoutButton={status === 'cancelled'}
            stayShaped={stayShaped}
            paymentDelta={bookingView?.paymentDelta}
            useTokens={useTokens}
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
          <BookingSurface tone="soft" padding="md" className="text-sm">
            {t('bookings_confirmation')}
          </BookingSurface>
        )}

        {isGuestsModalOpen && (
          <Modal closeModal={() => setIsGuestsModalOpen(false)} className="sm:max-w-lg">
            <div className="flex flex-col gap-4">
              <Heading level={3}>Edit guests</Heading>
              <BookingGuests
                shouldHideTitle
                adults={modalAdults}
                kids={modalChildren}
                infants={modalInfants}
                pets={modalPets}
                setAdults={setModalAdults}
                setKids={setModalChildren}
                setInfants={setModalInfants}
                setPets={setModalPets}
                isPrivate={Boolean(listing?.private)}
              />
              <Button
                variant="secondary"
                className={modalButtonClass}
                isLoading={isLoading}
                onClick={() => void handleEditGuestsSubmit()}
              >
                Save guests
              </Button>
            </div>
          </Modal>
        )}

        {isExtendModalOpen && (
          <Modal closeModal={() => setIsExtendModalOpen(false)} className="sm:max-w-lg">
            <div className="flex flex-col gap-4">
              <Heading level={3}>Extend stay</Heading>
              <label className="text-sm">
                New checkout date
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  type="date"
                  value={modalExtendEndDate}
                  onChange={(e) => setModalExtendEndDate(e.target.value)}
                />
              </label>
              <Button
                variant="secondary"
                className={modalButtonClass}
                isLoading={isLoading}
                onClick={() => void handleExtendStaySubmit()}
              >
                Extend
              </Button>
            </div>
          </Modal>
        )}

        {isShortenModalOpen && (
          <Modal closeModal={() => setIsShortenModalOpen(false)} className="sm:max-w-lg">
            <div className="flex flex-col gap-4">
              <Heading level={3}>Shorten stay</Heading>
              <label className="text-sm">
                New checkout date
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  type="date"
                  value={modalShortenEndDate}
                  onChange={(e) => setModalShortenEndDate(e.target.value)}
                />
              </label>
              <Button
                variant="secondary"
                className={modalButtonClass}
                isLoading={isLoading}
                onClick={() => void handleShortenStaySubmit()}
              >
                Shorten
              </Button>
            </div>
          </Modal>
        )}

        {isAccommodationModalOpen && (
          <Modal closeModal={() => setIsAccommodationModalOpen(false)} className="sm:max-w-lg">
            <div className="flex flex-col gap-4">
              <Heading level={3}>Change accommodation</Heading>
              <label className="text-sm">
                Listing
                <select
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  value={modalListingId}
                  onChange={(e) => setModalListingId(e.target.value)}
                >
                  {listings.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="secondary"
                className={modalButtonClass}
                isLoading={isLoading}
                onClick={() => void handleUpgradeStaySubmit()}
              >
                Change
              </Button>
            </div>
          </Modal>
        )}
      </main>
    </>
  );
};

StayBookingSummaryPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [bookingRes, listingRes, foodRes, projectsRes] =
      await Promise.all([
        api
          .get(`/stays/${query.slug}`, {
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
      ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = config.booking;
    const generalConfig = config.general;
    const listings = listingRes?.data?.results;
    const paymentConfig = config.payment;
    const foodOptions = foodRes?.data?.results;
    const projects = projectsRes?.data?.results;

    const listingRef = booking?.listing;
    const listingIdForFetch =
      listingRef &&
      (getBookingListingRefId(listingRef) ??
        (typeof listingRef === 'string' ? listingRef : null));

    const [optionalEvent, optionalListing, optionalVolunteer] =
      await Promise.all([
        booking?.eventId &&
          api.get(`/event/${booking.eventId}`, {
            headers: getBearerAuthHeaders(req as NextApiRequest),
          }),
        listingIdForFetch &&
          api.get(`/listing/${listingIdForFetch}`, {
            headers: getBearerAuthHeaders(req as NextApiRequest),
          }),
        booking?.volunteerId &&
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
        booking?.createdBy &&
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
      paymentConfig: null,
      foodOptions: null,
      projects: null,
    };
  }
};

export default StayBookingSummaryPage;
