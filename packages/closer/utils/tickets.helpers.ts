import type { Ticket, TicketMoney } from '../types/ticket';

/** How long a cancelled ticket stays on the guest's list before it is hidden. */
export const CANCELLED_TICKET_GRACE_MS = 3 * 60 * 60 * 1000;

/**
 * The moment a ticket was cancelled. The cancel route stamps `cancellation.at`;
 * a ticket cancelled by its stay is only saved, so `updated` (then `created`)
 * stands in for it.
 */
export const getTicketCancelledAt = (
  ticket: Pick<Ticket, 'status' | 'cancellation' | 'updated' | 'created'>,
): Date | null => {
  if (ticket?.status !== 'cancelled') return null;
  const stamp = ticket.cancellation?.at || ticket.updated || ticket.created;
  if (!stamp) return null;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * A ticket cancelled more than three hours ago is noise on "my tickets" — an
 * abandoned checkout or a lapsed hold the guest never meant to keep. A fresh
 * cancellation stays visible so the guest can see it went through. A cancelled
 * ticket with no usable timestamp is kept rather than silently dropped.
 */
export const isStaleCancelledTicket = (
  ticket: Pick<Ticket, 'status' | 'cancellation' | 'updated' | 'created'>,
  now: Date = new Date(),
): boolean => {
  const cancelledAt = getTicketCancelledAt(ticket);
  if (!cancelledAt) return false;
  return now.getTime() - cancelledAt.getTime() > CANCELLED_TICKET_GRACE_MS;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface TicketPriceBreakdown {
  quantity: number;
  currency: string;
  /** One seat before any discount — the ticket option's own price. */
  listUnitPrice: number;
  /** One seat as actually charged. */
  unitPrice: number;
  /** What the whole purchase would have cost at list price. */
  listTotal: number;
  /** What was actually paid. */
  total: number;
  /** listTotal - total, when a discount actually took money off. */
  savings: number;
  hasDiscount: boolean;
  discountCode: string | null;
}

/**
 * What a ticket cost, and what it would have cost without the discount.
 *
 * The list price has to be reconstructed from the ticket option rather than
 * read off the ticket: the ticket stores what was charged, so a discounted
 * purchase otherwise shows one number with nothing to compare it against and
 * reads as if the discount never applied.
 */
export const getTicketPriceBreakdown = (
  ticket: Pick<
    Ticket,
    'quantity' | 'price' | 'unitPrice' | 'option' | 'discount'
  > & {
    option?: { name?: string; price?: number; currency?: string } | null;
  },
): TicketPriceBreakdown => {
  const quantity = Math.max(toNumber(ticket?.quantity) || 1, 1);
  const price = (ticket?.price || {}) as TicketMoney;
  const unit = (ticket?.unitPrice || {}) as TicketMoney;

  const total = toNumber(price.val);
  const unitPrice =
    unit.val === undefined ? total / quantity : toNumber(unit.val);
  const listUnitPrice = ticket?.option?.price
    ? toNumber(ticket.option.price)
    : unitPrice;
  const listTotal = listUnitPrice * quantity;

  // Rounding on either side can leave a cent of noise; a discount worth
  // showing is worth at least that much.
  const savings = listTotal - total > 0.005 ? listTotal - total : 0;

  return {
    quantity,
    currency: String(price.cur || unit.cur || ticket?.option?.currency || ''),
    listUnitPrice,
    unitPrice,
    listTotal,
    total,
    savings,
    hasDiscount: savings > 0,
    discountCode: ticket?.discount?.code || null,
  };
};

export interface StayEventTicketDiscount {
  /** The ticket option's own price — what the line would read without a code. */
  gross: { val: number; cur: string };
  /** What the price lock actually charges for the ticket. */
  net: { val: number; cur: string };
  savings: { val: number; cur: string };
  code: string | null;
}

/**
 * What a stay's event ticket would have cost without the discount code.
 *
 * The price lock only carries the charged amount, so a discounted ticket
 * otherwise shows a single number with nothing to compare it against and reads
 * as if the code never applied. The list price has to be reconstructed from
 * the ticket option the guest picked.
 */
export const getStayEventTicketDiscount = ({
  eventLine,
  ticketName,
  ticketOptions,
  discountCode,
}: {
  eventLine?: { val: number; cur: string } | null;
  ticketName?: string | null;
  ticketOptions?: { name: string; price?: number; currency?: string }[] | null;
  discountCode?: string | null;
}): StayEventTicketDiscount | null => {
  if (!eventLine || !(eventLine.val > 0)) return null;
  if (!ticketName) return null;
  const option = (ticketOptions || []).find((item) => item.name === ticketName);
  if (!option) return null;
  const listPrice = Number(option.price);
  if (!Number.isFinite(listPrice)) return null;
  // Comparing across currencies would invent a discount out of an exchange
  // rate, so only a like-for-like pair is worth showing.
  if (
    option.currency &&
    eventLine.cur &&
    String(option.currency).toUpperCase() !==
      String(eventLine.cur).toUpperCase()
  ) {
    return null;
  }
  const savings = listPrice - eventLine.val;
  // Rounding on either side can leave a cent of noise; a discount worth
  // showing is worth at least that much.
  if (savings <= 0.005) return null;

  return {
    gross: { val: listPrice, cur: eventLine.cur },
    net: eventLine,
    savings: { val: savings, cur: eventLine.cur },
    code: discountCode || null,
  };
};
