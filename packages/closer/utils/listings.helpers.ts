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

export const formatDate = (date: Date | string | null) => {
  if (!date) return null;
  const dateObj = new Date(date as string | Date);
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
  const day = dateObj.getDate().toString().padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};
