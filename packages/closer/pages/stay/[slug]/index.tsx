import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useMemo, useState } from 'react';

import StayCoGuests from '../../../components/BookingCoGuests/StayCoGuests';
import BookingGuestNote from '../../../components/BookingGuestNote';
import BookingQuestionnaireAnswers from '../../../components/BookingQuestionnaireAnswers';
import BookingRequestButtons from '../../../components/BookingRequestButtons';
import BookingStatusTag from '../../../components/BookingStatusTag';
import { withPageErrorBoundary } from '../../../components/ErrorBoundary';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Modal from '../../../components/Modal';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import UserInfoButton from '../../../components/UserInfoButton';
import VolunteerApplicationDetail from '../../../components/VolunteerApplicationDetail';
import BookingSurface, {
  BookingSectionEyebrow,
} from '../../../components/booking/bookingSurface';
import HostChangeHint from '../../../components/booking/hostActions/hostChangeHint';
import HostReasonModal from '../../../components/booking/hostActions/hostReasonModal';
import StayHostActions, {
  HostActionId,
} from '../../../components/booking/hostActions/stayHostActions';
import HostNoteBadge from '../../../components/booking/hostNoteBadge';
import StayModifyFlow from '../../../components/booking/stayModifyFlow';
import { Button, Information } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useConfig } from '../../..';
import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { useBookingLinkedCharges } from '../../../hooks/useBookingLinkedCharges';
import { useHostChanges } from '../../../hooks/useHostChanges';
import { useHostNotes } from '../../../hooks/useHostNotes';
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
  VolunteerOpportunity,
} from '../../../types';
import { FoodOption } from '../../../types/food';
import type { Stay } from '../../../types/stay';
import api from '../../../utils/api';
import { formatAssignedUnits } from '../../../utils/assignedUnits.helpers';
import { getBearerAuthHeaders } from '../../../utils/authHeaders.helpers';
import {
  canEditStayGuestNote,
  ensureEventPriceCurrency,
  getBookingListingRefId,
  getBookingPaymentCheckoutPath,
  getBookingPaymentType,
} from '../../../utils/booking.helpers';
import { mergeBookingLedgerCharges } from '../../../utils/bookingChargesLedger.helpers';
import {
  canEditBookingCoGuests,
  canViewBookingAsGuest,
  getBookingGuestIds,
  isBookingCoGuest,
} from '../../../utils/bookingCoGuests.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  isStayMongoId,
  resolveLegacyListingStaySlugRedirect,
} from '../../../utils/stayRouting.helpers';
import {
  accommodationTokenTotalFromPriceLock,
  approveStayModification,
  approveStayRequest,
  checkInStay,
  checkOutStay,
  computeCreditsOwed,
  computeFiatOwed,
  computeFiatOwedMoney,
  computeTokensOwed,
  deleteDraftStay,
  discardStayModification,
  formatStakeNights,
  formatStayMoney,
  getStay,
  rejectStayRequest,
  splitStayAdjustment,
  updateStayOptions,
} from '../../../utils/stays.api';
import PageNotFound from '../../not-found';

dayjs.extend(LocalizedFormat);

type HostDecision =
  'approve' | 'reject' | 'approve-modification' | 'reject-modification';

const HOST_DECISION_TITLE_KEYS: Record<HostDecision, string> = {
  approve: 'booking_confirm_button',
  reject: 'booking_reject_button',
  'approve-modification': 'stay_modify_host_approve',
  'reject-modification': 'stay_modify_host_reject',
};

interface Props {
  booking: Booking;
  error?: string;
  listing: Listing;
  event: Event;
  volunteer: VolunteerOpportunity;
  bookingCreatedBy: User;
  bookingConfig: BookingConfig | null;
  generalConfig: GeneralConfig;
  paymentConfig: PaymentConfig | null;
  foodOptions: FoodOption[];
  projects: Project[];
}

const StayBookingSummaryContent = ({
  booking,
  listing,
  event,
  volunteer,
  error,
  bookingCreatedBy,
  bookingConfig,
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

  const { isAuthenticated, user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const isAdmin = Boolean(user?.roles.includes('admin'));
  const canManageBooking = isSpaceHost || isAdmin;

  const isHourlyBooking = listing?.priceDuration !== 'night';

  const [liveBooking, setLiveBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLiveBooking(null);
  }, [booking?._id]);

  const bookingView = liveBooking ?? booking;
  const adjustment = splitStayAdjustment(
    bookingView?.priceLock?.lines?.adjustment,
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
    volunteerInfo,
  } = bookingView || {};

  const { linkedCharges, refetchCharges } = useBookingLinkedCharges(_id);
  const { latestHostChange, refetchHostChanges } = useHostChanges(
    canManageBooking ? _id : undefined,
  );
  const { hostNotes, refetchHostNotes } = useHostNotes(
    canManageBooking && _id ? [_id] : undefined,
  );
  const [hostAction, setHostAction] = useState<HostActionId | null>(null);
  const [hostDecision, setHostDecision] = useState<HostDecision | null>(null);

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

  const [isCancelDraftModalOpen, setIsCancelDraftModalOpen] = useState(false);
  const [isCancellingDraft, setIsCancellingDraft] = useState(false);
  const [cancelDraftError, setCancelDraftError] = useState<string | null>(null);
  const modalButtonClass =
    '!normal-case !tracking-normal enabled:!bg-neutral-light enabled:!border-line !text-foreground hover:!scale-100';

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
  const isCoGuestViewer = isBookingCoGuest(
    {
      createdBy,
      paidBy: bookingView?.paidBy,
      guests: bookingView?.guests,
    },
    user?._id,
  );
  /*
   * A volunteer season's stay: its dates and room are the agreement's frozen
   * program, and `/stays/:id/extend`, `/upgrade`, `/guests` and `/shorten`
   * all answer 400 for it. The way to a different room or different dates is
   * to end the season and sign a new one, so the controls are withheld
   * rather than the error surfaced.
   */
  const isResidencyStay = Boolean(bookingView?.residencyAgreementId);

  const canEditCoGuests =
    !isResidencyStay &&
    canEditBookingCoGuests(
      {
        createdBy,
        paidBy: bookingView?.paidBy,
        guests: bookingView?.guests,
      },
      user?._id,
      canManageBooking,
    );

  const coGuestIds = useMemo(
    () => getBookingGuestIds(bookingView?.guests),
    [bookingView?.guests],
  );

  const stayGuestEditableStatuses = ['confirmed', 'pending-payment', 'paid'];

  // Hourly bookings still edit through the legacy platform.bookings path, which
  // has no guest-facing editor.
  const canGuestEditBookingDetails =
    !isHourlyBooking &&
    Boolean(isBookingOwnerEditor) &&
    !canManageBooking &&
    canEditBooking &&
    stayGuestEditableStatuses.includes(String(bookingView?.status ?? ''));

  const isStayOwner = Boolean(user?._id) && user?._id === createdBy;
  const canEditGuestNote = canEditStayGuestNote(
    { ...bookingView, status },
    user?._id,
    canManageBooking,
  );

  const checkInTime = bookingConfig?.checkinTime || 14;
  const checkOutTime = bookingConfig?.checkoutTime || 11;

  const isNotPaid =
    status !== 'paid' &&
    status !== 'credits-paid' &&
    status !== 'tokens-staked' &&
    status !== 'checked-in' &&
    status !== 'checked-out' &&
    status !== 'cancelled' &&
    status !== 'pending-refund';

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

  const showPayNowChip =
    bookingView?.status !== 'pending' &&
    bookingView?.status !== 'cancelled' &&
    isNotPaid &&
    isBookingOwnerEditor;

  const fiatDue = useMemo(() => {
    const owed = computeFiatOwedMoney(bookingView as unknown as Stay);
    if (owed.val <= 0.005) return null;
    // The /stays/* flow never sets tokens-staked, so a confirmed stay can still owe fiat.
    if (status === 'confirmed') {
      return { owed, messageKey: 'booking_fiat_still_owed' };
    }
    // Money already paid is what tells a settled modification's delta from a never-paid stay.
    if (
      status === 'pending-payment' &&
      Number(bookingView?.fiatPaid?.val ?? 0) > 0
    ) {
      return { owed, messageKey: 'stay_modify_settled_payment_due' };
    }
    return null;
  }, [status, bookingView]);

  const syncBookingFromServer = async () => {
    refetchHostNotes();
    try {
      const fresh = await getStay(_id);
      const freshBooking = fresh as unknown as Booking;
      setLiveBooking((prev) => ({
        ...freshBooking,
        guests: freshBooking.guests ?? prev?.guests ?? booking?.guests ?? [],
      }));
      setStatus(fresh.status);
      refetchCharges();
      refetchHostChanges();
    } catch (error) {
      console.error(error);
    }
  };

  const createdFormatted = dayjs(created).format('DD/MM/YYYY HH:mm A');

  const confirmBooking = () => setHostDecision('approve');
  const rejectBooking = () => setHostDecision('reject');

  const decideAsHost = async (reason: string) => {
    if (hostDecision === 'approve') await approveStayRequest(_id, reason);
    if (hostDecision === 'reject') await rejectStayRequest(_id, reason);
    if (hostDecision === 'approve-modification') {
      await approveStayModification(_id, reason);
    }
    if (hostDecision === 'reject-modification') {
      await discardStayModification(_id, reason);
    }
    await syncBookingFromServer();
  };

  /**
   * Moves the application to "call requested" and records the host's note.
   * volunteerInfo is replaced wholesale by the server, so the whole object is
   * sent back. There is no server-side notification endpoint yet, so the host
   * still sends the message themselves via the mailto handoff.
   */
  const requestApplicantCall = async (message: string) => {
    if (!volunteerInfo) return;
    const nextVolunteerInfo = {
      ...volunteerInfo,
      ...(volunteerInfo.application
        ? {
            application: {
              ...volunteerInfo.application,
              review: {
                ...volunteerInfo.application.review,
                status: 'call-requested' as const,
                callRequestedAt: new Date().toISOString(),
                callRequestMessage: message,
              },
            },
          }
        : {}),
    };
    await updateStayOptions(_id, { volunteerInfo: nextVolunteerInfo });
    await syncBookingFromServer();

    const applicantEmail = bookingCreatedBy?.email;
    if (applicantEmail && typeof window !== 'undefined') {
      const subject = encodeURIComponent(
        t('volunteer_application_request_call_email_subject'),
      );
      window.open(
        `mailto:${applicantEmail}?subject=${subject}&body=${encodeURIComponent(
          message,
        )}`,
        '_blank',
      );
    }
  };

  const bookingCheckoutPath = useMemo(() => {
    const stayLike = bookingView as unknown as Stay;
    return getBookingPaymentCheckoutPath({
      bookingId: _id,
      status: String(status ?? ''),
      paymentDelta: bookingView?.paymentDelta,
      useTokens,
      fiatOwed: computeFiatOwed(stayLike),
      tokensOwed: computeTokensOwed(stayLike),
      creditsOwed: computeCreditsOwed(stayLike),
    });
  }, [_id, status, bookingView?.paymentDelta, useTokens, bookingView]);

  const openBookingCheckout = async () => {
    await router.push(bookingCheckoutPath);
  };

  const bv = bookingView as Record<string, unknown>;

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
    !isHourlyBooking &&
    !isResidencyStay &&
    (isBookingOwnerEditor || canManageBooking) &&
    editableStayStatuses.includes(String(status ?? ''));

  // A draft has no payment to reverse, so it is deleted rather than sent
  // through the refund-aware cancellation flow.
  const canCancelDraft =
    status === 'draft' && (isBookingOwnerEditor || canManageBooking);

  const handleCancelDraft = async () => {
    try {
      setIsCancellingDraft(true);
      setCancelDraftError(null);
      await deleteDraftStay(_id);
      setIsCancelDraftModalOpen(false);
      router.push('/stay/upcoming');
    } catch (error) {
      setCancelDraftError(parseMessageFromError(error));
    } finally {
      setIsCancellingDraft(false);
    }
  };

  const handleCoGuestsChange = (guestIds: string[]) => {
    setLiveBooking((prev) => ({
      ...(prev ?? booking),
      guests: guestIds,
    }));
  };

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  if (
    (!booking ||
      (!canViewBookingAsGuest(
        {
          createdBy: booking.createdBy,
          paidBy: booking.paidBy,
          guests: booking.guests,
        },
        user?._id,
      ) &&
        !canManageBooking)) &&
    !isFriendBookingForCurrentUser
  ) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
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
            <Heading
              level={3}
              className="!mt-0 max-w-[85%] flex-1 text-xl md:text-2xl"
            >
              {t(`bookings_title_${status}`)}
            </Heading>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <BookingStatusTag status={status} />
              {showPayNowChip && (
                <Button
                  variant="inline"
                  size="small"
                  isFullWidth={false}
                  className="!min-h-0 shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  onClick={() => void openBookingCheckout()}
                >
                  {t('booking_pay_now')}
                </Button>
              )}
              {canManageBooking && (
                <StayHostActions
                  stayId={_id}
                  status={String(status ?? '')}
                  pendingModificationStatus={
                    bookingView?.pendingModification?.status
                  }
                  priceLock={bookingView?.priceLock}
                  openAction={hostAction}
                  onOpenActionChange={setHostAction}
                  onStayChange={() => syncBookingFromServer()}
                />
              )}
            </div>
          </div>

          {canManageBooking && <HostNoteBadge note={hostNotes[_id]} />}

          {isCoGuestViewer && !canManageBooking && (
            <BookingSurface tone="banner" padding="sm">
              {t('booking_co_guests_read_only')}
            </BookingSurface>
          )}

          <div className="flex flex-col gap-0.5 text-xs text-disabled">
            <p>{createdFormatted}</p>
            <p className="break-all">
              <span className="font-medium text-foreground">
                {t('bookings_id')}
              </span>{' '}
              {_id}
            </p>
          </div>

          {fiatDue && (
            <BookingSurface
              tone="banner"
              padding="md"
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <p>
                {t(fiatDue.messageKey, {
                  amount: formatStayMoney(fiatDue.owed),
                })}
              </p>
              {isBookingOwnerEditor && (
                <Button
                  variant="inline"
                  size="small"
                  isFullWidth={false}
                  className="!min-h-0 shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  onClick={() => void openBookingCheckout()}
                >
                  {t('booking_pay_now')}
                </Button>
              )}
            </BookingSurface>
          )}

          {bookingView?.adminBookingReason && (
            <BookingSurface tone="banner" padding="sm">
              {bookingView.adminBookingReason}
            </BookingSurface>
          )}

          {bookingView?.pendingModification?.requiresHostApproval && (
            <BookingSurface
              tone="banner"
              padding="md"
              className="flex flex-col gap-3"
            >
              <p className="text-sm">
                {t('stay_pending_modification_notice', {
                  end: dayjs(
                    bookingView.pendingModification.overrides?.end ??
                      bookingView.end,
                  ).format('LL'),
                })}
              </p>
              {isSpaceHost && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className={modalButtonClass}
                    onClick={() => setHostDecision('approve-modification')}
                  >
                    {t('stay_modify_host_approve')}
                  </Button>
                  <Button
                    variant="secondary"
                    className={modalButtonClass}
                    onClick={() => setHostDecision('reject-modification')}
                  >
                    {t('stay_modify_host_reject')}
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
              isDayTicket={Boolean(bookingView?.isDayTicket)}
              isFriendsBooking={Boolean(bookingView?.isFriendsBooking)}
              isTeamBooking={Boolean(bookingView?.isTeamBooking)}
              eventId={bookingView?.eventId}
              totalGuests={adults}
              kids={children}
              infants={infants}
              pets={pets}
              startDate={bookingStart}
              endDate={bookingEnd}
              listingName={listing?.name}
              assignedUnits={
                listing
                  ? formatAssignedUnits(
                      listing,
                      bookingView?.roomOrBedNumbers,
                      t,
                    )
                  : undefined
              }
              listingId={
                getBookingListingRefId(bookingView?.listing as unknown) ??
                listing?._id
              }
              isVolunteer={volunteerInfo?.bookingType === 'volunteer'}
              eventName={event?.name}
              volunteerName={volunteer?.name}
              ticketOption={ticketOption?.name}
              doesNeedPickup={
                bookingConfig?.pickUpEnabled ? doesNeedPickup : undefined
              }
              doesNeedSeparateBeds={doesNeedSeparateBeds}
              priceDuration={listing?.priceDuration}
              workingHoursStart={listing?.workingHoursStart}
              workingHoursEnd={listing?.workingHoursEnd}
              showHeading={false}
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
            <div className="mt-1 flex flex-col gap-1.5">
              {canEditCoGuests && (
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {t('booking_co_guests_add_title')}
                  </p>
                  <p className="text-xs leading-snug text-disabled">
                    {t('booking_co_guests_add_smallprint')}
                  </p>
                </div>
              )}
              <StayCoGuests
                stayId={_id}
                createdBy={createdBy}
                paidBy={bookingView?.paidBy}
                guestIds={coGuestIds}
                adults={adults}
                canEdit={canEditCoGuests}
                onGuestsChange={handleCoGuestsChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <BookingSectionEyebrow>
              {t('bookings_checkout_step_payment_title')}
            </BookingSectionEyebrow>
            {(bv.checkedIn != null || bv.checkedOut != null) && (
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
              hostAdjustment={
                (adjustment.host ?? undefined) as
                  Price<CloserCurrencies> | undefined
              }
              unstakedNights={
                adjustment.unstakedNights
                  ? {
                      amount:
                        adjustment.unstakedNights as Price<CloserCurrencies>,
                      nights: formatStakeNights(
                        adjustment.unstakedNights.nights,
                      ),
                    }
                  : undefined
              }
              eventDefaultCost={
                ticketOption?.price ? ticketOption.price * adults : undefined
              }
              accomodationDefaultCost={listing?.fiatPrice?.val * adults}
              isNotPaid={isNotPaid}
              isEditMode={canManageBooking || canGuestEditBookingDetails}
              priceDuration={listing?.priceDuration}
              vatRate={vatRate}
              status={status}
              charges={ledgerChargesForSummary}
              paymentDelta={bookingView?.paymentDelta}
              guestCostsLedger={!canManageBooking}
              onBookingCheckout={
                status !== 'cancelled' && isBookingOwnerEditor
                  ? openBookingCheckout
                  : undefined
              }
              numberOfUnits={bookingView?.numberOfUnits}
              listingPrivate={listing?.private}
              bookingAdults={adults}
              bookingChildren={children}
            />
            {canManageBooking && (
              <HostChangeHint
                latest={latestHostChange}
                onOpenHistory={() => setHostAction('history')}
              />
            )}
          </div>
        </BookingSurface>

        <BookingQuestionnaireAnswers fields={bookingView?.fields} />

        <BookingGuestNote
          message={bookingView?.message}
          isOwnNote={isStayOwner}
          stayId={canEditGuestNote ? _id : undefined}
          onSaved={() => syncBookingFromServer()}
        />

        {bookingView?.volunteerInfo && (
          <VolunteerApplicationDetail
            volunteerInfo={bookingView.volunteerInfo}
            projects={projects}
            canViewHealth={canManageBooking}
            applicantEmail={bookingCreatedBy?.email}
            applicantName={
              bookingView.volunteerInfo.application?.about?.fullName
            }
            onRequestCall={canManageBooking ? requestApplicantCall : undefined}
          />
        )}

        {isResidencyStay && (
          <Information>
            {t('stay_residency_locked')}{' '}
            <Link href="/residencies" className="text-accent underline">
              {t('stay_residency_see_seasons')}
            </Link>
          </Information>
        )}

        {canUseStayEditActions && (
          <StayModifyFlow
            stay={bookingView as unknown as Stay}
            timeZone={timeZone}
            isBookingOwner={Boolean(isBookingOwnerEditor)}
            onStayChange={() => syncBookingFromServer()}
          />
        )}

        {!(isCoGuestViewer && !canManageBooking) && (
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
              onCancelDraft={
                canCancelDraft
                  ? () => setIsCancelDraftModalOpen(true)
                  : undefined
              }
              hideCheckoutButton={status === 'cancelled'}
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
        )}

        {status === 'confirmed' && (
          <BookingSurface tone="soft" padding="md" className="text-sm">
            {t('bookings_confirmation')}
          </BookingSurface>
        )}

        {isCancelDraftModalOpen && (
          <Modal
            closeModal={() => setIsCancelDraftModalOpen(false)}
            className="sm:max-w-lg"
          >
            <div className="flex flex-col gap-4">
              <Heading level={3}>{t('booking_cancel_draft_title')}</Heading>
              <p className="text-sm">{t('booking_cancel_draft_description')}</p>
              {cancelDraftError && (
                <Information className="border-error/30 bg-error/10 text-foreground">
                  {cancelDraftError}
                </Information>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className={modalButtonClass}
                  isLoading={isCancellingDraft}
                  onClick={() => void handleCancelDraft()}
                >
                  {t('booking_cancel_draft_confirm')}
                </Button>
                <Button
                  variant="secondary"
                  className={modalButtonClass}
                  onClick={() => setIsCancelDraftModalOpen(false)}
                >
                  {t('generic_cancel')}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {hostDecision && (
          <HostReasonModal
            title={t(HOST_DECISION_TITLE_KEYS[hostDecision])}
            onSubmit={decideAsHost}
            onClose={() => setHostDecision(null)}
          />
        )}
      </main>
    </>
  );
};

const StayBookingSummaryPage = withPageErrorBoundary(
  StayBookingSummaryContent,
  'StayBookingSummaryPage',
);

StayBookingSummaryPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  const rawSlug = query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!isStayMongoId(slug)) {
    const legacyRedirect = await resolveLegacyListingStaySlugRedirect(slug);
    if (legacyRedirect) {
      return {
        redirect: {
          destination: legacyRedirect,
          permanent: false,
        },
      };
    }
    if (context.res) {
      context.res.statusCode = 404;
    }
    // No error message: a null booking renders the not-found page, which is
    // what a slug that cannot be a stay id deserves.
    return {
      error: null,
      booking: null,
      bookingConfig: config.booking,
      generalConfig: config.general,
      paymentConfig: config.payment,
      foodOptions: null,
      projects: null,
      event: null,
      listing: null,
      volunteer: null,
      bookingCreatedBy: null,
    };
  }

  try {
    const [stayRes, bookingDocRes, foodRes, projectsRes] = await Promise.all([
      api
        .get(`/stays/${slug}`, {
          headers: getBearerAuthHeaders(req as NextApiRequest),
        })
        .catch(() => null),
      api
        .get(`/booking/${slug}`, {
          headers: getBearerAuthHeaders(req as NextApiRequest),
        })
        .catch(() => null),
      api.get('/food').catch(() => null),
      api.get('/project').catch(() => null),
    ]);
    const stay = stayRes?.data?.results;
    const bookingDoc = bookingDocRes?.data?.results;
    const booking = stay
      ? {
          ...stay,
          guests: stay.guests ?? bookingDoc?.guests ?? [],
          // Questionnaire answers predate /stays and are not part of its
          // projection, so the booking document answers for them — without
          // this the questionnaire section is blank on every event stay that
          // has one.
          fields: stay.fields ?? bookingDoc?.fields ?? [],
        }
      : bookingDoc;
    const bookingConfig = config.booking;
    const generalConfig = config.general;
    const paymentConfig = config.payment;
    const foodOptions = foodRes?.data?.results;
    const projects = projectsRes?.data?.results;

    const listingRef = booking?.listing;
    const listingIdForFetch =
      listingRef &&
      (getBookingListingRefId(listingRef) ??
        (typeof listingRef === 'string' ? listingRef : null));

    // These are decorations on the stay, not the stay itself. A co-guest may
    // not be allowed to read a private listing or event, and a listing can be
    // deleted after the stay was made; none of that should take the whole
    // page down (the catch below used to null out bookingConfig, which
    // rendered as "Feature Not Available").
    const [optionalEvent, optionalListing, optionalVolunteer] =
      await Promise.all([
        booking?.eventId
          ? api
              .get(`/event/${booking.eventId}`, {
                headers: getBearerAuthHeaders(req as NextApiRequest),
              })
              .catch(() => null)
          : null,
        listingIdForFetch
          ? api
              .get(`/listing/${listingIdForFetch}`, {
                headers: getBearerAuthHeaders(req as NextApiRequest),
              })
              .catch(() => null)
          : null,
        booking?.volunteerId
          ? api
              .get(`/volunteer/${booking.volunteerId}`, {
                headers: getBearerAuthHeaders(req as NextApiRequest),
              })
              .catch(() => null)
          : null,
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
      bookingCreatedBy: null,
      // Config is a build-time snapshot and does not depend on the fetches
      // above; nulling it turned every fetch error into "Feature Not
      // Available" instead of the actual error.
      bookingConfig: config.booking,
      generalConfig: config.general,
      paymentConfig: config.payment,
      foodOptions: null,
      projects: null,
    };
  }
};

export default StayBookingSummaryPage;
