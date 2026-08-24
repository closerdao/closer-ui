import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import utc from 'dayjs/plugin/utc';
import { BigNumber, utils as ethersUtils } from 'ethers';

import type {
  BookingPaymentDelta,
  UpdatedPrices,
  VolunteerInfo,
} from '../types/booking';
import { CloserCurrencies } from '../types/currency';
import type { StaySearchResponse } from '../types/durationDiscount';
import type {
  PriceLock,
  Stay,
  StayCheckoutResponse,
  StayMoney,
  StayPaymentMethod,
  StayQuoteResponse,
  StayStatus,
  StayTokenPaymentConfirmResponse,
  StayTokenPaymentQuote,
  StayTokenStakePlan,
} from '../types/stay';
import api from './api';
import { priceFormat } from './helpers';

dayjs.extend(utc);
dayjs.extend(dayOfYear);

const utcCalendarDayFromStayDate = (input: string): dayjs.Dayjs => {
  const trimmed = input.trim();
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (dateOnly) {
    return dayjs.utc(dateOnly[1], 'YYYY-MM-DD', true).startOf('day');
  }
  return dayjs.utc(trimmed).startOf('day');
};

const utcCalendarStartOfStay = (stayStart: string): dayjs.Dayjs =>
  utcCalendarDayFromStayDate(stayStart);

export const getStayAccommodationNightCount = (stay: Stay): number => {
  if (stay.start && stay.end) {
    const startDay = utcCalendarDayFromStayDate(stay.start);
    const endDay = utcCalendarDayFromStayDate(stay.end);
    if (startDay.isValid() && endDay.isValid()) {
      const nights = endDay.diff(startDay, 'day');
      if (Number.isFinite(nights) && nights > 0) return nights;
    }
  }
  return stay.duration || 0;
};

const TDF_DECIMALS = 18;

const roundHumanTokenAmountForWei = (val: number): string => {
  if (!Number.isFinite(val) || val <= 0) return '0';
  const rounded = Math.round(val * 1e6) / 1e6;
  const s = rounded.toFixed(6).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
};

export const formatStayMoney = (
  money: StayMoney | undefined | null,
): string => {
  if (!money) return '';
  return priceFormat(money.val, money.cur as CloserCurrencies);
};

export const getCreditsBalance = async (): Promise<number> => {
  try {
    const { data } = await api.get('/carrots/balance', { cache: false } as any);
    const raw = data?.results;
    const num = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(num) ? num : 0;
  } catch {
    return 0;
  }
};

export const checkCarrotsAvailability = async ({
  startDate,
  creditsAmount,
  minCreditsAmount,
}: {
  startDate: string | Date;
  creditsAmount: number;
  minCreditsAmount: number;
}): Promise<boolean> => {
  try {
    const { data } = await api.post('/carrots/availability', {
      startDate,
      creditsAmount,
      minCreditsAmount,
    });
    return Boolean(data?.results);
  } catch {
    return false;
  }
};

export const getStayTokenPricePerNight = (stay: Stay): number => {
  const daily = stay.priceLock?.dailyRentalToken?.val;
  if (daily != null && Number.isFinite(daily) && daily > 0) {
    return daily;
  }
  const nights = getStayAccommodationNightCount(stay);
  const total = getStayAccommodationTokenTotal(stay);
  if (!nights || !total) {
    return 0;
  }
  return total / nights;
};

export const STAY_TERMINAL_STATUSES: ReadonlyArray<StayStatus> = [
  'cancelled',
  'rejected',
];

export const isStayTerminal = (
  stayOrStatus: Pick<Stay, 'status'> | StayStatus | null | undefined,
): boolean => {
  if (stayOrStatus == null) return false;
  const status =
    typeof stayOrStatus === 'string' ? stayOrStatus : stayOrStatus.status;
  return STAY_TERMINAL_STATUSES.includes(status);
};

export const isStayPaid = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => stay?.status === 'paid';

export const isStayAwaitingPayment = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean =>
  stay?.status === 'confirmed' || stay?.status === 'pending-payment';

export const isStayCollectingRemainingFiat = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => {
  const status = stay?.status;
  return (
    status === 'confirmed' ||
    status === 'pending-payment' ||
    status === 'tokens-staked' ||
    status === 'credits-paid'
  );
};

function normalizeStayStatusRaw(
  status: Stay['status'] | null | undefined,
): string {
  if (status == null) return '';
  if (typeof status !== 'string') return '';
  return status.trim().toLowerCase();
}

export const isStayCheckoutDraft = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => normalizeStayStatusRaw(stay?.status) === 'draft';

export const isStayAwaitingHostApproval = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => normalizeStayStatusRaw(stay?.status) === 'pending';

export const canApplyTokenOrCreditsToStay = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => {
  const s = normalizeStayStatusRaw(stay?.status);
  if (!s) return false;
  if (s === 'draft' || s === 'pending' || s === 'paid') return false;
  if ((STAY_TERMINAL_STATUSES as readonly string[]).includes(s)) return false;
  return s === 'confirmed' || s === 'pending-payment';
};

export const isVolunteerStay = (
  stay: Pick<Stay, 'volunteerInfo'> | null | undefined,
): boolean => {
  const bookingType = stay?.volunteerInfo?.bookingType;
  return bookingType === 'volunteer' || bookingType === 'residence';
};

export const canShowStayTokenCreditPaymentOptions = (
  stay: Pick<Stay, 'status' | 'volunteerInfo'> | null | undefined,
  isMember: boolean,
): boolean => {
  if (!stay) return false;
  // Accommodation is already 0 on a volunteer/residence stay, but the server
  // still stakes tokens/credits off the listing price — so never offer them.
  if (isVolunteerStay(stay)) return false;
  if (isStayCheckoutDraft(stay)) {
    return Boolean(isMember);
  }
  if (!canApplyTokenOrCreditsToStay(stay)) return false;
  return (
    Boolean(isMember) || normalizeStayStatusRaw(stay.status) === 'confirmed'
  );
};

export const computeFiatOwed = (stay?: Stay | null): number => {
  if (!stay) return 0;
  const target = stay.fiatTarget?.val ?? stay.priceLock?.total?.val ?? 0;
  const paid = stay.fiatPaid?.val ?? 0;
  return Math.max(0, target - paid);
};

export const computeCreditsOwed = (stay?: Stay | null): number => {
  if (!stay) return 0;
  const target = stay.creditsTarget?.val ?? 0;
  const paid = stay.creditsPaid?.val ?? 0;
  return Math.max(0, target - paid);
};

export const computeTokensOwed = (stay?: Stay | null): number => {
  if (!stay) return 0;
  const target = stay.tokensTarget?.val ?? 0;
  const staked = stay.tokensStaked?.val ?? 0;
  const raw = Math.max(0, target - staked);
  if (!Number.isFinite(raw)) return 0;
  return Math.round(raw * 1e6) / 1e6;
};

export function getStayAccommodationGuestMultiplier(stay: {
  adults?: number;
  children?: number;
}): number {
  const adultsRaw = Number(stay.adults ?? 0);
  const childrenRaw = Number(stay.children ?? 0);
  const adults = Number.isFinite(adultsRaw) ? adultsRaw : 0;
  const children = Number.isFinite(childrenRaw) ? childrenRaw : 0;
  return Math.max(1, adults + children);
}

export const getStayAccommodationTokenTotal = (stay: Stay): number => {
  const rentalVal = stay.rentalToken?.val;
  if (rentalVal != null && Number.isFinite(rentalVal) && rentalVal >= 0) {
    return rentalVal;
  }
  const nights = getStayAccommodationNightCount(stay);
  const daily = stay.priceLock?.dailyRentalToken?.val ?? 0;
  const guests = getStayAccommodationGuestMultiplier(stay);
  if (!nights || !daily) return 0;
  return nights * daily * guests;
};

export const buildStayTokenStakePlan = (
  stay: Stay,
  tokensToStakeTotal: number,
): StayTokenStakePlan | null => {
  const startUtc = utcCalendarStartOfStay(stay.start);
  const duration = getStayAccommodationNightCount(stay);
  const maxTokensForStay = getStayAccommodationTokenTotal(stay);

  if (!startUtc.isValid() || duration <= 0 || maxTokensForStay <= 0)
    return null;

  const maxWeiRaw = ethersUtils.parseUnits(
    roundHumanTokenAmountForWei(maxTokensForStay),
    TDF_DECIMALS,
  );
  const durationBn = BigNumber.from(duration);
  const pricePerNightWei = maxWeiRaw.add(durationBn).sub(1).div(durationBn);
  if (pricePerNightWei.isZero()) return null;
  const maxWei = pricePerNightWei.mul(durationBn);

  const cappedWeiRaw = ethersUtils.parseUnits(
    roundHumanTokenAmountForWei(Math.min(tokensToStakeTotal, maxTokensForStay)),
    TDF_DECIMALS,
  );
  const cappedWei = cappedWeiRaw.gt(maxWei) ? maxWei : cappedWeiRaw;
  if (cappedWei.isZero()) return null;
  const nightsToStakeBn = cappedWei
    .mul(durationBn)
    .add(maxWei)
    .sub(1)
    .div(maxWei);
  let nightsToStake = nightsToStakeBn.toNumber();
  if (!Number.isFinite(nightsToStake)) nightsToStake = 0;
  nightsToStake = Math.min(duration, Math.max(0, nightsToStake));
  if (nightsToStake <= 0) return null;

  const nightsBn = BigNumber.from(nightsToStake);
  const totalStakeWei = pricePerNightWei.mul(nightsBn);
  const dailyValue = Number(
    ethersUtils.formatUnits(pricePerNightWei, TDF_DECIMALS),
  );
  const tokenAmount = Number(
    ethersUtils.formatUnits(totalStakeWei, TDF_DECIMALS),
  );

  const bookingNights: number[][] = [];
  for (let i = 0; i < nightsToStake; i++) {
    const d = startUtc.add(i, 'day');
    if (!d.isValid()) return null;
    const y = d.year();
    const doy = d.dayOfYear();
    if (!Number.isFinite(y) || !Number.isFinite(doy) || doy < 1) return null;
    bookingNights.push([y, doy]);
  }

  return {
    dailyValue,
    pricePerNightWei: pricePerNightWei.toString(),
    tokenAmount,
    bookingNights,
  };
};

export const accommodationTokenTotalFromPriceLock = (
  priceLock: { dailyRentalToken?: { val: number } | null } | null | undefined,
  duration: number,
  adults: number,
  listingIsPrivate?: boolean | null,
): number => {
  const dailyVal = priceLock?.dailyRentalToken?.val;
  if (
    dailyVal == null ||
    !Number.isFinite(Number(dailyVal)) ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return 0;
  }
  const guestMult = listingIsPrivate ? 1 : Math.max(1, adults);
  return Number((Number(dailyVal) * duration * guestMult).toFixed(6));
};

export const canChangeStayPaymentMethod = (stay: Stay): boolean => {
  if (isStayTerminal(stay)) return false;
  if (isStayAwaitingHostApproval(stay)) return false;
  if ((stay.creditsPaid?.val ?? 0) > 0) return false;
  if ((stay.tokensStaked?.val ?? 0) > 0) return false;
  return true;
};

export const canAugmentTokenOrCreditsPayment = (stay: Stay): boolean => {
  if (!isStayAwaitingPayment(stay)) return false;
  return computeTokensOwed(stay) > 0.005 || computeCreditsOwed(stay) > 0.005;
};

export const inferPaymentChoiceFromStay = (
  stay: Stay,
  totalAccommodationTokens?: number,
  opts?: { listingPrivate?: boolean | null },
): StayPaymentMethod => {
  const fullTokenAccommodation =
    totalAccommodationTokens ??
    (stay.priceLock?.dailyRentalToken?.val
      ? accommodationTokenTotalFromPriceLock(
          stay.priceLock,
          stay.duration || 0,
          stay.adults ?? 1,
          opts?.listingPrivate,
        )
      : 0);
  const tokensTarget = stay.tokensTarget?.val ?? stay.appliedTokens?.val ?? 0;
  const creditsTarget =
    stay.creditsTarget?.val ?? stay.appliedCredits?.val ?? 0;
  if (
    fullTokenAccommodation > 0 &&
    tokensTarget > 0 &&
    tokensTarget >= fullTokenAccommodation
  ) {
    return 'full-tokens';
  }
  if (tokensTarget > 0) return 'partial-tokens';
  if (
    fullTokenAccommodation > 0 &&
    creditsTarget > 0 &&
    creditsTarget >= fullTokenAccommodation
  ) {
    return 'full-credits';
  }
  if (creditsTarget > 0) return 'partial-credits';
  return 'fiat';
};

export const stayUsesTokenAccommodation = (stay: Stay): boolean => {
  if (stay.useTokens === true) return true;
  const tokenAccommodationVal = getStayAccommodationTokenTotal(stay);
  const choice = inferPaymentChoiceFromStay(stay, tokenAccommodationVal);
  return choice === 'full-tokens' || choice === 'partial-tokens';
};

type ApiOk<T> = { results: T };

export type StayBookingType = 'volunteer' | 'residence';

export type StaySearchPayload = {
  start: string;
  end: string;
  adults: number;
  children?: number;
  eventId?: string | null;
  /**
   * Classifies the stay server-side (stored as volunteerInfo.bookingType) and
   * restricts results to listings whose availableFor covers it. Replaces the
   * deprecated volunteerId.
   */
  bookingType?: StayBookingType | null;
  isFriendsBooking?: boolean;
  /**
   * Team stays ignore event calendar blocks, so without it the search greys out
   * dates POST /stays accepts. Role-gated server-side (space-host, steward,
   * land manager, team, admin) — everyone else gets the regular calendar back.
   */
  isTeamBooking?: boolean;
};

export const searchStays = async (
  payload: StaySearchPayload,
): Promise<StaySearchResponse> => {
  const { data } = await api.post('/stays/search', payload);
  return data as StaySearchResponse;
};

export const checkStayListingAvailability = async (
  listingId: string,
  payload: {
    start: string;
    end: string;
    adults: number;
    /**
     * Required for volunteer stays: without it the calendar greys out days that
     * POST /stays accepts, because volunteer stays ignore event calendar blocks
     * and use the volunteering minimum stay.
     */
    bookingType?: StayBookingType | null;
    /**
     * Same story as volunteer stays for a stay booked for the team: the block is
     * ignored by POST /stays, so the calendar has to ignore it too. Role-gated
     * server-side and ignored for anyone else.
     */
    isTeamBooking?: boolean;
    isFriendsBooking?: boolean;
    eventId?: string | null;
  },
): Promise<{
  results: boolean;
  availability: any[];
  availabilityReason: string | null;
}> => {
  const { data } = await api.post(
    `/stays/listing/${listingId}/availability`,
    payload,
  );
  return data;
};

export type CreateStayPayload = {
  /** Required except for day tickets, which reserve no space. */
  listingId?: string;
  start: string;
  end: string;
  adults: number;
  children?: number;
  infants?: number;
  pets?: number;
  isHourlyBooking?: boolean;
  isDayTicket?: boolean;
  isFriendsBooking?: boolean;
  friendEmails?: string;
  /**
   * Co-guest user ids. Only settable at creation: a draft stay rejects edits,
   * and afterwards the list moves through addStayGuest/removeStayGuest.
   */
  guests?: string[];
  eventId?: string | null;
  /**
   * Shorthand the server folds into volunteerInfo when there are no application
   * details to send. Prefer the full volunteerInfo when there are.
   */
  bookingType?: StayBookingType | null;
  volunteerInfo?: VolunteerInfo;
  isTeamBooking?: boolean;
  ticketOption?: string | null;
  eventDiscount?: string | null;
  foodOption?: string;
  foodOptionId?: string | null;
  doesNeedPickup?: boolean;
  doesNeedSeparateBeds?: boolean;
  parentBookingId?: string | null;
};

export const createStay = async (payload: CreateStayPayload): Promise<Stay> => {
  const { data } = await api.post('/stays', payload);
  return (data as ApiOk<Stay>).results;
};

export const getStay = async (id: string): Promise<Stay> => {
  const { data } = await api.get(`/stays/${id}`, { cache: false } as any);
  return (data as ApiOk<Stay>).results;
};

export type CreateAdminStayPayload = {
  listingId: string;
  start: string;
  end: string;
  adults: number;
  adminBookingReason?: string;
  isTeamBooking?: boolean;
};

/**
 * Host-only manual booking. The server zeroes the payment targets, so the stay
 * lands on 'paid' without going through checkout.
 */
export const createAdminStay = async (
  payload: CreateAdminStayPayload,
): Promise<Stay> => {
  const { data } = await api.post('/stays/admin', payload);
  return unwrapStayMutationResult(data);
};

const zeroStayMoney = (money: StayMoney): StayMoney => ({
  val: 0,
  cur: money.cur,
});

export const applyOptimisticTeamBookingToStay = (
  stay: Stay,
  isTeamBooking: boolean,
  previousPriceLock?: PriceLock | null,
): Stay => {
  if (!isTeamBooking) {
    if (!previousPriceLock) {
      return { ...stay, isTeamBooking: false };
    }
    return {
      ...stay,
      isTeamBooking: false,
      priceLock: previousPriceLock,
      fiatTarget: {
        val: previousPriceLock.total.val,
        cur: previousPriceLock.total.cur,
      },
    };
  }

  if (!stay.priceLock) {
    return { ...stay, isTeamBooking: true };
  }

  const priceLock = stay.priceLock;
  const waived =
    priceLock.lines.accommodation.val +
    priceLock.lines.food.val +
    priceLock.lines.utility.val;
  const newSubtotal = Math.max(
    0,
    +(priceLock.subtotal.val - waived).toFixed(2),
  );
  const newTotal = Math.max(0, +(priceLock.total.val - waived).toFixed(2));

  return {
    ...stay,
    isTeamBooking: true,
    priceLock: {
      ...priceLock,
      lines: {
        ...priceLock.lines,
        accommodation: zeroStayMoney(priceLock.lines.accommodation),
        accommodationGross: zeroStayMoney(
          priceLock.lines.accommodationGross ?? priceLock.lines.accommodation,
        ),
        food: zeroStayMoney(priceLock.lines.food),
        utility: zeroStayMoney(priceLock.lines.utility),
      },
      subtotal: { ...priceLock.subtotal, val: newSubtotal },
      total: { ...priceLock.total, val: newTotal },
    },
    fiatTarget: stay.fiatTarget
      ? { ...stay.fiatTarget, val: newTotal }
      : { val: newTotal, cur: priceLock.total.cur },
  };
};

export type StayOptionsPayload = Partial<{
  foodOption: string;
  foodOptionId: string | null;
  doesNeedPickup: boolean;
  doesNeedSeparateBeds: boolean;
  isTeamBooking: boolean;
  message: string;
  gift: string;
  about: string;
  volunteerInfo: VolunteerInfo;
  ticketOption: string | null;
  eventDiscount: string | null;
}>;

export const updateStayOptions = async (
  id: string,
  payload: StayOptionsPayload,
): Promise<Stay> => {
  const { data } = await api.patch(`/stays/${id}/options`, payload);
  return (data as ApiOk<Stay>).results;
};

export type StayPaymentMethodPayload = {
  method: StayPaymentMethod;
  appliedCredits?: number;
  appliedTokens?: number;
};

export const setStayPaymentMethod = async (
  id: string,
  payload: StayPaymentMethodPayload,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/payment-method`, payload);
  return (data as ApiOk<Stay>).results;
};

export type StayQuotePayload = Partial<{
  duration: number;
  end: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  listingId: string;
  foodOption: string;
  foodOptionId: string | null;
  appliedCredits: number;
  appliedTokens: number;
}>;

export const quoteStay = async (
  id: string,
  payload: StayQuotePayload,
): Promise<StayQuoteResponse> => {
  const { data } = await api.post(`/stays/${id}/quote`, payload);
  return (data as ApiOk<StayQuoteResponse>).results;
};

export function computeFiatDiscountFromStayQuote(
  stay: Stay,
  quote: StayQuoteResponse,
): { amount: number; cur: string } {
  const before = computeFiatOwed(stay);
  const deltaVal = Number(quote.delta?.fiat?.val ?? NaN);
  let after: number;
  if (Number.isFinite(deltaVal)) {
    after = Math.max(0, before + deltaVal);
  } else {
    const paid = stay.fiatPaid?.val ?? 0;
    const newTotalVal = Number(quote.priceLock?.total?.val ?? NaN);
    if (!Number.isFinite(newTotalVal)) {
      return { amount: 0, cur: 'EUR' };
    }
    after = Math.max(0, newTotalVal - paid);
  }
  const amount = Math.max(0, Math.round((before - after) * 100) / 100);
  const cur = String(
    quote.delta?.fiat?.cur ?? quote.priceLock?.total?.cur ?? 'EUR',
  );
  return { amount, cur };
}

export const submitStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/submit`, {});
  return (data as ApiOk<Stay>).results;
};

export const checkoutStay = async (
  id: string,
  paymentMethod?: string,
): Promise<StayCheckoutResponse> => {
  const trimmed =
    typeof paymentMethod === 'string' ? paymentMethod.trim() : '';
  const { data } = await api.post(
    `/stays/${id}/checkout`,
    trimmed ? { paymentMethod: trimmed } : {},
  );
  return (data as ApiOk<StayCheckoutResponse>).results;
};

export const confirmStayCheckout = async (
  id: string,
  paymentIntentId: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/checkout/confirm`, {
    paymentIntentId,
  });
  return (data as ApiOk<Stay>).results;
};

/**
 * Crypto rail for the fiat leg — alternative to the Stripe /checkout pair.
 * Empty body: re-verifies availability, pre-assigns beds and returns the
 * stablecoin transfer quote. Credits and token-stake legs are unaffected.
 */
export const quoteStayTokenPayment = async (
  id: string,
): Promise<StayTokenPaymentQuote> => {
  const { data } = await api.post(`/stays/${id}/token-payment`, {});
  return (data as ApiOk<StayTokenPaymentQuote>).results;
};

/**
 * Step 2: pass the hash of the client-side stablecoin transfer. Idempotent on
 * txHash (scoped per booking). A 400 "could not be verified" usually means the
 * explorer has not indexed the tx yet — see isStayTokenPaymentNotIndexedError.
 */
export const confirmStayTokenPayment = async (
  id: string,
  txHash: string,
): Promise<StayTokenPaymentConfirmResponse> => {
  const { data } = await api.post(`/stays/${id}/token-payment`, { txHash });
  const results = (
    data as ApiOk<{ booking?: Stay | null; verified?: boolean }>
  )?.results;
  if (results?.booking) {
    return { booking: results.booking, verified: Boolean(results.verified) };
  }
  const booking = await getStay(id);
  return { booking, verified: Boolean(results?.verified) };
};

/** True for the 400 the server answers while the block explorer has not
 * indexed the transfer yet — safe to retry after a few seconds. */
export const isStayTokenPaymentNotIndexedError = (message: string): boolean =>
  /could not be verified/i.test(message);

export type StakeStayTokensOptions = {
  syncBookingAlreadyOnChain?: boolean;
};

export const stakeStayTokens = async (
  id: string,
  transactionId: string,
  options?: StakeStayTokensOptions,
): Promise<{ booking: Stay; verified: boolean }> => {
  const body: Record<string, unknown> =
    options?.syncBookingAlreadyOnChain === true
      ? { syncBookingAlreadyOnChain: true }
      : { transactionId };
  const { data } = await api.post(`/stays/${id}/token-stake`, body);
  const results = (data as ApiOk<{ booking?: Stay | null; verified?: boolean }>)
    ?.results;
  if (results?.booking) {
    return { booking: results.booking, verified: Boolean(results.verified) };
  }
  const booking = await getStay(id);
  return { booking, verified: Boolean(results?.verified) };
};

export const cancelStay = async (
  id: string,
): Promise<{ booking: Stay; refund: any }> => {
  const { data } = await api.post(`/stays/${id}/cancel`, {});
  return (data as ApiOk<{ booking: Stay; refund: any }>).results;
};

function unwrapStayMutationResult(data: { results?: unknown }): Stay {
  const r = data?.results as { booking?: Stay } | Stay;
  if (
    r &&
    typeof r === 'object' &&
    'booking' in r &&
    (r as { booking: Stay }).booking
  ) {
    return (r as { booking: Stay }).booking;
  }
  return r as Stay;
}

export function mapStayQuoteToUpdatedPrices(
  quote: StayQuoteResponse,
  duration: number,
  tokenGuestOpts?: { adults?: number; listingPrivate?: boolean | null },
): UpdatedPrices {
  const pl = quote.priceLock;
  const dailyTok = pl.dailyRentalToken;
  const tokenVal =
    tokenGuestOpts != null
      ? accommodationTokenTotalFromPriceLock(
          pl,
          duration,
          tokenGuestOpts.adults ?? 1,
          tokenGuestOpts.listingPrivate,
        )
      : Number(dailyTok?.val ?? 0) * (duration || 1);
  const payDelta: BookingPaymentDelta = {
    fiat: {
      val: quote.delta.fiat.val,
      cur: quote.delta.fiat.cur as CloserCurrencies.EUR,
    },
  };
  return {
    rentalFiat: {
      val: pl.lines.accommodation.val,
      cur: pl.lines.accommodation.cur as CloserCurrencies.EUR,
    },
    rentalToken: {
      val: tokenVal,
      cur: dailyTok.cur as CloserCurrencies.TDF,
    },
    utilityFiat: {
      val: pl.lines.utility.val,
      cur: pl.lines.utility.cur as CloserCurrencies.EUR,
    },
    foodFiat: {
      val: pl.lines.food.val,
      cur: pl.lines.food.cur as CloserCurrencies.EUR,
    },
    eventFiat: {
      val: pl.lines.event.val,
      cur: pl.lines.event.cur as CloserCurrencies.EUR,
    },
    total: {
      val: pl.total.val,
      cur: pl.total.cur as CloserCurrencies.EUR,
    },
    paymentDelta: payDelta,
  };
}

export const extendStay = async (
  id: string,
  payload: { end: string },
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/extend`, payload);
  return unwrapStayMutationResult(data);
};

export const approveStayExtension = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/extension/approve`, {});
  return unwrapStayMutationResult(data);
};

export const rejectStayExtension = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/extension/reject`, {});
  return unwrapStayMutationResult(data);
};

export const upgradeStayListing = async (
  id: string,
  payload: { listingId: string },
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/upgrade`, payload);
  return unwrapStayMutationResult(data);
};

/** Changes the head counts. Shares its path with the co-guest endpoints below,
 * which the server tells apart by the userId in the body. */
export const updateStayGuests = async (
  id: string,
  payload: {
    adults: number;
    children?: number;
    infants?: number;
    pets?: number;
  },
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/guests`, payload);
  return unwrapStayMutationResult(data);
};

/**
 * Co-guest membership lives on booking.guests, which PATCH /booking/:id
 * refuses to write — these are the only way to change it.
 */
export const addStayGuest = async (
  id: string,
  userId: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/guests`, { userId });
  return unwrapStayMutationResult(data);
};

export const removeStayGuest = async (
  id: string,
  userId: string,
): Promise<Stay> => {
  const { data } = await api.delete(`/stays/${id}/guests`, {
    data: { userId },
  });
  return unwrapStayMutationResult(data);
};

export const shortenStay = async (
  id: string,
  payload: { end: string },
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/shorten`, payload);
  return unwrapStayMutationResult(data);
};

export const assignStayBeds = async (
  id: string,
  payload: { roomOrBedNumbers?: number[]; auto?: boolean },
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/assign-beds`, payload);
  return unwrapStayMutationResult(data);
};

export const setStayStatusApi = async (
  id: string,
  payload: { status: string },
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/set-status`, payload);
  return unwrapStayMutationResult(data);
};

export const approveStayRequest = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/approve`, {});
  return unwrapStayMutationResult(data);
};

export const rejectStayRequest = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/reject`, {});
  return unwrapStayMutationResult(data);
};

export type DiscountProbeResult = {
  status: 'success' | 'fail';
  reason: '' | 'invalid_code' | 'ticket_mismatch';
  applicableTicketName: string;
  discount: {
    code: string;
    name?: string;
    percent?: number;
    val?: number;
  } | null;
  currency?: CloserCurrencies;
  discountType: '' | 'percent' | 'val';
  discountVal: number;
  discountPercent: number;
};

/**
 * Probes a discount code. A rejected code is a 200 with status: 'fail' — only a
 * non-2xx means the request itself failed. Runs the same validator as the
 * eventDiscount write on PATCH /stays/:id/options.
 */
export const validateDiscountCode = async (payload: {
  discountCode: string;
  eventId?: string;
  stayId?: string;
  ticketOption?: unknown;
}): Promise<DiscountProbeResult> => {
  const { data } = await api.post('/stays/validate-discount-code', payload);
  return (data as ApiOk<DiscountProbeResult>).results;
};

export type SendStayToFriendsResult = {
  emailsSent: number;
  emails: string[];
  /** Malformed addresses skipped server-side; the rest were still sent. */
  invalidEmails?: string[];
  totalEmailsProcessed: number;
};

/**
 * Unlike the legacy endpoint, this no longer confirms the stay as a side
 * effect — submit the stay first or the server answers 400.
 *
 * Accepts the comma-separated string the stay stores as well as an array; omit
 * it entirely to let the server use the stay's own friendEmails.
 */
export const sendStayToFriends = async (
  id: string,
  friendEmails?: string[] | string | null,
): Promise<SendStayToFriendsResult> => {
  const emails =
    typeof friendEmails === 'string'
      ? friendEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean)
      : friendEmails ?? undefined;
  const { data } = await api.post(
    `/stays/${id}/send-to-friend`,
    emails?.length ? { friendEmails: emails } : {},
  );
  return (data as ApiOk<SendStayToFriendsResult>).results;
};

/**
 * Adds the caller to the stay's managedBy, which is what grants them
 * GET /stays/:id and the checkout pair. Idempotent; 403 when the caller's email
 * is not on the invite list.
 */
export const claimStayAsFriend = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/claim-as-friend`, {});
  return (data as ApiOk<Stay>).results;
};

export const checkInStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/check-in`, {});
  return unwrapStayMutationResult(data);
};

export const checkOutStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/check-out`, {});
  return unwrapStayMutationResult(data);
};
