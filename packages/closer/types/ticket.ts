/**
 * Shapes of the `/tickets/*` API — the endpoints that sell event tickets on
 * their own, without a stay. A ticket that comes with a stay is written by the
 * `/stays/*` flow instead and is never created or cancelled through here.
 */
import { CloserCurrencies } from './currency';

export type TicketStatus =
  | 'pending'
  | 'pending-payment'
  | 'approved'
  | 'cancelled'
  | 'refunded';

export type TicketPaymentMethod =
  | 'card'
  | 'crypto'
  | 'booking'
  | 'free'
  | 'manual';

export interface TicketMoney {
  val: number;
  cur: CloserCurrencies | string;
}

/** One row of `ticketOptions` as the availability endpoint returns it. */
export interface TicketAvailabilityOption {
  name: string;
  price: number;
  currency: CloserCurrencies | string;
  limit?: number | null;
  sold?: number;
  /** `null` means unlimited — the option carries no limit. */
  available: number | null;
  isDayTicket?: boolean;
  disclaimer?: string;
}

export interface TicketCancellationPolicy {
  bucket?: string;
  fractionToRefund?: number;
  source?: 'event' | 'settings' | 'none';
  disclaimer?: string;
}

export interface TicketAvailability {
  eventId: string;
  capacity: number | null;
  sold: number;
  /** `null` means unlimited — the event has no capacity set. */
  available: number | null;
  ticketOptions: TicketAvailabilityOption[];
  cancellationPolicy?: TicketCancellationPolicy;
}

export interface TicketQuoteRequest {
  eventId: string;
  ticketOption?: string;
  quantity?: number;
  discountCode?: string;
  volunteer?: boolean;
}

export interface TicketQuote {
  eventId: string;
  quantity: number;
  currency: CloserCurrencies | string;
  listUnitPrice: TicketMoney;
  unitPrice: TicketMoney;
  total: TicketMoney;
  option?: { name: string; price: number; currency: string } | null;
  discount?: { code: string; percent?: number; val?: number } | null;
  discountApplied: boolean;
  /** A code was supplied but did not apply. Not an error — say so and move on. */
  discountRejected: boolean;
  volunteerDiscount?: number;
  availability?: {
    available: number | null;
    sold: number;
    capacity: number | null;
  };
  cancellationPolicy?: TicketCancellationPolicy;
}

export interface TicketInitRequest extends TicketQuoteRequest {
  /** Required unless the ticket is free. */
  paymentMethod?: 'card' | 'crypto';
  fields?: { name: string; value: string }[];
  message?: string;
  name?: string;
  email?: string;
}

export interface TicketInitResult {
  ticketId: string;
  status: TicketStatus;
  paymentMethod: TicketPaymentMethod;
  total: TicketMoney;
  /** Card only. */
  clientSecret?: string;
  paymentIntentId?: string;
  /** Crypto only. */
  treasuryAddress?: string;
  stablecoin?: string;
  stablecoinAddresses?: string[];
  expectedAmount?: number;
  chainId?: number;
  network?: string;
}

export interface TicketConfirmResult {
  status: string;
  ticketId: string;
  alreadyPaid: boolean;
}

export interface Ticket {
  _id: string;
  status: TicketStatus;
  paymentMethod: TicketPaymentMethod;
  event: string;
  booking?: string | null;
  quantity: number;
  price?: TicketMoney;
  unitPrice?: TicketMoney;
  option?: { name?: string } | null;
  discount?: { code?: string } | null;
  fields?: { name: string; value: string }[];
  used?: string | null;
  tx_hash?: string;
  name?: string;
  email?: string;
  created?: string;
}

export interface TicketRefundQuote {
  policy: string;
  policySource: string;
  fractionToRefund: number;
  refundVal: number;
  cur: string;
}

export interface TicketWithEvent {
  ticket: Ticket;
  event: {
    _id: string;
    name: string;
    slug?: string;
    start?: string;
    end?: string;
  };
  /** What cancelling right now would return. `null` when nothing is refundable. */
  refundQuote: TicketRefundQuote | null;
}

export interface TicketCancelResult {
  ticket: Ticket;
  policy?: string;
  fractionToRefund?: number;
  refundVal?: number;
  cur?: string;
  refund?: {
    status: 'succeeded' | 'noop' | 'pending-manual' | 'failed';
    refundedVal?: number;
    paymentIntentId?: string;
  };
}
