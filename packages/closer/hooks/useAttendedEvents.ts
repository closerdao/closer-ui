import { useEffect, useMemo, useState } from 'react';

import api from '../utils/api';

/**
 * Attendance is recorded in three unrelated places, and none of them is
 * authoritative on its own:
 *  - `event.attendees` — only filled when someone RSVPs to a free event, or
 *    pays for a ticket while logged in;
 *  - a paid booking carrying an `eventId` — the usual path for events that are
 *    booked as a stay;
 *  - a ticket sold for the event — the usual path for ticketed events.
 * So we resolve the last two into event ids here and let the caller union them
 * with `attendees`. Tickets are matched by `createdBy` only — never by email,
 * since `where` is serialized into the GET query string.
 */

/** Booking states that mean the guest actually paid for and joined the event. */
const ATTENDED_BOOKING_STATUSES = ['paid', 'checked-in', 'checked-out'];

/**
 * Tickets are stamped `approved` once payment goes through (`pending` until
 * then); `paid` is accepted too so older records are not dropped.
 */
const ATTENDED_TICKET_STATUSES = ['approved', 'paid'];

/** Enough to cover a long-standing member without paging. */
const FETCH_LIMIT = 200;

const toEventIds = (results: any, key: string): string[] =>
  (Array.isArray(results) ? results : [])
    .map((item) => item?.[key])
    .filter((id): id is string => typeof id === 'string' && !!id);

interface AttendedEvents {
  /** Event ids the member attended via a booking or a ticket. */
  eventIds: string[];
  isLoading: boolean;
}

/**
 * Resolves the event ids a member attended through bookings and tickets.
 *
 * Bookings are private, so this only returns booking-derived ids when the
 * viewer may read them (own profile, space host, admin). Ticket-derived ids
 * cover the same events for everyone else, since every paid event booking also
 * creates a ticket.
 */
export function useAttendedEvents(memberId?: string): AttendedEvents {
  const [bookingEventIds, setBookingEventIds] = useState<string[]>([]);
  const [ticketEventIds, setTicketEventIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!memberId) {
      setBookingEventIds([]);
      setTicketEventIds([]);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    Promise.all([
      api
        .get('/booking', {
          params: {
            where: {
              createdBy: memberId,
              eventId: { $exists: true },
              status: { $in: ATTENDED_BOOKING_STATUSES },
            },
            limit: FETCH_LIMIT,
          },
        })
        .catch(() => null),
      api
        .get('/ticket', {
          params: {
            where: {
              createdBy: memberId,
              event: { $exists: true },
              status: { $in: ATTENDED_TICKET_STATUSES },
            },
            limit: FETCH_LIMIT,
          },
        })
        .catch(() => null),
    ])
      .then(([bookingRes, ticketRes]) => {
        if (!isCurrent) return;
        setBookingEventIds(toEventIds(bookingRes?.data?.results, 'eventId'));
        setTicketEventIds(toEventIds(ticketRes?.data?.results, 'event'));
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [memberId]);

  const eventIds = useMemo(
    () => Array.from(new Set([...bookingEventIds, ...ticketEventIds])),
    [bookingEventIds, ticketEventIds],
  );

  return { eventIds, isLoading };
}
