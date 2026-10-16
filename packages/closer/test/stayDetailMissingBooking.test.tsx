import type { ComponentType } from 'react';

import { screen } from '@testing-library/react';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'guest_1', roles: [] },
  }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: {} } }),
}));

const Page = StayBookingSummaryPage as unknown as ComponentType<
  Record<string, unknown>
>;

describe('stay detail without a booking', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });

  it.each([null, undefined])('shows not found for booking=%s', (booking) => {
    renderWithNextIntl(
      <Page booking={booking} bookingConfig={{ enabled: true }} />,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.queryByText(/pendingModification/)).not.toBeInTheDocument();
  });

  it('preserves the loading error when the booking is missing', () => {
    renderWithNextIntl(
      <Page
        booking={null}
        error="Could not load the stay. Please try again."
        bookingConfig={{ enabled: true }}
      />,
    );

    expect(
      screen.getByText('Could not load the stay. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pendingModification/)).not.toBeInTheDocument();
  });
});
