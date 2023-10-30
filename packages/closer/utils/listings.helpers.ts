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

export const formatDate = (date: Date | string | null) => {
  if (!date) return null;
  const dateObj = new Date(date as string | Date);
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
  const day = dateObj.getDate().toString().padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

export const getBlockedDateRanges = (
  start: string | Date | null,
  end: string | Date | null,
  maxHorizon: number,
  maxDuration: number,
  unavailableDates?: string[],
) => {
  const dateRanges: any[] = [];
  dateRanges.push({ before: new Date() });
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

export const getUnavailableDates = (
  availability: any[],
  listingId: string | null,
) => {
  if (!listingId) {
    return [];
  }

  const unavailableDates = availability
    ?.map((date) => {
      const isListingAvailable =
        date?.listings?.includes(listingId) && date.available;
      return isListingAvailable ? null : new Date(date.day);
    })
    .filter((el) => el !== null);
  return unavailableDates;
};
