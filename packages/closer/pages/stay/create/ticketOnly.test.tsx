import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../../test/utils';
import { createStay, searchStays } from '../../../utils/stays.api';
import StayCreatePage from './index';

jest.mock('../../../components/StaySearchBar', () => ({
  __esModule: true,
  default: () => <div data-testid="search-bar" />,
}));

jest.mock('../../../utils/stays.api', () => ({
  searchStays: jest.fn(),
  createStay: jest.fn(),
  validateDiscountCode: jest.fn(),
}));

let mockQuery: Record<string, string> = {};
const routerPush = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    pathname: '/stay/create',
    asPath: '/stay/create',
    isReady: true,
    replace: jest.fn(),
    push: routerPush,
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  }),
}));

let mockUser: any = null;

jest.mock('../../../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: !!mockUser,
    user: mockUser,
    isLoading: false,
  }),
}));

const event = {
  _id: 'event-1',
  name: 'Confluência',
  slug: 'confluencia',
  paid: true,
  start: '2026-09-24T14:00:00.000Z',
  end: '2026-09-27T13:00:00.000Z',
  canSelectDates: false,
};

// A mixed line-up: the day ticket used to vanish because the flow only offered
// tickets when every option on the event was a day ticket.
const ticketOptions = [
  {
    name: '3-day Ticket (At Cost)',
    price: 60,
    currency: 'EUR',
    limit: 52,
    available: 52,
    _id: 'ticket-1',
  },
  {
    name: 'Day Ticket - Saturday',
    price: 45,
    currency: 'EUR',
    limit: 40,
    available: 40,
    isDayTicket: true,
    _id: 'ticket-2',
  },
];

const renderPage = () =>
  renderWithNextIntl(
    <StayCreatePage
      bookingSettings={{ minDuration: 1, memberMinDuration: 1 } as any}
      generalConfig={null}
      volunteerConfig={null}
      calendarBlockingEvents={[]}
      event={event as any}
      ticketOptions={ticketOptions as any}
    />,
  );

const continueButton = () => screen.getByRole('button', { name: /continue/i });

describe('/stay/create ticket only stays', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { _id: 'user-1', roles: ['member'] };
    (searchStays as jest.Mock).mockResolvedValue({ results: [], duration: 3 });
    (createStay as jest.Mock).mockResolvedValue({ _id: 'stay-1' });
  });

  it('offers every ticket when the guest needs no accommodation', async () => {
    mockQuery = { eventId: 'event-1', ticketOnly: 'true' };
    renderPage();

    expect(
      await screen.findByText('3-day Ticket (At Cost)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Day Ticket - Saturday')).toBeInTheDocument();
    // Nothing to search for: a ticket-only stay reserves no space.
    expect(searchStays).not.toHaveBeenCalled();
  });

  it('books a full ticket without a listing across the whole event', async () => {
    mockQuery = {
      eventId: 'event-1',
      ticketOnly: 'true',
      ticketOption: '3-day Ticket (At Cost)',
    };
    renderPage();

    await userEvent.click(continueButton());

    await waitFor(() => expect(createStay).toHaveBeenCalledTimes(1));
    const payload = (createStay as jest.Mock).mock.calls[0][0];
    expect(payload).toMatchObject({
      eventId: 'event-1',
      ticketOption: '3-day Ticket (At Cost)',
      isDayTicket: true,
      start: '2026-09-24',
      end: '2026-09-27',
    });
    expect(payload).not.toHaveProperty('listingId');
    // Checkout loads the stay by id, so the ticket rides along in the URL for
    // it to save if the stay came back without one.
    expect(routerPush).toHaveBeenCalledWith(
      '/stay/create/stay-1?ticketOption=3-day+Ticket+%28At+Cost%29',
    );
  });

  it('books a day ticket for a single day', async () => {
    mockQuery = {
      eventId: 'event-1',
      ticketOnly: 'true',
      ticketOption: 'Day Ticket - Saturday',
    };
    renderPage();

    await userEvent.click(continueButton());

    await waitFor(() => expect(createStay).toHaveBeenCalledTimes(1));
    expect((createStay as jest.Mock).mock.calls[0][0]).toMatchObject({
      start: '2026-09-24',
      end: '2026-09-24',
    });
  });

  it('searches for accommodation and keeps the chosen ticket', async () => {
    mockQuery = {
      eventId: 'event-1',
      ticketOption: '3-day Ticket (At Cost)',
      start: '2026-09-24',
      end: '2026-09-27',
      adults: '1',
    };
    (searchStays as jest.Mock).mockResolvedValue({
      results: [{ _id: 'listing-1', name: 'Private Glamping' }],
      duration: 3,
    });
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    // The ticket was already picked on the event page, so this step is only
    // about where to sleep.
    expect(screen.queryByText('Day Ticket - Saturday')).not.toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', { name: /reserve/i }),
    );

    await waitFor(() => expect(createStay).toHaveBeenCalledTimes(1));
    expect((createStay as jest.Mock).mock.calls[0][0]).toMatchObject({
      listingId: 'listing-1',
      eventId: 'event-1',
      ticketOption: '3-day Ticket (At Cost)',
    });
    expect(routerPush).toHaveBeenCalledWith(
      '/stay/create/stay-1?ticketOption=3-day+Ticket+%28At+Cost%29',
    );
  });

  it('sends a signed out guest to sign up before creating anything', async () => {
    mockUser = null;
    mockQuery = {
      eventId: 'event-1',
      ticketOnly: 'true',
      ticketOption: 'Day Ticket - Saturday',
    };
    renderPage();

    await userEvent.click(continueButton());

    expect(createStay).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith(
      expect.stringContaining('/signup?back='),
    );
    expect(routerPush.mock.calls[0][0]).toContain('ticketOnly%3Dtrue');
  });
});
