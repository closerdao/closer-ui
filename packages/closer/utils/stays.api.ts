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
} from '../types/stay';

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
  return Math.max(0, target - staked);
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
    totalAccommodationTokens ??
    (stay.priceLock?.dailyRentalToken?.val
      ? stay.priceLock.dailyRentalToken.val * (stay.duration || 1)
      : 0);
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
): UpdatedPrices {
  const pl = quote.priceLock;
  const dailyTok = pl.dailyRentalToken;
  const tokenVal = Number(dailyTok?.val ?? 0) * (duration || 1);
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
