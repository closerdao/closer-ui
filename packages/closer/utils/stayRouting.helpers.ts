import dayjs from 'dayjs';

import type { Stay } from '../types/stay';
import api from './api';
import { normalizeDiscountCode } from './discountCode';

export function isStayMongoId(param: string | undefined): boolean {
  return typeof param === 'string' && /^[a-f\d]{24}$/i.test(param);
}

export type StayCreateListingHrefParams = {
  listingId: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  totalGuests?: number;
  adults?: number;
  kids?: number;
  children?: number;
  infants?: number;
  pets?: number;
};

export function buildStayCreateListingHref(
  params: StayCreateListingHrefParams,
): string {
  const q = new URLSearchParams();
  q.set('listingId', params.listingId);
  if (params.startDate && params.endDate) {
    q.set('start', dayjs(params.startDate).format('YYYY-MM-DD'));
    q.set('end', dayjs(params.endDate).format('YYYY-MM-DD'));
  }
  const adults = params.totalGuests ?? params.adults;
  if (adults != null) {
    q.set('adults', String(adults));
  }
  const kids = params.kids ?? params.children;
  if (kids) {
    q.set('children', String(kids));
  }
  if (params.infants) {
    q.set('infants', String(params.infants));
  }
  if (params.pets) {
    q.set('pets', String(params.pets));
  }
  return `/stay/create?${q.toString()}`;
}

export type StayCreateEventHrefParams = {
  eventId: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
  ticketOption?: string | null;
  discountCode?: string | null;
};

export function buildStayCreateEventHref(
  params: StayCreateEventHrefParams,
): string {
  const q = new URLSearchParams();
  q.set('eventId', params.eventId);
  if (params.startDate) {
    q.set('start', dayjs(params.startDate).format('YYYY-MM-DD'));
  }
  if (params.endDate) {
    q.set('end', dayjs(params.endDate).format('YYYY-MM-DD'));
  }
  if (params.adults != null) {
    q.set('adults', String(params.adults));
  }
  if (params.children) {
    q.set('children', String(params.children));
  }
  if (params.infants) {
    q.set('infants', String(params.infants));
  }
  if (params.pets) {
    q.set('pets', String(params.pets));
  }
  if (params.ticketOption) {
    q.set('ticketOption', params.ticketOption);
  }
  if (params.discountCode) {
    q.set('discountCode', normalizeDiscountCode(params.discountCode));
  }
  return `/stay/create?${q.toString()}`;
}

export type StayCheckoutHrefParams = {
  ticketOption?: string | null;
  discountCode?: string | null;
};

/**
 * The checkout page loads the stay by id, so anything the guest chose before
 * the stay existed — the event ticket, the discount code that goes with it —
 * only reaches it through the URL. Carrying it here lets checkout write it onto
 * the stay instead of asking for it a second time.
 */
export function buildStayCheckoutHref(
  stayId: string,
  params: StayCheckoutHrefParams = {},
): string {
  const q = new URLSearchParams();
  if (params.ticketOption) {
    q.set('ticketOption', params.ticketOption);
  }
  if (params.discountCode) {
    q.set('discountCode', normalizeDiscountCode(params.discountCode));
  }
  const qs = q.toString();
  return `/stay/create/${stayId}${qs ? `?${qs}` : ''}`;
}

export function buildStayCreateHrefFromStay(stay: Stay): string {
  const q = new URLSearchParams();
  if (stay.start) {
    q.set('start', dayjs(stay.start).format('YYYY-MM-DD'));
  }
  if (stay.end) {
    q.set('end', dayjs(stay.end).format('YYYY-MM-DD'));
  }
  if (stay.adults != null) {
    q.set('adults', String(stay.adults));
  }
  if (stay.children) {
    q.set('children', String(stay.children));
  }
  if (stay.infants) {
    q.set('infants', String(stay.infants));
  }
  if (stay.pets) {
    q.set('pets', String(stay.pets));
  }
  if (stay.eventId) {
    q.set('eventId', stay.eventId);
  }
  const bookingType = stay.volunteerInfo?.bookingType;
  if (bookingType === 'volunteer' || bookingType === 'residence') {
    q.set('bookingType', bookingType);
  }
  const qs = q.toString();
  return qs ? `/stay/create?${qs}` : '/stay/create';
}

export function buildStayCreateListingBackPath(
  params: StayCreateListingHrefParams,
): string {
  return buildStayCreateListingHref(params).replace(/^\//, '');
}

export function buildStayBookingHref(bookingId: string): string {
  return `/stay/${bookingId}`;
}

export function decodeBookingFlowBackParam(
  back: string | string[] | undefined,
): string | null {
  if (!back || Array.isArray(back)) {
    return null;
  }
  try {
    return decodeURIComponent(back);
  } catch {
    return null;
  }
}

function normalizeBookingFlowBackPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes('://')) {
    return null;
  }
  const withoutLeading = trimmed.replace(/^\/+/, '');
  if (!withoutLeading) {
    return null;
  }
  return withoutLeading;
}

export function resolveBookingFlowBackUrl(
  back: string | string[] | undefined,
  overrides: URLSearchParams,
): string | null {
  const decoded = decodeBookingFlowBackParam(back);
  if (!decoded) {
    return null;
  }
  const qIndex = decoded.indexOf('?');
  const rawPath = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
  const path = normalizeBookingFlowBackPath(rawPath);
  if (!path) {
    return null;
  }
  const existing = qIndex >= 0 ? decoded.slice(qIndex + 1) : '';
  const merged = new URLSearchParams(existing);
  overrides.forEach((value, key) => {
    merged.set(key, value);
  });
  const qs = merged.toString();
  return `/${path}${qs ? `?${qs}` : ''}`;
}

export async function resolveLegacyListingStaySlugRedirect(
  slug: string | undefined,
): Promise<string | null> {
  if (!slug || isStayMongoId(slug)) {
    return null;
  }
  try {
    const { data } = await api.get(`/listing/${slug}`);
    const listing = data?.results;
    if (listing?._id) {
      return buildStayCreateListingHref({ listingId: listing._id });
    }
  } catch {
    return null;
  }
  return null;
}
