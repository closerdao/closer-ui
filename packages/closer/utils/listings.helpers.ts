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

export const formatDate = (date: Date | string | null) =>
  new Date(date as string | Date).toString().slice(0, 10);
