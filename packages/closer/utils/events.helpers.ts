import dayjs from 'dayjs';

import { DEFAULT_CURRENCY } from '../constants';
import { Listing } from '../types';

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

export function transformEventFoodBeforeSave<T extends { foodOptionId?: string | null }>(
  data: T,
): T & { foodOption: string; foodOptionId: string | null } {
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
  const foodOptionId = foodOption === 'food_package' ? (raw ?? null) : null;
  return { ...data, foodOption, foodOptionId };
}

export function toPhotoId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : (first as { _id?: string })?._id ?? null;
  }
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const id = (value as { _id: unknown })._id;
    return typeof id === 'string' ? id : (id as any)?.toString?.() ?? null;
  }
  return null;
}

const isHighSeason = (seasons: any, startDate: any) => {
  const date = new Date(startDate);
  const currentMonth = date.toLocaleString('en-US', { month: 'long' }); // Get current month in string format
  const end =
    seasons.high.end.toLowerCase() === 'nov' ? 'november' : seasons.high.end;
  const { start } = seasons.high;
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
    (month) => month.toLowerCase() === start.toLowerCase(),
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
  let min = listings[0]?.fiatPrice.val || 0;
  let max = listings[0]?.fiatPrice.val || 0;

  for (const obj of listings) {
    const val = obj.fiatPrice.val;
    if (val < min) {
      min = val;
    }
    if (val > max) {
      max = val;
    }
  }
  return { min, max };
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

function calculateDurationDiscount(duration: number, settings: any) {
  let discount;
  if (duration >= 28) {
    discount = settings.discountsMonthly;
  } else if (duration >= 7) {
    discount = settings.discountsWeekly;
  } else {
    discount = settings.discountsDaily;
  }
  return discount;
}

export const getAccommodationPriceRange = (
  settings: any,
  listings: Listing[],
  duration: number,
  start: any,
): { min: number; max: number; currency: string } => {
  const durationDiscount = calculateDurationDiscount(duration, settings);

  const listingsAvailableForEvents = listings.filter(
    (listing: Listing) =>
      listing?.availableFor?.includes('events') ||
      listing?.availableFor?.includes('all') ||
      !listing?.availableFor,
  );
  const minMaxValues = getMinMaxFiatPrice(listingsAvailableForEvents);
  const currency = getAccommodationListingCurrency(listingsAvailableForEvents);
  const seasons = {
    high: {
      start: settings.seasonsHighStart,
      end: settings.seasonsHighEnd,
      modifier: settings.seasonsHighModifier,
    },
  };

  return isHighSeason(seasons, start)
    ? {
        min: minMaxValues.min * settings.seasonsHighModifier * duration,
        max: minMaxValues.max * settings.seasonsHighModifier * duration,
        currency,
      }
    : {
        min: minMaxValues.min * duration,
        max: minMaxValues.max * duration * (1 - durationDiscount),
        currency,
      };
};
