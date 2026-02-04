import { BookingCheckoutPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { booking, bookingWithTokens, listing, paymentConfig } from '@/__tests__/mocks';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>('closer/contexts/auth');
  return { ...actual, useAuth: () => mockAuthContext };
});

jest.mock('closer/hooks/useBookingSmartContract', () => ({
  useBookingSmartContract: () => ({
    stakeTokens: jest.fn(() => Promise.resolve({ success: { transactionId: 'tx' }, error: null })),
    checkContract: jest.fn(() => Promise.resolve({ success: true, error: null })),
  }),
}));


describe('BookingCheckoutPage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_FEATURE_BOOKING: 'true' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('renders checkout with fiat booking', () => {
    renderWithProviders(
      <BookingCheckoutPage
        booking={booking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
      />,
    );
    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
  });

  it('renders total or payment section', () => {
    renderWithProviders(
      <BookingCheckoutPage
        booking={booking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
      />,
    );
    const totalLabels = screen.getAllByText(/Total|total/i);
    expect(totalLabels.length).toBeGreaterThan(0);
  });

  it('displays all costs in EUR when EUR (fiat) booking', () => {
    renderWithProviders(
      <BookingCheckoutPage
        booking={booking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
      />,
    );
    const totalSection = screen.getByText(/Total:/i).closest('div');
    expect(totalSection).toHaveTextContent(/€\d+\.\d{2}/);
    expect(totalSection).not.toHaveTextContent('TDF');
  });

  it('displays token staking acknowledgment checkbox for TDF token-only booking', () => {
    const tokenOnlyBooking = {
      ...bookingWithTokens,
      total: { val: 0, cur: 'EUR' as const },
      rentalToken: { cur: 'TDF' as const, val: 1 },
    };
    renderWithProviders(
      <BookingCheckoutPage
        booking={tokenOnlyBooking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
      />,
    );
    expect(
      screen.getByRole('checkbox', { name: /tokens are being staked/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/staked for 1 year/i)).toBeInTheDocument();
    expect(screen.getByText(/token refund is not currently available/i)).toBeInTheDocument();
  });

  it('enables pay button only after token staking checkbox is checked', async () => {
    const user = userEvent.setup();
    const tokenOnlyBooking = {
      ...bookingWithTokens,
      total: { val: 0, cur: 'EUR' as const },
      rentalToken: { cur: 'TDF' as const, val: 1 },
    };
    renderWithProviders(
      <BookingCheckoutPage
        booking={tokenOnlyBooking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
      />,
    );
    const payButton = screen.getByRole('button', { name: /stake|pay|confirm/i });
    expect(payButton).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', { name: /tokens are being staked/i }),
    );
    expect(payButton).toBeEnabled();
  });
});
