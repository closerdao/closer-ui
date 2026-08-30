import dayjs from 'dayjs';

import { DEFAULT_CURRENCY } from '../constants';
import { Listing } from '../types';

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Nights an event spans. Guests arrive on the start day and leave on the end
 * day, so the count is the distance between those calendar days — diffing the
 * raw timestamps drops a night whenever an event ends earlier in the day than
 * it started, which is the normal case (afternoon arrival, morning departure).
 * Matches the duration the server prices the stay on.
 */
export const getEventNights = (
  start?: string | Date | null,
  end?: string | Date | null,
): number => {
  if (!start || !end) return 0;
  const from = dayjs(start).startOf('day');
  const to = dayjs(end).startOf('day');
  if (!from.isValid() || !to.isValid()) return 0;
  return Math.max(to.diff(from, 'day'), 0);
};

/**
 * True when attending means sleeping over: the event spans at least one night
 * and happens somewhere. A one-day event and a virtual one both leave the
 * guest nowhere to sleep, so they are sold as a ticket alone and must never be
 * handed to the booking flow.
 */
export const eventNeedsAccommodation = (
  event?: {
    start?: string | Date | null;
    end?: string | Date | null;
    virtual?: boolean;
  } | null,
): boolean =>
  Boolean(event) &&
  !event?.virtual &&
  getEventNights(event?.start, event?.end) > 0;

/**
 * An event nobody pays to attend: it was never marked paid, or every ticket it
 * sells is priced at nothing. It still issues a ticket — one marked free
 * rather than paid — so attendance is counted the same way whatever the price.
 *
 * An event marked paid that carries no ticket options is a half-finished one,
 * and there is no price to charge, so it reads as free here rather than as a
 * purchase nobody can complete.
 */
export const isFreeEvent = (
  event?: { paid?: boolean; ticketOptions?: { price?: number }[] } | null,
  options?: { price?: number }[] | null,
): boolean => {
  if (!event) return false;
  if (!event.paid) return true;
  const priced = options?.length ? options : event.ticketOptions || [];
  return priced.every((option) => !(Number(option?.price) > 0));
};

/** Statuses where a booking still holds a bed the guest has not given up. */
export const ACTIVE_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'tokens-staked',
  'credits-paid',
  'paid',
  'checked-in',
  'checked-out',
];

export type AccommodationBooking = {
  _id: string;
  start: string;
  end: string;
  status?: string;
  listing?: string | null;
  isDayTicket?: boolean;
  eventId?: string | null;
};

/**
 * True when a booking already puts the guest on site for every night of the
 * event, so they only need a ticket. Day tickets and listing-less bookings
 * reserve no space and therefore never cover anything.
 */
export const doesBookingCoverEvent = (
  booking: AccommodationBooking | null | undefined,
  eventStart?: string | Date | null,
  eventEnd?: string | Date | null,
): boolean => {
  if (!booking || !eventStart || !eventEnd) return false;
  if (booking.isDayTicket || !booking.listing) return false;
  if (booking.status && !ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    return false;
  }
  const bookingStart = dayjs(booking.start).startOf('day');
  const bookingEnd = dayjs(booking.end).startOf('day');
  const from = dayjs(eventStart).startOf('day');
  const to = dayjs(eventEnd).startOf('day');
  if (!bookingStart.isValid() || !bookingEnd.isValid()) return false;
  if (!from.isValid() || !to.isValid()) return false;

  return !bookingStart.isAfter(from) && !bookingEnd.isBefore(to);
};

export type CalendarBlockingEvent = {
  _id: string;
  name: string;
  slug?: string;
  start: string;
  end: string;
  paid?: boolean;
  blocksBookingCalendar?: boolean;
};

/**
 * Events flagged `blocksBookingCalendar` make /stays/search return every
 * listing as unavailable without saying why, so the stay flow matches its own
 * search range against those events to explain the greyed out results.
 *
 * A night is blocked when its date falls inside the event, including the event
 * end day (same rule the legacy booking calendar used). A stay that checks out
 * on the event start day therefore does not overlap.
 */
export const getCalendarBlockingEventsInRange = (
  events: CalendarBlockingEvent[] | null | undefined,
  start?: string | Date | null,
  end?: string | Date | null,
): CalendarBlockingEvent[] => {
  if (!events?.length || !start || !end) return [];

  const stayStart = dayjs(start).startOf('day');
  const stayEnd = dayjs(end).startOf('day');
  if (!stayStart.isValid() || !stayEnd.isValid()) return [];

  return events.filter((event) => {
    if (!event?.blocksBookingCalendar || !event.start || !event.end) {
      return false;
    }
    const eventStart = dayjs(event.start).startOf('day');
    const eventEnd = dayjs(event.end).startOf('day');
    if (!eventStart.isValid() || !eventEnd.isValid()) return false;

    return !stayStart.isAfter(eventEnd) && stayEnd.isAfter(eventStart);
  });
};

export function transformEventFoodBeforeSave<
  T extends { foodOptionId?: string | null },
>(data: T): T & { foodOption: string; foodOptionId: string | null } {
  let raw = data.foodOptionId;
  if (
    raw === 'null' ||
    raw === 'undefined' ||
    (typeof raw === 'string' && raw.trim().toLowerCase() === 'null')
  ) {
    raw = null;
  }
  const foodOption =
    raw === 'no_food'
      ? 'no_food'
      : raw && raw !== ''
      ? 'food_package'
      : 'default';
  const foodOptionId = foodOption === 'food_package' ? raw ?? null : null;
  return { ...data, foodOption, foodOptionId };
}

export function toPhotoId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string'
      ? first
      : (first as { _id?: string })?._id ?? null;
  }
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const id = (value as { _id: unknown })._id;
    return typeof id === 'string' ? id : (id as any)?.toString?.() ?? null;
  }
  return null;
}

const isHighSeason = (seasons: any, startDate: any) => {
  const start = seasons?.high?.start;
  const rawEnd = seasons?.high?.end;
  if (!start || !rawEnd) return false;
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return false;
  const currentMonth = date.toLocaleString('en-US', { month: 'long' }); // Get current month in string format
  const end =
    String(rawEnd).toLowerCase() === 'nov' ? 'november' : String(rawEnd);
  const monthNames = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const startMonthIndex = monthNames.findIndex(
    (month) => month.toLowerCase() === String(start).toLowerCase(),
  );
  const endMonthIndex = monthNames.findIndex(
    (month) => month.toLowerCase() === end.toLowerCase(),
  );
  const currentMonthIndex = monthNames.findIndex(
    (month) => month.toLowerCase() === currentMonth.toLowerCase(),
  );
  if (
    startMonthIndex !== -1 &&
    endMonthIndex !== -1 &&
    currentMonthIndex !== -1
  ) {
    if (
      startMonthIndex <= currentMonthIndex &&
      currentMonthIndex <= endMonthIndex
    ) {
      return true;
    }
  }
  return false;
};

const getMinMaxFiatPrice = (
  listings: Listing[],
): { min: number; max: number } => {
  const values = listings
    .map((listing) => toFiniteNumber(listing?.fiatPrice?.val, NaN))
    .filter((val) => Number.isFinite(val));

  if (values.length === 0) {
    return { min: 0, max: 0 };
  }
  return { min: Math.min(...values), max: Math.max(...values) };
};

const getAccommodationListingCurrency = (listings: Listing[]): string => {
  if (listings.length === 0) {
    return DEFAULT_CURRENCY;
  }
  const curs = listings
    .map((l) => l?.fiatPrice?.cur as string | undefined)
    .filter((c): c is string => Boolean(c));
  const unique = [...new Set(curs)];
  if (unique.length === 1) {
    return unique[0];
  }
  return listings[0]?.fiatPrice?.cur ?? DEFAULT_CURRENCY;
};

/** Config stores the discounts as strings ("0.30"), so they are coerced here. */
function calculateDurationDiscount(duration: number, settings: any): number {
  const discount =
    duration >= 28
      ? settings?.discountsMonthly
      : duration >= 7
      ? settings?.discountsWeekly
      : settings?.discountsDaily;
  return Math.min(Math.max(toFiniteNumber(discount), 0), 1);
}

/**
 * What a guest would pay to sleep over for the whole event, as a range across
 * the listings open to event guests. An estimate for the event page only — the
 * booking itself is priced server side.
 *
 * The duration discount applies to both ends of the range, so the two numbers
 * describe the same stay. Callers must not discount the result again.
 */
export const getAccommodationPriceRange = (
  settings: any,
  listings: Listing[] | null | undefined,
  duration: number,
  start: any,
): { min: number; max: number; currency: string } => {
  const nights = Math.max(toFiniteNumber(duration), 0);
  const durationDiscount = calculateDurationDiscount(nights, settings);

  const listingsAvailableForEvents = (listings || []).filter(
    (listing: Listing) =>
      listing?.availableFor?.includes('events') ||
      listing?.availableFor?.includes('all') ||
      !listing?.availableFor,
  );
  const minMaxValues = getMinMaxFiatPrice(listingsAvailableForEvents);
  const currency = getAccommodationListingCurrency(listingsAvailableForEvents);
  const seasons = {
    high: {
      start: settings?.seasonsHighStart,
      end: settings?.seasonsHighEnd,
      modifier: settings?.seasonsHighModifier,
    },
  };

  // A high season modifier of 0 — which is what the live booking config carries
  // — is a gap in the config, not a free stay, and used to render the whole
  // range as "0,00 € - 0,00 €". Anything that is not a positive number leaves
  // the listing price alone.
  const highSeasonModifier = toFiniteNumber(settings?.seasonsHighModifier);
  const seasonModifier =
    isHighSeason(seasons, start) && highSeasonModifier > 0
      ? highSeasonModifier
      : 1;

  const rate = seasonModifier * nights * (1 - durationDiscount);

  return {
    min: minMaxValues.min * rate,
    max: minMaxValues.max * rate,
    currency,
  };
};
