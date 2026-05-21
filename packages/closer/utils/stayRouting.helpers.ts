import dayjs from 'dayjs';

import api from './api';

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
