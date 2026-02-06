import { Listing } from '../types';

export function transformEventFoodBeforeSave<T extends { foodOptionId?: string | null }>(
  data: T,
): T & { foodOption: string; foodOptionId: string | null } {
  const raw = data.foodOptionId;
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
) => {
  const durationDiscount = calculateDurationDiscount(duration, settings);

  const listingsAvailableForEvents = listings.filter(
    (listing: Listing) =>
      listing?.availableFor?.includes('events') ||
      listing?.availableFor?.includes('all') ||
      !listing?.availableFor,
  );
  const minMaxValues = getMinMaxFiatPrice(listingsAvailableForEvents);
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
      }
    : {
        min: minMaxValues.min * duration,
        max: minMaxValues.max * duration * (1 - durationDiscount),
      };
};
