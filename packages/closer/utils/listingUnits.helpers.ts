export type ListingUnitsCountTranslationKey =
  | 'listing_units_count_private'
  | 'listing_units_count_shared';

export const listingUnitsCountTranslationKey = (
  isPrivate: boolean,
): ListingUnitsCountTranslationKey =>
  isPrivate ? 'listing_units_count_private' : 'listing_units_count_shared';

export const bookingGuestCount = (
  adults?: number | null,
  children?: number | null,
): number => (Number(adults) || 0) + (Number(children) || 0);

export const shouldShowBookingUnitsNote = (
  numberOfUnits?: number | null,
): boolean =>
  numberOfUnits != null && Number.isFinite(numberOfUnits) && numberOfUnits > 1;
