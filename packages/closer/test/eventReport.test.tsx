import React from 'react';

import { screen } from '@testing-library/react';

import EventReportPage from '../pages/events/[slug]/report';
import type { EventReport } from '../types/eventReport';
import { renderWithAuth } from './utils';

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../../utils/api" the page imports.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: null } })),
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

jest.mock('../components/ui/Charts/DonutChart', () => ({
  __esModule: true,
  default: ({ data }: { data: { name: string }[] }) => (
    <div data-testid="donut">{data.map((d) => d.name).join(',')}</div>
  ),
}));

// The page has exactly one dynamic import — the donut chart — so resolving it
// synchronously keeps the charts in the tree without an async loading step.
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => jest.requireMock('../components/ui/Charts/DonutChart').default,
}));

const mockedApi = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
};

const report: EventReport = {
  event: {
    _id: '664000000000000000000009',
    name: 'Citizen Gathering',
    slug: 'citizen-gathering',
    start: '2026-09-01T16:00:00.000Z',
    end: '2026-09-04T10:00:00.000Z',
    capacity: 30,
  },
  currency: 'EUR',
  mixedCurrencies: false,
  currencies: ['EUR'],
  totals: {
    ticketsSold: 2,
    attendees: 3,
    eventRevenue: 125,
    stayRevenue: 150,
    totalRevenue: 275,
  },
  bookings: {
    count: 1,
    attendees: 2,
    eventRevenue: 80,
    stayRevenue: 150,
    rentalRevenue: 100,
    utilityRevenue: 20,
    foodRevenue: 30,
    totalRevenue: 230,
    tokensStaked: 0,
    creditsPaid: 0,
    byStatus: { paid: 1, cancelled: 2 },
    notCounted: 2,
  },
  tickets: {
    count: 1,
    attendees: 1,
    revenue: 45,
    byStatus: { approved: 2 },
    byPaymentMethod: { card: 1 },
    linkedToBookings: 1,
    held: { count: 1, attendees: 2 },
    refunded: { count: 1, refundVal: 50 },
  },
  attendance: {
    capacity: 30,
    confirmed: 3,
    held: 2,
    remaining: 25,
  },
  byOption: [
    { name: 'Weekend', count: 1, attendees: 2, revenue: 80 },
    { name: 'Day', count: 1, attendees: 1, revenue: 45 },
  ],
  byPaymentMethod: [
    { name: 'booking', count: 1, attendees: 2, revenue: 80 },
    { name: 'card', count: 1, attendees: 1, revenue: 45 },
  ],
};

/** priceFormat goes through Intl, so separators depend on the host locale. */
const money = (amount: string) =>
  new RegExp(`${amount}[.,]00`.replace('.', '\\.'));

const emptyReport: EventReport = {
  ...report,
  totals: {
    ticketsSold: 0,
    attendees: 0,
    eventRevenue: 0,
    stayRevenue: 0,
    totalRevenue: 0,
  },
  bookings: { ...report.bookings, count: 0, byStatus: {}, notCounted: 0 },
  tickets: {
    ...report.tickets,
    count: 0,
    byStatus: {},
    byPaymentMethod: {},
    linkedToBookings: 0,
    held: { count: 0, attendees: 0 },
    refunded: { count: 0, refundVal: 0 },
  },
  attendance: { capacity: 30, confirmed: 0, held: 0, remaining: 30 },
  byOption: [],
  byPaymentMethod: [],
};

describe('EventReportPage', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
  });

  it('renders the merged totals from the report endpoint', () => {
    renderWithAuth(
      <EventReportPage report={report} eventSlug="citizen-gathering" />,
    );

    expect(
      screen.getByText('Citizen Gathering - Event Report'),
    ).toBeInTheDocument();
    // Headline totals: 125 event + 150 stay = 275, 2 tickets, 3 heads.
    expect(screen.getAllByText(money('275')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money('125')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(money('150')).length).toBeGreaterThan(0);
    expect(screen.getByText('3 / 30')).toBeInTheDocument();

    const donuts = screen.getAllByTestId('donut');
    // Zero-valued slices are dropped, so food/utilities only show when charged.
    expect(donuts[0]).toHaveTextContent('Event,Accommodation,Utilities,Food');
    expect(donuts[1]).toHaveTextContent('Bookings,Standalone tickets');
  });

  it('shows both sources and the de-duplication counts', () => {
    renderWithAuth(
      <EventReportPage report={report} eventSlug="citizen-gathering" />,
    );

    expect(screen.getByText('Where The Money Came From')).toBeInTheDocument();
    expect(
      screen.getByText('1 tickets belong to a booking and are counted there.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('2 bookings not counted as revenue.'),
    ).toBeInTheDocument();
    // byStatus carries every row, including the ones worth nothing.
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('keeps tokens and credits out of the money and hides them at zero', () => {
    const { unmount } = renderWithAuth(
      <EventReportPage report={report} eventSlug="citizen-gathering" />,
    );
    expect(screen.queryByText('Tokens Staked')).not.toBeInTheDocument();
    unmount();

    renderWithAuth(
      <EventReportPage
        report={{
          ...report,
          bookings: { ...report.bookings, tokensStaked: 12, creditsPaid: 3 },
        }}
        eventSlug="citizen-gathering"
      />,
    );
    expect(screen.getByText('Tokens Staked')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    // Totals are untouched by the token stake.
    expect(screen.getAllByText(money('275')).length).toBeGreaterThan(0);
  });

  it('reports seats left against the seats a checkout is still holding', () => {
    renderWithAuth(
      <EventReportPage report={report} eventSlug="citizen-gathering" />,
    );

    expect(screen.getByText('Seats Left')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(
      screen.getByText('2 seat(s) held by checkouts in progress'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('1 unfinished checkout(s) holding 2 seat(s)'),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 cancelled, .*50/)).toBeInTheDocument();
  });

  it('says unlimited rather than a number when the event has no capacity', () => {
    renderWithAuth(
      <EventReportPage
        report={{
          ...report,
          attendance: { ...report.attendance!, capacity: 0, remaining: null },
        }}
        eventSlug="citizen-gathering"
      />,
    );

    expect(screen.getByText('Unlimited')).toBeInTheDocument();
  });

  it('cuts the same seats by option and by payment method', () => {
    renderWithAuth(
      <EventReportPage report={report} eventSlug="citizen-gathering" />,
    );

    expect(screen.getByText('By Ticket Option')).toBeInTheDocument();
    expect(screen.getByText('Weekend')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('By Payment Method')).toBeInTheDocument();
    // The rail a stay paid on is named "booking", and formatStatus title-cases.
    expect(screen.getByText('Booking')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    // Both cuts describe the same money — 80 + 45 is the event revenue
    // headline — so each figure shows up in both tables.
    expect(screen.getAllByText(money('80')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(money('45')).length).toBeGreaterThanOrEqual(2);
  });

  it('warns instead of showing a headline figure on mixed currencies', () => {
    renderWithAuth(
      <EventReportPage
        report={{
          ...report,
          mixedCurrencies: true,
          currencies: ['EUR', 'USD'],
        }}
        eventSlug="citizen-gathering"
      />,
    );

    expect(screen.getByText('Mixed currencies')).toBeInTheDocument();
    expect(
      screen.getByText(/This event took money in EUR, USD\./),
    ).toBeInTheDocument();
    expect(screen.getByText('EUR / USD')).toBeInTheDocument();
  });

  it('renders the empty state when nothing was sold', () => {
    renderWithAuth(
      <EventReportPage report={emptyReport} eventSlug="citizen-gathering" />,
    );

    expect(
      screen.getByText('Nothing has been sold for this event yet.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No bookings for this event.')).toBeInTheDocument();
    expect(
      screen.queryByText('Where The Money Came From'),
    ).not.toBeInTheDocument();
  });

  it('shows the not-allowed page for a 401 rather than an empty report', () => {
    renderWithAuth(
      <EventReportPage
        errorStatus={401}
        error="You are not allowed to view this report"
      />,
    );

    expect(
      screen.getByText('You are not allowed to view this report'),
    ).toBeInTheDocument();
  });

  it('resolves the slug to an id before asking for the report', async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: { results: { _id: '664000000000000000000009' } },
      })
      .mockResolvedValueOnce({ data: { results: report } });

    const props = await (EventReportPage as any).getInitialProps({
      query: { slug: 'citizen-gathering' },
    });

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      '/event/citizen-gathering',
      expect.anything(),
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      '/events/664000000000000000000009/report',
      expect.anything(),
    );
    expect(props.report).toEqual(report);
  });

  it('skips the lookup when the route already carries an id', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { results: report } });

    await (EventReportPage as any).getInitialProps({
      query: { slug: '664000000000000000000009' },
    });

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/events/664000000000000000000009/report',
      expect.anything(),
    );
  });

  it('passes the API status through so the page can pick an error screen', async () => {
    mockedApi.get.mockRejectedValueOnce({
      response: { status: 401, data: { error: 'Authentication required' } },
    });

    const props = await (EventReportPage as any).getInitialProps({
      query: { slug: '664000000000000000000009' },
    });

    expect(props.errorStatus).toBe(401);
    expect(props.error).toBe('Authentication required');
  });
});
