export type BookingCoGuestAccessFields = {
  createdBy?: string | null;
  paidBy?: string | null;
  visibleBy?: unknown;
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

export const getBookingVisibleByIds = (visibleBy: unknown): string[] =>
  toIdList(visibleBy);

export const normalizeBookingVisibleBy = (
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
  normalizeBookingVisibleBy(
    getBookingVisibleByIds(booking.visibleBy),
    booking.createdBy,
  );

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
  return getBookingVisibleByIds(booking.visibleBy).includes(userId);
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

export const buildMyBookingsAccessOr = (user: {
  _id: string;
  email?: string;
}): Record<string, unknown>[] => {
  const clauses: Record<string, unknown>[] = [
    { createdBy: user._id },
    { visibleBy: { $in: [user._id] } },
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
