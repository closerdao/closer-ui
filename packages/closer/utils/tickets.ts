import { useState } from 'react';

import { List, fromJS } from 'immutable';

import type { Ticket, TicketStatus, TicketWithEvent } from '../types/ticket';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc, trpcFor } from './trpc';

type Platform = Record<string, any>;

// The store filters the event pages send: one event's tickets, optionally by status.
export type TicketFilter = {
  where: { event?: string; status?: string | { $in: string[] } };
  limit?: number;
  page?: number;
};

const toEventInput = ({ where }: TicketFilter) => {
  const { event = '', status } = where;
  if (status === undefined) return { event };
  return {
    event,
    statuses: typeof status === 'string' ? [status] : status.$in,
  };
};

const clientFor = (token: string | undefined) =>
  token ? trpcFor(token) : trpc;

// The store's ticket list and count reads or, with tRPC, the same reads in local state; Immutable either way.
export const useEventTickets = (
  platform: Platform,
  listFilter: TicketFilter,
  countFilter: TicketFilter,
) => {
  const [trpcTickets, setTrpcTickets] = useState<{
    key: string;
    tickets: List<any>;
  }>();
  const [trpcCount, setTrpcCount] = useState<{ key: string; count: number }>();
  const listKey = JSON.stringify(listFilter);
  const countKey = JSON.stringify(countFilter);

  // Both reads resolve on failure, as the store's do; a failure keeps what this filter had.
  const loadTickets = async () => {
    if (!isTrpcEnabled()) {
      await platform.ticket.get(listFilter);
      return;
    }
    const { limit, page } = listFilter;
    const results = await trpc.ticket.list
      .query({
        ...toEventInput(listFilter),
        ...(limit !== undefined && { limit }),
        ...(page !== undefined && { page }),
        sortBy: '-created',
      })
      .catch(() => null);
    if (results) {
      setTrpcTickets({ key: listKey, tickets: fromJS(results) as List<any> });
    }
  };

  // Non-staff get 400 on both APIs for a `status` filter, so the count stays unset for them.
  const loadCount = async () => {
    if (!isTrpcEnabled()) {
      await platform.ticket.getCount(countFilter);
      return;
    }
    const count = await trpc.ticket.count
      .query(toEventInput(countFilter))
      .catch(() => null);
    if (count !== null) setTrpcCount({ key: countKey, count });
  };

  if (!isTrpcEnabled()) {
    return {
      tickets: platform.ticket.find(listFilter) as List<any> | undefined,
      count: platform.ticket.findCount(countFilter) as number | undefined,
      loadTickets,
      loadCount,
    };
  }
  return {
    tickets: trpcTickets?.key === listKey ? trpcTickets.tickets : undefined,
    count: trpcCount?.key === countKey ? trpcCount.count : undefined,
    loadTickets,
    loadCount,
  };
};

// Legacy `GET /tickets/mine`: the caller's own tickets, newest first.
export const getMyTickets = async (params?: {
  event?: string;
  status?: TicketStatus;
  limit?: number;
}): Promise<Ticket[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/tickets/mine', { params });
    return data.results || [];
  }
  const results = await trpc.ticket.mine.query(params).catch(throwApiError);
  return results as Ticket[];
};

// Legacy `GET /tickets/:id` for the ticket modal; tRPC has no `refundQuote`, which the modal never reads.
export const getTicket = async (ticketId: string): Promise<TicketWithEvent> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get(`/tickets/${ticketId}`);
    return data.results;
  }
  const result = await trpc.ticket.get
    .query({ id: ticketId })
    .catch(throwApiError);
  return result as unknown as TicketWithEvent;
};

// The ticket page's `GET /tickets/:id` as the viewer; on tRPC its `refundQuote` still comes from that legacy read.
export const fetchTicketWithRefundQuote = async (
  ticketId: string,
  token: string | undefined,
): Promise<Partial<TicketWithEvent>> => {
  const readLegacy = () =>
    api.get(`/tickets/${ticketId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  if (!isTrpcEnabled()) {
    const { data } = await readLegacy();
    return data?.results || {};
  }
  const [read, refundQuote] = await Promise.all([
    clientFor(token).ticket.get.query({ id: ticketId }).catch(throwApiError),
    readLegacy().then(
      ({ data }) => data?.results?.refundQuote,
      () => undefined,
    ),
  ]);
  return {
    ...(read as unknown as TicketWithEvent),
    ...(refundQuote !== undefined && { refundQuote }),
  };
};

// The invoice's `GET /ticket/:id`, which legacy served to anyone; tRPC serves the holder and staff only.
export const fetchInvoiceTicket = async (
  ticketId: string,
  token: string | undefined,
): Promise<Ticket> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get(`/ticket/${ticketId}`);
    return data.results;
  }
  const { ticket } = await clientFor(token)
    .ticket.get.query({ id: ticketId })
    .catch(throwApiError);
  return ticket as Ticket;
};

// The profile's `GET /ticket` of a member's event tickets; legacy answers 400 to all but staff.
export const fetchTicketsByCreator = async (
  userId: string,
  statuses: string[],
  limit: number,
): Promise<Ticket[] | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/ticket', {
      params: {
        where: {
          createdBy: userId,
          event: { $exists: true },
          status: { $in: statuses },
        },
        limit,
      },
    });
    return res?.data?.results;
  }
  const results = await trpc.ticket.byCreator
    .query({ userId, statuses, limit })
    .catch(throwApiError);
  return results as Ticket[];
};
