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
}));

let mockQuery: Record<string, string> = {};
const routerReplace = jest.fn();
const routerPush = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    pathname: '/stay/create',
    asPath: '/stay/create',
    isReady: true,
    replace: routerReplace,
    push: routerPush,
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  }),
}));

let mockUser: any = null;
let mockIsAuthLoading = false;

jest.mock('../../../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: !!mockUser,
    user: mockUser,
    isLoading: mockIsAuthLoading,
  }),
}));

const blockingEvent = {
  _id: 'event-1',
  name: 'Regeneration Week',
  slug: 'regeneration-week',
  start: '2026-06-01',
  end: '2026-06-10',
  blocksBookingCalendar: true,
};

const listing = {
  _id: 'listing-1',
  name: 'Private Glamping',
  available: false,
};

const paidEvent = {
  _id: 'event-1',
  name: 'Regeneration Week',
  slug: 'regeneration-week',
  paid: true,
  start: '2026-06-01',
  end: '2026-06-10',
};

const ticketOptions = [
  {
    _id: 'ticket-1',
    name: '3-day Ticket (At Cost)',
    price: 60,
    currency: 'EUR',
    limit: 52,
    available: 52,
  },
];

const renderPage = (props: Record<string, unknown> = {}) =>
  renderWithNextIntl(
    <StayCreatePage
      bookingSettings={{ minDuration: 1, memberMinDuration: 1 } as any}
      generalConfig={null}
      volunteerConfig={null}
      calendarBlockingEvents={[blockingEvent]}
      {...(props as any)}
    />,
  );

const teamToggle = () =>
  screen.queryByRole('checkbox', { name: /book for the team/i });

const lastSearchPayload = () => {
  const calls = (searchStays as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
};

const blockedNotice = () =>
  screen.queryAllByText(/those dates are reserved for an event/i);

describe('/stay/create team bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthLoading = false;
    mockUser = { _id: 'user-1', roles: ['member', 'space-host'] };
    mockQuery = { start: '2026-06-02', end: '2026-06-04', adults: '2' };
    (searchStays as jest.Mock).mockResolvedValue({
      results: [listing],
      duration: 2,
    });
    (createStay as jest.Mock).mockResolvedValue({ _id: 'stay-1' });
  });

  it('searches without the flag until a staff member asks for a team booking', async () => {
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    expect(lastSearchPayload()).not.toHaveProperty('isTeamBooking');

    await userEvent.click(teamToggle() as HTMLElement);

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(2));
    expect(lastSearchPayload()).toMatchObject({
      start: '2026-06-02',
      end: '2026-06-04',
      isTeamBooking: true,
    });
  });

  it('keeps the choice in the url so it survives the signup detour', async () => {
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    await userEvent.click(teamToggle() as HTMLElement);

    await waitFor(() => {
      const calls = routerReplace.mock.calls;
      expect(calls[calls.length - 1][0].query.isTeamBooking).toBe('true');
    });
  });

  it('drops the blocked-dates notice for a team booking', async () => {
    mockQuery = { ...mockQuery, isTeamBooking: 'true' };
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    expect(lastSearchPayload()).toMatchObject({ isTeamBooking: true });
    expect(blockedNotice()).toHaveLength(0);
  });

  it('still explains the block to a guest who is not staff', async () => {
    mockUser = { _id: 'user-2', roles: ['member'] };
    mockQuery = { ...mockQuery, isTeamBooking: 'true' };
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    expect(lastSearchPayload()).not.toHaveProperty('isTeamBooking');
    expect(teamToggle()).not.toBeInTheDocument();
    await waitFor(() => expect(blockedNotice().length).toBeGreaterThan(0));
  });

  it('waits for the roles before the first search', async () => {
    mockIsAuthLoading = true;
    mockQuery = { ...mockQuery, isTeamBooking: 'true' };
    const { rerender } = renderPage();

    await waitFor(() => expect(searchStays).not.toHaveBeenCalled());

    mockIsAuthLoading = false;
    rerender(
      <StayCreatePage
        bookingSettings={{ minDuration: 1, memberMinDuration: 1 } as any}
        generalConfig={null}
        volunteerConfig={null}
        calendarBlockingEvents={[blockingEvent]}
      />,
    );

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    expect(lastSearchPayload()).toMatchObject({ isTeamBooking: true });
  });

  it('books beds for the whole party the ticket modal sold to', async () => {
    mockQuery = {
      start: '2026-06-02',
      end: '2026-06-04',
      adults: '3',
      eventId: 'event-1',
      ticketOption: '3-day Ticket (At Cost)',
    };
    (searchStays as jest.Mock).mockResolvedValue({
      results: [{ ...listing, available: true }],
      duration: 2,
    });
    renderPage({ event: paidEvent, ticketOptions });

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    expect(lastSearchPayload()).toMatchObject({ adults: 3 });

    const bookButton = await screen.findByRole('button', {
      name: /book|select|reserve|continue/i,
    });
    await userEvent.click(bookButton);

    await waitFor(() => expect(createStay).toHaveBeenCalledTimes(1));
    expect((createStay as jest.Mock).mock.calls[0][0]).toMatchObject({
      adults: 3,
      eventId: 'event-1',
    });
  });

  it('creates the draft as a team stay', async () => {
    mockQuery = { ...mockQuery, isTeamBooking: 'true' };
    (searchStays as jest.Mock).mockResolvedValue({
      results: [{ ...listing, available: true }],
      duration: 2,
    });
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    const bookButton = await screen.findByRole('button', {
      name: /book|select|reserve|continue/i,
    });
    await userEvent.click(bookButton);

    await waitFor(() => expect(createStay).toHaveBeenCalledTimes(1));
    expect((createStay as jest.Mock).mock.calls[0][0]).toMatchObject({
      listingId: 'listing-1',
      isTeamBooking: true,
    });
  });
});

describe('/stay/create friends bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthLoading = false;
    mockUser = { _id: 'user-1', roles: ['member'] };
    mockQuery = {
      start: '2026-06-02',
      end: '2026-06-04',
      adults: '2',
      isFriendsBooking: 'true',
      friendEmails: 'ada@example.com,bob@example.com',
    };
    (searchStays as jest.Mock).mockResolvedValue({
      results: [{ ...listing, available: true }],
      duration: 2,
    });
    (createStay as jest.Mock).mockResolvedValue({ _id: 'stay-1' });
  });

  it('keeps the friends in the url after the first search', async () => {
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    expect(lastSearchPayload()).toMatchObject({ isFriendsBooking: true });
    const calls = routerReplace.mock.calls;
    expect(calls[calls.length - 1][0].query).toMatchObject({
      isFriendsBooking: 'true',
      friendEmails: 'ada@example.com,bob@example.com',
    });
  });

  it('creates the draft as a friends booking', async () => {
    renderPage();

    await waitFor(() => expect(searchStays).toHaveBeenCalledTimes(1));
    const bookButton = await screen.findByRole('button', {
      name: /book|select|reserve|continue/i,
    });
    await userEvent.click(bookButton);

    await waitFor(() => expect(createStay).toHaveBeenCalledTimes(1));
    expect((createStay as jest.Mock).mock.calls[0][0]).toMatchObject({
      listingId: 'listing-1',
      isFriendsBooking: true,
      friendEmails: 'ada@example.com,bob@example.com',
    });
  });
});

describe('/stay/create hourly listings', () => {
  const nightly = {
    _id: 'listing-1',
    name: 'Private Glamping',
    available: true,
  };
  const sauna = {
    _id: 'listing-2',
    name: 'Sauna',
    available: true,
    priceDuration: 'hour',
  };
  const hourlyNotice = () =>
    screen.queryByText(/hourly spaces can't be booked here yet/i);

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthLoading = false;
    mockUser = { _id: 'user-1', roles: [] };
    mockQuery = { start: '2026-07-02', end: '2026-07-04', adults: '1' };
    (searchStays as jest.Mock).mockResolvedValue({
      results: [nightly, sauna],
      duration: 2,
    });
  });

  it('offers only the nightly listings and says why the hourly one is missing', async () => {
    renderPage();

    expect(await screen.findByText('Private Glamping')).toBeInTheDocument();
    expect(screen.queryByText('Sauna')).not.toBeInTheDocument();
    expect(hourlyNotice()).toBeInTheDocument();
  });

  it('explains instead of offering a focused hourly listing', async () => {
    mockQuery = { ...mockQuery, listingId: 'listing-2' };
    renderPage();

    await waitFor(() => expect(hourlyNotice()).toBeInTheDocument());
    expect(screen.queryByText('Sauna')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/no accommodations found/i),
    ).not.toBeInTheDocument();
  });

  it('shows no notice when every listing is nightly', async () => {
    (searchStays as jest.Mock).mockResolvedValue({
      results: [nightly],
      duration: 2,
    });
    renderPage();

    expect(await screen.findByText('Private Glamping')).toBeInTheDocument();
    expect(hourlyNotice()).not.toBeInTheDocument();
  });
});
