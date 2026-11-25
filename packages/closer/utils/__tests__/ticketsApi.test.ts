import api from '../api';
import {
  cancelTicket,
  confirmTicketCard,
  getEventTicketAvailability,
  initTicket,
  quoteTicket,
} from '../tickets.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    ticket: {
      availability: { query: jest.fn() },
      quote: { mutate: jest.fn() },
      init: { mutate: jest.fn() },
      confirmCard: { mutate: jest.fn() },
      cancel: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const ticket = trpc.ticket as unknown as Record<
  string,
  { query?: jest.Mock; mutate?: jest.Mock }
>;

const request = { eventId: 'e1', quantity: 1 } as never;

beforeEach(() => jest.clearAllMocks());

describe('on the legacy API', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: 'r' } });
    mockedApi.post.mockResolvedValue({ data: { results: 'r' } });
  });

  it('calls the ticket routes', async () => {
    await getEventTicketAvailability('e1');
    await quoteTicket(request);
    await initTicket(request);
    await confirmTicketCard('t1', 'pi_1');
    await cancelTicket('t1', 'changed plans');
    await cancelTicket('t1');
    expect(mockedApi.get.mock.calls).toEqual([
      ['/tickets/event/e1/availability'],
    ]);
    expect(mockedApi.post.mock.calls).toEqual([
      ['/tickets/quote', request],
      ['/tickets/init', request],
      ['/tickets/t1/confirm-card', { paymentIntentId: 'pi_1' }],
      ['/tickets/t1/cancel', { reason: 'changed plans' }],
      ['/tickets/t1/cancel', {}],
    ]);
    expect(ticket.quote.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('calls the procedures', async () => {
    ticket.availability.query!.mockResolvedValue('a');
    ticket.quote.mutate!.mockResolvedValue('q');
    ticket.init.mutate!.mockResolvedValue('i');
    ticket.confirmCard.mutate!.mockResolvedValue('c');
    ticket.cancel.mutate!.mockResolvedValue('x');

    await expect(getEventTicketAvailability('e1')).resolves.toBe('a');
    await expect(quoteTicket(request)).resolves.toBe('q');
    await expect(initTicket(request)).resolves.toBe('i');
    await expect(confirmTicketCard('t1', 'pi_1')).resolves.toBe('c');
    await expect(cancelTicket('t1', 'changed plans')).resolves.toBe('x');
    await cancelTicket('t1');

    expect(ticket.availability.query).toHaveBeenCalledWith({ id: 'e1' });
    expect(ticket.quote.mutate).toHaveBeenCalledWith(request);
    expect(ticket.init.mutate).toHaveBeenCalledWith(request);
    expect(ticket.confirmCard.mutate).toHaveBeenCalledWith({
      id: 't1',
      paymentIntentId: 'pi_1',
    });
    expect(ticket.cancel.mutate!.mock.calls).toEqual([
      [{ id: 't1', reason: 'changed plans' }],
      [{ id: 't1' }],
    ]);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a failure as the axios error the pages read', async () => {
    const { TRPCClientError } = jest.requireActual('@trpc/client');
    ticket.init.mutate!.mockRejectedValue(
      new TRPCClientError('Sold out', {
        result: {
          error: {
            message: 'Sold out',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
          },
        },
      }),
    );
    await expect(initTicket(request)).rejects.toMatchObject({
      response: { status: 400, data: { error: 'Sold out' } },
    });
  });
});
