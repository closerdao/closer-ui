import { CloserCurrencies } from './currency';

export type Event = {
  name: string;
  recording: string;
  rep: any[];
  password: string;
  photo: string;
  slug: string;
  description: string;
  participationGuideUrl: string;
  foodOption: string;
  foodOptionId?: string | null;
  ticket: string;
  virtual?: boolean;
  paid: boolean;
  blocksBookingCalendar: boolean;
  canSelectDates?: boolean;
  requireApproval?: boolean;
  location: string;
  address: string;
  attendees: string[];
  speakers: string[];
  ticketOptions: TicketOption[];
  fields: Field[];
  partners: Partner[];
  transportOptions: TransportOption[];
  discounts: Discount[];
  cancellationPolicy?: CancellationPolicy;
  cancellationPolicyDisclaimer?: string;
  capacity: number;
  used: string;
  start: string;
  end: string;
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
  visual?: string;
  featured?: boolean;
};
/**
 * Per-event override of the platform cancellation policy. Buckets hold the
 * fraction of the ticket price refunded — 1 is a full refund, 0 nothing — and
 * any bucket left unset falls back to the booking settings.
 */
export type CancellationPolicy = {
  refundable?: boolean;
  /** More than 30 days before the event starts. */
  default?: number;
  /** 30 to 8 days before. */
  lastmonth?: number;
  /** 7 to 2 days before. */
  lastweek?: number;
  /** Less than 2 days before. */
  lastday?: number;
};

export type TicketOption = {
  name: string;
  icon: unknown | null;
  price: number;
  currency: CloserCurrencies;
  disclaimer: string;
  limit: number;
  _id: string;
  available: number;
  isDayTicket: boolean;
};

export type Field = {
  name: string;
  fieldType: string;
  _id: string;
  options: string[];
};

export type Partner = {
  name: string;
  description: string;
  image: string;
  url: string;
  _id: string;
};

export type TransportOption = {
  name: string;
  description: string;
  price: number;
  _id: string;
};

export type Discount = {
  name: string;
  code: string;
  percent: number | null;
  val: number | null;
  _id: string;
};
