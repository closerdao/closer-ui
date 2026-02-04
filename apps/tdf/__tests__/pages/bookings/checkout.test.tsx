import { BookingCheckoutPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import { booking, listing, paymentConfig } from '@/__tests__/mocks';
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
});
