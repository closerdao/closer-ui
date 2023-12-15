import { BookingSettings, Listing } from '../types';

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
  let min = listings[0].fiatPrice.val;
  let max = listings[0].fiatPrice.val;
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

export const getAccommodationPriceRange = (
  settings: BookingSettings,
  listings: Listing[],
  duration: number,
  start: any,
) => {
  const listingsAvailableForEvents = listings.filter(
    (listing: Listing) =>
      listing?.availableFor?.includes('events') ||
      listing?.availableFor?.includes('all') ||
      !listing?.availableFor,
  );
  const minMaxValues = getMinMaxFiatPrice(listingsAvailableForEvents);

  return isHighSeason(settings?.seasons, start)
    ? {
        min: minMaxValues.min * settings.seasons.high.modifier * duration,
        max: minMaxValues.max * settings.seasons.high.modifier * duration,
      }
    : { min: minMaxValues.min * duration, max: minMaxValues.max * duration };
};
