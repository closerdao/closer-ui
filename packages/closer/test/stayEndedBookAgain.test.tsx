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

const GUEST_ID = 'guest_1';
const LISTING_ID = 'listing_1';

const endedStay = {
  _id: 'stay_1',
  createdBy: GUEST_ID,
  status: 'paid',
  listing: LISTING_ID,
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

const renderPage = (
  booking: Record<string, unknown>,
  generalConfig?: Record<string, unknown>,
) => {
  (getStay as jest.Mock).mockResolvedValue(booking);
  const Page = StayBookingSummaryPage as unknown as ComponentType<
    Record<string, unknown>
  >;
  renderWithNextIntl(
    <Page
      booking={booking as unknown as Booking}
      listing={{ _id: LISTING_ID, priceDuration: 'night' }}
      bookingConfig={{ enabled: true }}
      generalConfig={generalConfig}
    />,
  );
};

const restoreEnv = (name: string, value: string | undefined) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

describe('changing a stay that has ended', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    restoreEnv('NEXT_PUBLIC_FEATURE_BOOKING', featureBooking);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    // Pinned between the ended and the upcoming stay.
    jest.useFakeTimers({
      now: new Date('2026-09-30T10:00:00.000Z'),
      doNotFake: [
        'nextTick',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
      ],
    } as any);
  });
  afterEach(() => jest.useRealTimers());

  it('offers the guest a new booking instead of the change-dates form', async () => {
    currentUser = { _id: GUEST_ID, roles: [] };
    renderPage(endedStay);

    const bookAgain = await screen.findByRole('link', { name: 'Book again' });
    expect(bookAgain).toHaveAttribute(
      'href',
      `/stay/create?listingId=${LISTING_ID}&adults=2`,
    );
    expect(screen.queryByTestId('stay-modify-flow')).not.toBeInTheDocument();
  });

  it('keeps the change-dates form for a guest whose stay has not ended', async () => {
    currentUser = { _id: GUEST_ID, roles: [] };
    renderPage(upcomingStay);

    expect(await screen.findByTestId('stay-modify-flow')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Book again' }),
    ).not.toBeInTheDocument();
  });

  it('offers no Book again for a cancelled stay, whose dates were never changeable', async () => {
    currentUser = { _id: GUEST_ID, roles: [] };
    renderPage({ ...endedStay, status: 'cancelled' });

    expect(
      await screen.findByRole('heading', { name: 'Your booking is cancelled' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Book again' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('stay-modify-flow')).not.toBeInTheDocument();
  });

  describe('when the general config has no timezone', () => {
    const defaultTimezone = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    beforeEach(() => {
      // Kiritimati (UTC+14) is already on 19 Sep while UTC and the browser
      // zones around it are still on the 18th, the stay's check-out day.
      process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = 'Pacific/Kiritimati';
      jest.useFakeTimers({
        now: new Date('2026-09-18T10:05:00.000Z'),
        doNotFake: [
          'nextTick',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
        ],
      } as any);
    });
    afterEach(() => {
      restoreEnv('NEXT_PUBLIC_DEFAULT_TIMEZONE', defaultTimezone);
      jest.useRealTimers();
    });

    it('reads the check-out day in the default property timezone', async () => {
      currentUser = { _id: GUEST_ID, roles: [] };
      renderPage({ ...endedStay, end: '2026-09-18T09:00:00.000Z' }, {});

      expect(
        await screen.findByRole('link', { name: 'Book again' }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('stay-modify-flow')).not.toBeInTheDocument();
    });
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
