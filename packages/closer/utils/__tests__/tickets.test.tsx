import { act, renderHook } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import {
  TicketFilter,
  fetchInvoiceTicket,
  fetchTicketWithRefundQuote,
  fetchTicketsByCreator,
  getMyTickets,
  getTicket,
  useEventTickets,
} from '../tickets';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ ticket: { get: { query: mockServerGet } } })),
  trpc: {
    ticket: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      mine: { query: jest.fn() },
      get: { query: jest.fn() },
      byCreator: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const ticket = trpc.ticket as unknown as {
  list: { query: jest.Mock };
  count: { query: jest.Mock };
  mine: { query: jest.Mock };
  get: { query: jest.Mock };
  byCreator: { query: jest.Mock };
};

const paid = { _id: 't1', event: 'e1', status: 'approved' };
const pending = { _id: 't2', event: 'e1', status: 'pending' };
const read = {
  ticket: paid,
  event: { _id: 'e1', name: 'Fest', slug: 'fest' },
};
const refundQuote = { refundVal: 10, cur: 'EUR' };

// The event page's pair and the organiser page's pair, as each page builds them.
const eventPageList: TicketFilter = { where: { event: 'e1' } };
const eventPageCount: TicketFilter = {
  where: { event: 'e1', status: 'approved' },
};
const organiserCount: TicketFilter = {
  where: { event: 'e1', status: { $in: ['paid', 'approved'] } },
};
const organiserPage = (page: number): TicketFilter => ({
  ...organiserCount,
  limit: 20,
  page,
});

const makePlatform = () => ({
  ticket: {
    find: jest.fn(),
    findCount: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    getCount: jest.fn().mockResolvedValue(undefined),
  },
});

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32004,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the /tickets/mine and /tickets/:id calls it replaced', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { results: [paid] } });
    mockedApi.get.mockResolvedValueOnce({ data: {} });
    mockedApi.get.mockResolvedValueOnce({
      data: { results: { ...read, refundQuote } },
    });

    await expect(getMyTickets({ event: 'e1', limit: 20 })).resolves.toEqual([
      paid,
    ]);
    await expect(getMyTickets()).resolves.toEqual([]);
    await expect(getTicket('t1')).resolves.toEqual({ ...read, refundQuote });

    expect(mockedApi.get.mock.calls).toEqual([
      ['/tickets/mine', { params: { event: 'e1', limit: 20 } }],
      ['/tickets/mine', { params: undefined }],
      ['/tickets/t1'],
    ]);
    expect(ticket.mine.query).not.toHaveBeenCalled();
    expect(ticket.get.query).not.toHaveBeenCalled();
  });

  it("makes the ticket page's one read with the viewer's headers", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { results: { ...read, refundQuote } },
    });
    mockedApi.get.mockResolvedValueOnce({ data: {} });

    await expect(fetchTicketWithRefundQuote('t1', 'ssr-jwt')).resolves.toEqual({
      ...read,
      refundQuote,
    });
    await expect(fetchTicketWithRefundQuote('t1', undefined)).resolves.toEqual(
      {},
    );

    expect(mockedApi.get.mock.calls).toEqual([
      ['/tickets/t1', { headers: { Authorization: 'Bearer ssr-jwt' } }],
      ['/tickets/t1', { headers: undefined }],
    ]);
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it("makes the invoice's anonymous GET /ticket/:id, whatever the cookie", async () => {
    mockedApi.get.mockResolvedValue({ data: { results: paid } });

    await expect(fetchInvoiceTicket('t1', 'ssr-jwt')).resolves.toBe(paid);

    expect(mockedApi.get.mock.calls).toEqual([['/ticket/t1']]);
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it("makes the profile's GET /ticket with its where in key order", async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [paid] } });

    await expect(
      fetchTicketsByCreator('u1', ['approved', 'paid'], 200),
    ).resolves.toEqual([paid]);

    expect(mockedApi.get.mock.calls).toEqual([
      [
        '/ticket',
        {
          params: {
            where: {
              createdBy: 'u1',
              event: { $exists: true },
              status: { $in: ['approved', 'paid'] },
            },
            limit: 200,
          },
        },
      ],
    ]);
    expect(JSON.stringify(mockedApi.get.mock.calls[0][1].params.where)).toBe(
      '{"createdBy":"u1","event":{"$exists":true},"status":{"$in":["approved","paid"]}}',
    );
    expect(ticket.byCreator.query).not.toHaveBeenCalled();
  });

  it('loads and finds through the store under the same filters', async () => {
    const platform = makePlatform();
    const stored = fromJS([paid]);
    platform.ticket.find.mockReturnValue(stored);
    platform.ticket.findCount.mockReturnValue(3);

    const { result } = renderHook(() =>
      useEventTickets(platform, organiserPage(2), organiserCount),
    );
    await act(() =>
      Promise.all([result.current.loadCount(), result.current.loadTickets()]),
    );

    expect(result.current.tickets).toBe(stored);
    expect(result.current.count).toBe(3);
    expect(platform.ticket.get.mock.calls).toEqual([[organiserPage(2)]]);
    expect(platform.ticket.getCount.mock.calls).toEqual([[organiserCount]]);
    expect(platform.ticket.find).toHaveBeenCalledWith(organiserPage(2));
    expect(platform.ticket.findCount).toHaveBeenCalledWith(organiserCount);
    expect(ticket.list.query).not.toHaveBeenCalled();
    expect(ticket.count.query).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('reads mine and one ticket on the browser client', async () => {
    ticket.mine.query.mockResolvedValue([paid]);
    ticket.get.query.mockResolvedValue(read);

    await expect(getMyTickets({ event: 'e1', limit: 20 })).resolves.toEqual([
      paid,
    ]);
    await getMyTickets({ limit: 100 });
    await expect(getTicket('t1')).resolves.toBe(read);

    expect(ticket.mine.query.mock.calls).toEqual([
      [{ event: 'e1', limit: 20 }],
      [{ limit: 100 }],
    ]);
    expect(ticket.get.query).toHaveBeenCalledWith({ id: 't1' });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('rejects a foreign ticket with the API message', async () => {
    ticket.get.query.mockRejectedValue(
      trpcError('FORBIDDEN', 403, 'You are not allowed to view this ticket.'),
    );

    await expect(getTicket('t9')).rejects.toMatchObject({
      response: {
        status: 403,
        data: { error: 'You are not allowed to view this ticket.' },
      },
    });
  });

  it('reads the ticket page as the viewer and keeps the refund quote from legacy', async () => {
    mockServerGet.mockResolvedValue(read);
    mockedApi.get.mockResolvedValue({
      data: { results: { ...read, refundQuote } },
    });

    await expect(fetchTicketWithRefundQuote('t1', 'ssr-jwt')).resolves.toEqual({
      ...read,
      refundQuote,
    });

    expect(mockedTrpcFor).toHaveBeenCalledWith('ssr-jwt');
    expect(mockServerGet).toHaveBeenCalledWith({ id: 't1' });
    expect(mockedApi.get.mock.calls).toEqual([
      ['/tickets/t1', { headers: { Authorization: 'Bearer ssr-jwt' } }],
    ]);
  });

  it('shows the ticket without a quote when the legacy read fails or has none', async () => {
    ticket.get.query.mockResolvedValue(read);
    mockedApi.get.mockRejectedValueOnce(new Error('Network Error'));
    mockedApi.get.mockResolvedValueOnce({ data: { results: { ...read } } });

    await expect(fetchTicketWithRefundQuote('t1', undefined)).resolves.toEqual(
      read,
    );
    await expect(fetchTicketWithRefundQuote('t1', undefined)).resolves.toEqual(
      read,
    );
    expect(mockedTrpcFor).not.toHaveBeenCalled();
    expect(ticket.get.query).toHaveBeenCalledTimes(2);
  });

  it('keeps a null quote, which the page reads as nothing refundable', async () => {
    ticket.get.query.mockResolvedValue(read);
    mockedApi.get.mockResolvedValue({
      data: { results: { ...read, refundQuote: null } },
    });

    await expect(fetchTicketWithRefundQuote('t1', undefined)).resolves.toEqual({
      ...read,
      refundQuote: null,
    });
  });

  it("fails the ticket page on tRPC's error, not legacy's", async () => {
    ticket.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Ticket not found.'),
    );
    mockedApi.get.mockResolvedValue({ data: { results: read } });

    await expect(
      fetchTicketWithRefundQuote('gone', undefined),
    ).rejects.toMatchObject({ message: 'Ticket not found.' });
  });

  it('reads the invoice ticket as the holder', async () => {
    mockServerGet.mockResolvedValue(read);
    ticket.get.query.mockResolvedValue(read);

    await expect(fetchInvoiceTicket('t1', 'ssr-jwt')).resolves.toBe(paid);
    await expect(fetchInvoiceTicket('t1', undefined)).resolves.toBe(paid);

    expect(mockServerGet).toHaveBeenCalledWith({ id: 't1' });
    expect(ticket.get.query).toHaveBeenCalledWith({ id: 't1' });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("sends the profile's attended filter to byCreator", async () => {
    ticket.byCreator.query.mockResolvedValue([paid]);

    await expect(
      fetchTicketsByCreator('u1', ['approved', 'paid'], 200),
    ).resolves.toEqual([paid]);

    expect(ticket.byCreator.query).toHaveBeenCalledWith({
      userId: 'u1',
      statuses: ['approved', 'paid'],
      limit: 200,
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("lists the event page's tickets newest first and counts the approved ones", async () => {
    const platform = makePlatform();
    ticket.list.query.mockResolvedValue([paid, pending, {}]);
    ticket.count.query.mockResolvedValue(1);

    const { result } = renderHook(() =>
      useEventTickets(platform, eventPageList, eventPageCount),
    );
    expect(result.current.tickets).toBeUndefined();
    await act(() =>
      Promise.all([result.current.loadTickets(), result.current.loadCount()]),
    );

    expect(result.current.tickets?.count()).toBe(3);
    expect(result.current.tickets?.getIn([1, '_id'])).toBe('t2');
    expect(result.current.count).toBe(1);
    expect(ticket.list.query).toHaveBeenCalledWith({
      event: 'e1',
      sortBy: '-created',
    });
    expect(ticket.count.query).toHaveBeenCalledWith({
      event: 'e1',
      statuses: ['approved'],
    });
    expect(platform.ticket.get).not.toHaveBeenCalled();
    expect(platform.ticket.find).not.toHaveBeenCalled();
  });

  it("leaves the count unset when a non-staff status count is refused, as the store's error does", async () => {
    ticket.count.query.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, "Invalid search param in 'where': status"),
    );

    const { result } = renderHook(() =>
      useEventTickets(makePlatform(), eventPageList, eventPageCount),
    );
    await act(() => result.current.loadCount());

    expect(result.current.count).toBeUndefined();
  });

  it("pages the organiser's tickets and shows nothing for a page until it loads", async () => {
    ticket.list.query.mockResolvedValueOnce([paid]);
    ticket.list.query.mockRejectedValueOnce(new Error('boom'));
    ticket.count.query.mockResolvedValue(21);

    const { result, rerender } = renderHook(
      ({ page }) =>
        useEventTickets(makePlatform(), organiserPage(page), organiserCount),
      { initialProps: { page: 1 } },
    );
    await act(() =>
      Promise.all([result.current.loadCount(), result.current.loadTickets()]),
    );
    expect(result.current.tickets?.count()).toBe(1);

    rerender({ page: 2 });
    await act(() => result.current.loadTickets());

    expect(ticket.list.query.mock.calls).toEqual([
      [
        {
          event: 'e1',
          statuses: ['paid', 'approved'],
          limit: 20,
          page: 1,
          sortBy: '-created',
        },
      ],
      [
        {
          event: 'e1',
          statuses: ['paid', 'approved'],
          limit: 20,
          page: 2,
          sortBy: '-created',
        },
      ],
    ]);
    expect(ticket.count.query).toHaveBeenCalledWith({
      event: 'e1',
      statuses: ['paid', 'approved'],
    });
    expect(result.current.tickets).toBeUndefined();
    expect(result.current.count).toBe(21);
  });
});
