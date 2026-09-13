export const checkListingAvailability = (
  listingId: string | undefined,
  availability: { day: string; listings: string[]; available: boolean }[],
) => {
  if (!listingId) {
    return false;
  }
  const isListingAvailable =
    availability.every((day) => day?.listings?.includes(listingId)) &&
    availability.every((day) => day?.available);

  return isListingAvailable;
};

/** One entry of the availability calendar, as the endpoint returns a night. */
type AvailabilityDay = {
  day?: string;
  listings?: string[];
  available?: boolean;
};

/**
 * How many nights of the window a listing is spoken for.
 *
 * `checkListingAvailability` answers whether a listing is free for the whole
 * range, which is all a short stay needs. A months-long stay needs the size of
 * the clash too — "taken 3 of 92 nights" is a date to move, where "not
 * available" is a dead end.
 *
 * A night counts against the listing when the calendar closed it outright or
 * when the listing is simply not among the ones open that night. Entries that
 * do not name a day are ignored: an hourly calendar answers a different
 * question, and counting its slots as nights would invent a number.
 */
export const countUnavailableNights = (
  listingId: string | undefined,
  availability: AvailabilityDay[] | null | undefined,
): { unavailableNights: number; checkedNights: number } => {
  const nights = (availability || []).filter(
    (entry) => entry && typeof entry === 'object' && entry.day,
  );
  if (!listingId) {
    return { unavailableNights: nights.length, checkedNights: nights.length };
  }

  const unavailableNights = nights.filter(
    (night) => !night.available || !night.listings?.includes(listingId),
  ).length;

  return { unavailableNights, checkedNights: nights.length };
};

export const formatDate = (date: Date | string | null) => {
  if (!date) return null;
  const dateObj = new Date(date as string | Date);
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
  const day = dateObj.getDate().toString().padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

export const getBlockedDateRanges = ({
  start,
  end,
  maxHorizon,
  maxDuration,
  unavailableDates,
  isHourlyBooking,
}: {
  start: string | Date | null;
  end: string | Date | null;
  maxHorizon: number;
  maxDuration: number;
  unavailableDates?: string[];
  isHourlyBooking?: boolean;
}) => {
  const dateRanges: any[] = [];

  if (isHourlyBooking) {
    dateRanges.push({ before: new Date() });
    dateRanges.push({
      after: new Date().setDate(new Date().getDate()  + maxHorizon ),
    });
    return dateRanges;
  }
  
  dateRanges.push({
    after: new Date().setDate(new Date().getDate() + maxHorizon),
  });
  if (start) {
    dateRanges.push({
      after: new Date(
        new Date(start as string).getTime() + maxDuration * 24 * 60 * 60 * 1000,
      ),
    });
    dateRanges.push({
      before: new Date(
        new Date(end as string).getTime() - maxDuration * 24 * 60 * 60 * 1000,
      ),
    });
    dateRanges.push({
      before: new Date(
        new Date(start as string).getTime() - maxDuration * 24 * 60 * 60 * 1000,
      ),
    });
  }
  if (end) {
    dateRanges.push({
      before: new Date(
        new Date(start as string).getTime() - maxDuration * 24 * 60 * 60 * 1000,
      ),
    });
  }

  if (unavailableDates) {
    dateRanges.push(...unavailableDates);
  }

  return dateRanges;
};
