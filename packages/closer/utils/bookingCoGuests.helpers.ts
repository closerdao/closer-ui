export type BookingCoGuestAccessFields = {
  createdBy?: string | null;
  paidBy?: string | null;
  guests?: unknown;
};

const toIdList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toJS' in value &&
    typeof (value as { toJS: unknown }).toJS === 'function'
  ) {
    const js = (value as { toJS: () => unknown }).toJS();
    if (Array.isArray(js)) {
      return js.map(String).filter(Boolean);
    }
  }
  return [];
};

export const getBookingGuestIds = (guests: unknown): string[] =>
  toIdList(guests);

export const normalizeBookingGuests = (
  ids: string[],
  createdBy?: string | null,
): string[] => {
  const unique = new Set(ids.filter(Boolean));
  if (createdBy) {
    unique.delete(createdBy);
  }
  return Array.from(unique);
};

export const getBookingCoGuestIds = (
  booking: BookingCoGuestAccessFields,
): string[] =>
  normalizeBookingGuests(getBookingGuestIds(booking.guests), booking.createdBy);

export const isBookingOwner = (
  booking: BookingCoGuestAccessFields,
  userId?: string | null,
): boolean => {
  if (!userId) return false;
  return booking.createdBy === userId || booking.paidBy === userId;
};

export const isBookingCoGuest = (
  booking: BookingCoGuestAccessFields,
  userId?: string | null,
): boolean => {
  if (!userId || isBookingOwner(booking, userId)) {
    return false;
  }
  return getBookingGuestIds(booking.guests).includes(userId);
};

export const canViewBookingAsGuest = (
  booking: BookingCoGuestAccessFields,
  userId?: string | null,
): boolean => isBookingOwner(booking, userId) || isBookingCoGuest(booking, userId);

export const canEditBookingCoGuests = (
  booking: BookingCoGuestAccessFields,
  userId?: string | null,
  canManageBooking = false,
): boolean => canManageBooking || isBookingOwner(booking, userId);

export const getMaxBookingCoGuests = (adults?: number | null): number =>
  Math.max(0, (adults ?? 1) - 1);

/**
 * The `guests` half of a POST /stays body. Co-guests are only settable at
 * creation — a draft stay rejects edits — so an omission here cannot be
 * repaired later without the addStayGuest round trip.
 */
export const buildCreateStayGuestsPayload = (
  coGuests: { _id: string }[] | null | undefined,
): { guests?: string[] } => {
  const ids = normalizeBookingGuests(
    (coGuests ?? []).map((guest) => guest._id).filter(Boolean),
  );
  return ids.length > 0 ? { guests: ids } : {};
};

export const appendBookingCoGuest = (
  guests: string[],
  userId: string,
  createdBy?: string | null,
  adults?: number | null,
): string[] | null => {
  if (!userId || userId === createdBy) {
    return null;
  }
  const current = normalizeBookingGuests(guests, createdBy);
  if (current.includes(userId)) {
    return null;
  }
  if (current.length >= getMaxBookingCoGuests(adults)) {
    return null;
  }
  return [...current, userId];
};

export const buildMyBookingsAccessOr = (user: {
  _id: string;
  email?: string;
}): Record<string, unknown>[] => {
  const clauses: Record<string, unknown>[] = [
    { createdBy: user._id },
    { guests: { $in: [user._id] } },
  ];

  if (user.email) {
    clauses.push({
      $and: [
        { isFriendsBooking: { $eq: true } },
        { friendEmails: { $exists: true } },
        { friendEmails: { $ne: [] } },
        { friendEmails: { $in: [user.email] } },
      ],
    });
  }

  return clauses;
};
