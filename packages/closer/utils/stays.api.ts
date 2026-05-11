import { BigNumber, utils as ethersUtils } from 'ethers';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import utc from 'dayjs/plugin/utc';

import api from './api';
import { priceFormat } from './helpers';

import { CloserCurrencies } from '../types/currency';
import type {
  BookingPaymentDelta,
  UpdatedPrices,
} from '../types/booking';
import type {
  Stay,
  StayCheckoutResponse,
  StayMoney,
  StayPaymentMethod,
  StayQuoteResponse,
  StaySearchResponse,
  StayStatus,
  StayTokenStakePlan,
} from '../types/stay';

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

export const formatStayMoney = (money: StayMoney | undefined | null): string => {
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

export const STAY_TERMINAL_STATUSES: ReadonlyArray<StayStatus> = [
  'cancelled',
  'rejected',
];

export const isStayTerminal = (
  stayOrStatus: Pick<Stay, 'status'> | StayStatus,
): boolean => {
  const status =
    typeof stayOrStatus === 'string' ? stayOrStatus : stayOrStatus.status;
  return STAY_TERMINAL_STATUSES.includes(status);
};

export const isStayPaid = (stay: Pick<Stay, 'status'>): boolean =>
  stay.status === 'paid';

export const isStayAwaitingPayment = (stay: Pick<Stay, 'status'>): boolean =>
  stay.status === 'confirmed' || stay.status === 'pending-payment';

export const computeFiatOwed = (stay: Stay): number => {
  const target =
    stay.fiatTarget?.val ?? stay.priceLock?.total.val ?? 0;
  const paid = stay.fiatPaid?.val ?? 0;
  return Math.max(0, target - paid);
};

export const computeCreditsOwed = (stay: Stay): number => {
  const target = stay.creditsTarget?.val ?? 0;
  const paid = stay.creditsPaid?.val ?? 0;
  return Math.max(0, target - paid);
};

export const computeTokensOwed = (stay: Stay): number => {
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

  if (!startUtc.isValid() || duration <= 0 || maxTokensForStay <= 0) return null;

  const maxWei = ethersUtils.parseUnits(
    roundHumanTokenAmountForWei(maxTokensForStay),
    TDF_DECIMALS,
  );
  const cappedWei = ethersUtils.parseUnits(
    roundHumanTokenAmountForWei(
      Math.min(tokensToStakeTotal, maxTokensForStay),
    ),
    TDF_DECIMALS,
  );
  if (cappedWei.isZero()) return null;
  const durationBn = BigNumber.from(duration);
  const pricePerNightWei = maxWei.div(durationBn);
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

  return {
    dailyValue,
    tokenAmount,
    bookingNights: Array.from({ length: nightsToStake }, (_, i) => {
      const d = startUtc.add(i, 'day');
      return [d.year(), d.dayOfYear()];
    }),
  };
};

export const canChangeStayPaymentMethod = (stay: Stay): boolean => {
  if (isStayTerminal(stay)) return false;
  if ((stay.creditsPaid?.val ?? 0) > 0) return false;
  if ((stay.tokensStaked?.val ?? 0) > 0) return false;
  return true;
};

export const inferPaymentChoiceFromStay = (
  stay: Stay,
  totalAccommodationTokens?: number,
): StayPaymentMethod => {
  const fullTokenAccommodation =
    totalAccommodationTokens ?? getStayAccommodationTokenTotal(stay);
  const tokensTarget = stay.tokensTarget?.val ?? stay.appliedTokens?.val ?? 0;
  const creditsTarget = stay.creditsTarget?.val ?? stay.appliedCredits?.val ?? 0;
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

type ApiOk<T> = { results: T };

export type StaySearchPayload = {
  start: string;
  end: string;
  adults: number;
  children?: number;
  eventId?: string | null;
  volunteerId?: string | null;
  isFriendsBooking?: boolean;
};

export const searchStays = async (
  payload: StaySearchPayload,
): Promise<StaySearchResponse> => {
  const { data } = await api.post('/stays/search', payload);
  return data as StaySearchResponse;
};

export const checkStayListingAvailability = async (
  listingId: string,
  payload: { start: string; end: string; adults: number },
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
  listingId: string;
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
  eventId?: string | null;
  volunteerId?: string | null;
  volunteerInfo?: { bookingType: 'volunteer' | 'residence' };
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

export type StayOptionsPayload = Partial<{
  foodOption: string;
  foodOptionId: string | null;
  doesNeedPickup: boolean;
  doesNeedSeparateBeds: boolean;
  message: string;
  gift: string;
  about: string;
  volunteerInfo: { bookingType: 'volunteer' | 'residence' };
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

export const submitStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/submit`, {});
  return (data as ApiOk<Stay>).results;
};

export const checkoutStay = async (
  id: string,
  paymentMethod: string,
): Promise<StayCheckoutResponse> => {
  const { data } = await api.post(`/stays/${id}/checkout`, { paymentMethod });
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

export const stakeStayTokens = async (
  id: string,
  transactionId: string,
): Promise<{ booking: Stay; verified: boolean }> => {
  const { data } = await api.post(`/stays/${id}/token-stake`, {
    transactionId,
  });
  return (data as ApiOk<{ booking: Stay; verified: boolean }>).results;
};

export const cancelStay = async (
  id: string,
): Promise<{ booking: Stay; refund: any }> => {
  const { data } = await api.post(`/stays/${id}/cancel`, {});
  return (data as ApiOk<{ booking: Stay; refund: any }>).results;
};

export function isStayShapedBooking(
  record: Record<string, unknown> | null | undefined,
): boolean {
  if (!record) return false;
  return (
    record.priceLock != null ||
    record.fiatTarget != null ||
    record.creditsTarget != null ||
    record.tokensTarget != null ||
    record.fiatPaid != null ||
    record.creditsPaid != null ||
    record.tokensStaked != null
  );
}

function unwrapStayMutationResult(data: { results?: unknown }): Stay {
  const r = data?.results as { booking?: Stay } | Stay;
  if (r && typeof r === 'object' && 'booking' in r && (r as { booking: Stay }).booking) {
    return (r as { booking: Stay }).booking;
  }
  return r as Stay;
}

export function mapStayQuoteToUpdatedPrices(
  quote: StayQuoteResponse,
  duration: number,
  guestMultiplier?: number,
): UpdatedPrices {
  const pl = quote.priceLock;
  const dailyTok = pl.dailyRentalToken;
  const guests =
    guestMultiplier != null && guestMultiplier > 0 ? guestMultiplier : 1;
  const tokenVal =
    Number(dailyTok?.val ?? 0) * (duration || 1) * guests;
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

export const extendStay = async (id: string, payload: { end: string }): Promise<Stay> => {
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

export const shortenStay = async (id: string, payload: { end: string }): Promise<Stay> => {
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

export const checkInStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/check-in`, {});
  return unwrapStayMutationResult(data);
};

export const checkOutStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/check-out`, {});
  return unwrapStayMutationResult(data);
};
