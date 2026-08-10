import { BookingConfirmationPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import { booking, listing, paymentConfig } from '@/__tests__/mocks';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>('closer/contexts/auth');
  return { ...actual, useAuth: () => ({ isAuthenticated: true, user: {} }) };
});

describe('BookingConfirmationPage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_FEATURE_BOOKING: 'true' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('shows confirmation content when booking status is paid', () => {
    const paidBooking = { ...booking, status: 'paid' as const, _id: 'id-123' };
    renderWithProviders(
      <BookingConfirmationPage
        booking={paidBooking}
        bookingConfig={bookingConfig}
        event={null}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /you're all set|youre all set/i }),
    ).toBeInTheDocument();
  });

  it('shows confirmation content when booking status is checked-in', () => {
    const checkedInBooking = {
      ...booking,
      status: 'checked-in' as const,
      _id: 'id-456',
    };
    renderWithProviders(
      <BookingConfirmationPage
        booking={checkedInBooking}
        bookingConfig={bookingConfig}
        event={null}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /you're all set|youre all set/i }),
    ).toBeInTheDocument();
  });

  it('shows no bookings message when booking has no _id', () => {
    renderWithProviders(
      <BookingConfirmationPage
        booking={null}
        bookingConfig={bookingConfig}
        event={null}
      />,
    );
    expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
  });
});
