import type { ComponentType } from 'react';

import { screen, waitFor } from '@testing-library/react';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import type { Booking } from '../types';
import { getStay } from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

let currentUser: { _id: string; roles: string[] };

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: currentUser }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: {} } }),
}));

jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  getHostNotes: jest.fn(() => Promise.resolve({})),
  getStayChanges: jest.fn(() =>
    Promise.resolve({ total: 0, page: 1, limit: 2, entries: [] }),
  ),
}));

jest.mock('../components/booking/hostActions/stayHostActions', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../components/booking/stayModifyFlow', () => ({
  __esModule: true,
  default: () => <div data-testid="stay-modify-flow" />,
}));

const endedStay = {
  _id: 'stay_1',
  createdBy: 'guest_1',
  status: 'paid',
  listing: 'listing_1',
  start: '2026-09-15T11:00:00.000Z',
  end: '2026-09-18T11:00:00.000Z',
  created: '2026-07-28T00:00:00.000Z',
  adults: 2,
};

const upcomingStay = {
  ...endedStay,
  start: '2027-01-10T11:00:00.000Z',
  end: '2027-01-12T11:00:00.000Z',
};

const renderPage = (booking: Record<string, unknown>) => {
  (getStay as jest.Mock).mockResolvedValue(booking);
  const Page = StayBookingSummaryPage as unknown as ComponentType<
    Record<string, unknown>
  >;
  renderWithNextIntl(
    <Page
      booking={booking as unknown as Booking}
      listing={{ _id: 'listing_1', priceDuration: 'night' }}
      bookingConfig={{ enabled: true }}
    />,
  );
};

describe('changing a stay that has ended', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });
  beforeEach(() => jest.clearAllMocks());

  it('offers the guest a new booking instead of the change-dates form', async () => {
    currentUser = { _id: 'guest_1', roles: [] };
    renderPage(endedStay);

    const bookAgain = await screen.findByRole('link', { name: 'Book again' });
    expect(bookAgain).toHaveAttribute(
      'href',
      '/stay/create?listingId=listing_1&adults=2',
    );
    expect(screen.queryByTestId('stay-modify-flow')).not.toBeInTheDocument();
  });

  it('keeps the change-dates form for a guest whose stay has not ended', async () => {
    currentUser = { _id: 'guest_1', roles: [] };
    renderPage(upcomingStay);

    expect(await screen.findByTestId('stay-modify-flow')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Book again' }),
    ).not.toBeInTheDocument();
  });

  it('lets a space-host still correct an ended stay', async () => {
    currentUser = { _id: 'host_1', roles: ['space-host'] };
    renderPage(endedStay);

    await waitFor(() =>
      expect(screen.getByTestId('stay-modify-flow')).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('link', { name: 'Book again' }),
    ).not.toBeInTheDocument();
  });
});
