import type { BookingCoGuestUser } from '../components/BookingCoGuests/BookingCoGuests';

const STORAGE_KEY = 'stay-create-co-guests';

/**
 * Co-guests picked on /stay/create before the booking exists. An unauthenticated
 * guest is bounced to /signup and back, and the ids are not carried in the URL —
 * without this the list returns empty and POST /stays goes out without `guests`,
 * which a draft stay will not accept afterwards.
 *
 * Session-scoped: the picks belong to the tab the booking is being made in.
 */
export const readStayCoGuestsDraft = (): BookingCoGuestUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (guest): guest is BookingCoGuestUser =>
          Boolean(guest) &&
          typeof guest === 'object' &&
          typeof guest._id === 'string' &&
          guest._id !== '',
      )
      .map((guest) => ({
        _id: guest._id,
        screenname:
          typeof guest.screenname === 'string' ? guest.screenname : guest._id,
        photo: typeof guest.photo === 'string' ? guest.photo : undefined,
      }));
  } catch {
    return [];
  }
};

export const writeStayCoGuestsDraft = (guests: BookingCoGuestUser[]): void => {
  if (typeof window === 'undefined') return;
  try {
    if (guests.length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
  } catch {
    // A full or blocked sessionStorage only costs the list across a redirect.
  }
};

export const clearStayCoGuestsDraft = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the next write overwrites it anyway.
  }
};
