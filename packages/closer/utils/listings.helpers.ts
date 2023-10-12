import dayjs from 'dayjs';

export const checkListingAvaialbility = (
  listingId: string | undefined,
  availability: { day: string; listings: string[]; available: boolean }[],
) => {
  if (!listingId) {
    return false;
  }
  const isListingAvailable =
    availability.every((day) => day.listings.includes(listingId)) &&
    availability.every((day) => day.available);

  return isListingAvailable;
};

export const formatStartDate = (date: Date | string | null) =>
  dayjs(date, 'YYYY-MM-DD')
    .set('hours', 16)
    .set('seconds', 0)
    .set('minutes', 0);

export const formatEndDate = (date: Date | string | null) =>
  dayjs(date, 'YYYY-MM-DD')
    .set('hours', 16)
    .set('seconds', 0)
    .set('minutes', 0);
