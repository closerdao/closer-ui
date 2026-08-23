/**
 * Shape of `GET /events/:id/report` — the merged revenue/attendance view of a
 * single event. The endpoint de-duplicates bookings against the ticket rows
 * they write back, so these numbers cannot be reconstructed by counting both
 * collections client-side.
 */

export interface EventReportEvent {
  _id: string;
  name: string;
  slug: string;
  start: string;
  end: string;
  capacity: number;
}

/** The merged headline numbers — bookings and standalone tickets combined. */
export interface EventReportTotals {
  /** Counted bookings + counted standalone tickets. A booking is one ticket. */
  ticketsSold: number;
  /** Heads: booking adults + ticket quantities. Not the same as ticketsSold. */
  attendees: number;
  eventRevenue: number;
  stayRevenue: number;
  totalRevenue: number;
}

export interface EventReportBookings {
  count: number;
  attendees: number;
  eventRevenue: number;
  stayRevenue: number;
  rentalRevenue: number;
  utilityRevenue: number;
  foodRevenue: number;
  totalRevenue: number;
  /** Non-fiat rails, reported alongside the money and never folded into it. */
  tokensStaked: number;
  creditsPaid: number;
  /** Every booking for the event, including the ones contributing nothing. */
  byStatus: Record<string, number>;
  /** How many bookings were skipped because of their status. */
  notCounted: number;
}

export interface EventReportTickets {
  count: number;
  attendees: number;
  revenue: number;
  byStatus: Record<string, number>;
  /** Counted standalone tickets by rail — card, crypto, free, manual. */
  byPaymentMethod?: Record<string, number>;
  /** Ticket rows dropped as duplicates of a booking of this event. */
  linkedToBookings: number;
  /** Seats sitting in an unfinished checkout. No money yet, seat not free. */
  held?: { count: number; attendees: number };
  /** `count` includes cancellations with no refund due; `refundVal` is money. */
  refunded?: { count: number; refundVal: number };
}

/** How full the event is, counting seats held by checkouts in flight. */
export interface EventReportAttendance {
  /** `event.capacity`, or 0 when none is configured. */
  capacity: number;
  /** Seats paid for. The same number as `totals.attendees`. */
  confirmed: number;
  /** Seats held by `pending` / `pending-payment` tickets. */
  held: number;
  /** `null` when the event has no capacity — unlimited. */
  remaining: number | null;
}

/** One slice of the counted seats. `revenue` sums to `totals.eventRevenue`. */
export interface EventReportSlice {
  name: string;
  count: number;
  attendees: number;
  revenue: number;
}

export interface EventReport {
  event: EventReportEvent;
  currency: string;
  /** True when the sums added figures from more than one currency. */
  mixedCurrencies: boolean;
  currencies: string[];
  totals: EventReportTotals;
  bookings: EventReportBookings;
  tickets: EventReportTickets;
  attendance?: EventReportAttendance;
  /** Every counted seat by ticket option. An event with none names it `general`. */
  byOption?: EventReportSlice[];
  /** Every counted seat by rail; a seat a stay paid for is named `booking`. */
  byPaymentMethod?: EventReportSlice[];
}
