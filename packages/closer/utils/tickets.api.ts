import type {
  Ticket,
  TicketAvailability,
  TicketCancelResult,
  TicketConfirmResult,
  TicketInitRequest,
  TicketInitResult,
  TicketQuote,
  TicketQuoteRequest,
  TicketStatus,
  TicketWithEvent,
} from '../types/ticket';
import api from './api';

type ApiOk<T> = { results: T };

/**
 * `GET /tickets/event/:id/availability` — public, so the event page can call it
 * before anyone signs in. Accepts an event id or a slug.
 */
export const getEventTicketAvailability = async (
  eventIdOrSlug: string,
): Promise<TicketAvailability> => {
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
  const { data } = await api.post('/tickets/init', payload);
  return (data as ApiOk<TicketInitResult>).results;
};

/** Idempotent: an already-settled ticket answers `alreadyPaid` instead of erroring. */
export const confirmTicketCard = async (
  ticketId: string,
  paymentIntentId: string,
): Promise<TicketConfirmResult> => {
  const { data } = await api.post(`/tickets/${ticketId}/confirm-card`, {
    paymentIntentId,
  });
  return (data as ApiOk<TicketConfirmResult>).results;
};

export const confirmTicketCrypto = async (
  ticketId: string,
  txHash: string,
): Promise<TicketConfirmResult> => {
  const { data } = await api.post(`/tickets/${ticketId}/confirm-crypto`, {
    txHash,
  });
  return (data as ApiOk<TicketConfirmResult>).results;
};

export const getMyTickets = async (params?: {
  event?: string;
  status?: TicketStatus;
  limit?: number;
}): Promise<Ticket[]> => {
  const { data } = await api.get('/tickets/mine', { params });
  return (data as ApiOk<Ticket[]>).results || [];
};

export const getTicket = async (ticketId: string): Promise<TicketWithEvent> => {
  const { data } = await api.get(`/tickets/${ticketId}`);
  return (data as ApiOk<TicketWithEvent>).results;
};

/**
 * Releases the seat. A ticket that came with a stay refuses this — the stay
 * owns the money and has to be cancelled instead.
 */
export const cancelTicket = async (
  ticketId: string,
  reason?: string,
): Promise<TicketCancelResult> => {
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
