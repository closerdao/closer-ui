import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import type { Ticket } from '../../types/ticket';
import MyTicketsPage from './index';

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '',
  cdn: '',
  invalidateGetCache: jest.fn(),
  refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
  setOnSessionInvalid: jest.fn(),
}));

const api = jest.requireMock('../../utils/api.js').default;
const get = api.get as jest.Mock;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({
    user: { _id: 'u1' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

const NOW = new Date('2026-06-01T12:00:00.000Z');
const hoursAgo = (hours: number) =>
  new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();

const EVENTS = [
  { _id: 'e-fresh', name: 'Fresh Cancel Fest', slug: 'fresh' },
  { _id: 'e-stale', name: 'Stale Cancel Fest', slug: 'stale' },
  { _id: 'e-stay', name: 'Stay Cancel Fest', slug: 'stay' },
  { _id: 'e-live', name: 'Live Ticket Fest', slug: 'live' },
];

const ticket = (overrides: Partial<Ticket>): Ticket => ({
  _id: 't',
  status: 'approved',
  paymentMethod: 'card',
  event: 'e-live',
  quantity: 1,
  created: hoursAgo(48),
  ...overrides,
});

const TICKETS: Ticket[] = [
  ticket({
    _id: 't-live',
    event: 'e-live',
    status: 'approved',
    updated: hoursAgo(48),
  }),
  ticket({
    _id: 't-fresh',
    event: 'e-fresh',
    status: 'cancelled',
    cancellation: { at: hoursAgo(1) },
  }),
  ticket({
    _id: 't-stale',
    event: 'e-stale',
    status: 'cancelled',
    cancellation: { at: hoursAgo(4) },
  }),
  // Cancelled by its stay: no cancellation record, only the save time.
  ticket({
    _id: 't-stay',
    event: 'e-stay',
    status: 'cancelled',
    booking: 'b1',
    updated: hoursAgo(30),
  }),
];

describe('/tickets', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    get.mockReset();
    get.mockImplementation((url: string) => {
      if (url === '/tickets/mine') {
        return Promise.resolve({ data: { results: TICKETS } });
      }
      if (url === '/event') {
        return Promise.resolve({ data: { results: EVENTS } });
      }
      return Promise.resolve({ data: { results: [] } });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hides cancelled tickets older than three hours and keeps the rest', async () => {
    renderWithNextIntl(<MyTicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('Live Ticket Fest')).toBeInTheDocument();
    });
    expect(screen.getByText('Fresh Cancel Fest')).toBeInTheDocument();
    expect(screen.queryByText('Stale Cancel Fest')).not.toBeInTheDocument();
    expect(screen.queryByText('Stay Cancel Fest')).not.toBeInTheDocument();
  });

  it('only looks up the events of the tickets it will show', async () => {
    renderWithNextIntl(<MyTicketsPage />);

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/event', expect.anything());
    });
    const eventCall = get.mock.calls.find(([url]) => url === '/event');
    const where = decodeURIComponent(eventCall?.[1]?.params?.where);
    expect(where).toContain('e-live');
    expect(where).toContain('e-fresh');
    expect(where).not.toContain('e-stale');
    expect(where).not.toContain('e-stay');
  });
});
