import type { Listing } from '../types/booking';

export type AssignedUnitsTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type UnitListing = Pick<Listing, 'name'> &
  Partial<Pick<Listing, 'private' | 'quantity'>>;

// roomOrBedNumbers is 1-based: a unit number on a private listing, a bed number across all units on a shared one.
export const formatAssignedUnits = (
  listing: UnitListing,
  roomOrBedNumbers: number | number[] | null | undefined,
  t: AssignedUnitsTranslator,
): string => {
  const numbers = (
    Array.isArray(roomOrBedNumbers)
      ? roomOrBedNumbers
      : roomOrBedNumbers != null
        ? [roomOrBedNumbers]
        : []
  ).filter((n) => Number.isInteger(n) && n > 0);
  if (numbers.length === 0) return '';

  if (listing.private) {
    if (listing.quantity === 1) return listing.name;
    return numbers.map((n) => `${listing.name} ${n}`).join(', ');
  }

  return t('booking_assigned_unit_beds', {
    count: numbers.length,
    numbers: numbers.join(', '),
    listing: listing.name,
  });
};
