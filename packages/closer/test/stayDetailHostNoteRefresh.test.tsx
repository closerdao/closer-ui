import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import type { Booking } from '../types';
import { getHostNotes, getStay } from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'host_1', roles: ['admin'] },
  }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: {} } }),
}));

jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  getHostNotes: jest.fn(),
  getStayChanges: jest.fn(() =>
    Promise.resolve({ total: 0, page: 1, limit: 2, entries: [] }),
  ),
}));

jest.mock('../components/booking/hostActions/stayHostActions', () => ({
  __esModule: true,
  default: ({ onStayChange }: { onStayChange: () => void }) => (
    <button type="button" onClick={onStayChange}>
      Save host note
    </button>
  ),
}));

const mockedGetStay = getStay as jest.Mock;
const mockedHostNotes = getHostNotes as jest.Mock;

const booking = {
  _id: 'stay_1',
  status: 'confirmed',
  createdBy: 'guest_1',
  start: '2027-01-10T00:00:00.000Z',
  end: '2027-01-12T00:00:00.000Z',
  created: '2026-09-01T00:00:00.000Z',
  adults: 1,
} as unknown as Booking;

describe('stay detail host note', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });

  it('refreshes the host note even when refetching the stay fails', async () => {
    mockedHostNotes.mockResolvedValue({});
    mockedGetStay.mockRejectedValue(new Error('network down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Page = StayBookingSummaryPage as unknown as React.ComponentType<
      Record<string, unknown>
    >;
    renderWithNextIntl(
      <Page booking={booking} bookingConfig={{ enabled: true }} />,
    );

    await waitFor(() => expect(mockedHostNotes).toHaveBeenCalledTimes(1));
    await userEvent.click(
      screen.getByRole('button', { name: 'Save host note' }),
    );

    await waitFor(() => expect(mockedGetStay).toHaveBeenCalledWith('stay_1'));
    await waitFor(() => expect(mockedHostNotes).toHaveBeenCalledTimes(2));
  });
});
