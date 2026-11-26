import type {
  TicketAvailability,
  TicketCancelResult,
  TicketConfirmResult,
  TicketInitRequest,
  TicketInitResult,
  TicketQuote,
  TicketQuoteRequest,
} from '../types/ticket';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const ticketsOn = () => isTrpcEnabled('12.1a');

type ApiOk<T> = { results: T };

/**
 * `GET /tickets/event/:id/availability` — public, so the event page can call it
 * before anyone signs in. Accepts an event id or a slug.
 */
export const getEventTicketAvailability = async (
  eventIdOrSlug: string,
): Promise<TicketAvailability> => {
  if (ticketsOn()) {
    const result = await trpc.ticket.availability
      .query({ id: eventIdOrSlug })
      .catch(throwApiError);
    return result as unknown as TicketAvailability;
  }
  const { data } = await api.get(
    `/tickets/event/${eventIdOrSlug}/availability`,
  );
  return (data as ApiOk<TicketAvailability>).results;
};

/**
 * Prices a purchase without creating anything. The client never computes money
 * itself — whatever this returns is the total the guest is shown.
 */
export const quoteTicket = async (
  payload: TicketQuoteRequest,
): Promise<TicketQuote> => {
  if (ticketsOn()) {
    const result = await trpc.ticket.quote.mutate(payload).catch(throwApiError);
    return result as unknown as TicketQuote;
  }
  const { data } = await api.post('/tickets/quote', payload);
  return (data as ApiOk<TicketQuote>).results;
};

/**
 * Creates the ticket and starts payment. The seat is held from here, not from
 * the confirm — so a guest who backs out must be cancelled, see cancelTicket.
 */
export const initTicket = async (
  payload: TicketInitRequest,
): Promise<TicketInitResult> => {
  if (ticketsOn()) {
    const result = await trpc.ticket.init.mutate(payload).catch(throwApiError);
    return result as unknown as TicketInitResult;
  }
  const { data } = await api.post('/tickets/init', payload);
  return (data as ApiOk<TicketInitResult>).results;
};

/** Idempotent: an already-settled ticket answers `alreadyPaid` instead of erroring. */
export const confirmTicketCard = async (
  ticketId: string,
  paymentIntentId: string,
): Promise<TicketConfirmResult> => {
  if (ticketsOn()) {
    return trpc.ticket.confirmCard
      .mutate({ id: ticketId, paymentIntentId })
      .catch(throwApiError);
  }
  const { data } = await api.post(`/tickets/${ticketId}/confirm-card`, {
    paymentIntentId,
  });
  return (data as ApiOk<TicketConfirmResult>).results;
};

export const confirmTicketCrypto = async (
  ticketId: string,
  txHash: string,
): Promise<TicketConfirmResult> => {
  if (isTrpcEnabled('12.8a')) {
    return trpc.ticket.confirmCrypto
      .mutate({ id: ticketId, txHash })
      .catch(throwApiError);
  }
  const { data } = await api.post(`/tickets/${ticketId}/confirm-crypto`, {
    txHash,
  });
  return (data as ApiOk<TicketConfirmResult>).results;
};

/**
 * Releases the seat. A ticket that came with a stay refuses this — the stay
 * owns the money and has to be cancelled instead.
 */
export const cancelTicket = async (
  ticketId: string,
  reason?: string,
): Promise<TicketCancelResult> => {
  if (ticketsOn()) {
    const result = await trpc.ticket.cancel
      .mutate({ id: ticketId, ...(reason && { reason }) })
      .catch(throwApiError);
    return result as unknown as TicketCancelResult;
  }
  const { data } = await api.post(
    `/tickets/${ticketId}/cancel`,
    reason ? { reason } : {},
  );
  return (data as ApiOk<TicketCancelResult>).results;
};

/**
 * Abandoning a checkout leaves the seat held, so the modal gives it back on the
 * way out. Nothing the guest sees depends on this landing, and the ticket may
 * already be paid by the time they close the window, so failures stay silent.
 */
export const releaseTicketSeat = (ticketId: string): void => {
  void cancelTicket(ticketId, 'checkout abandoned').catch(() => undefined);
};
