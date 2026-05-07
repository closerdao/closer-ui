import api from './api';
import { priceFormat } from './helpers';

import type { CloserCurrencies } from '../types/currency';
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
