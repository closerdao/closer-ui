import {
  booking,
  bookingWithCredits,
  bookingWithPaymentDelta,
  bookingWithTokens,
  listing,
  paymentConfig,
} from '@/__tests__/mocks';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';
import { renderWithProviders } from '@/test/utils';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingCheckoutPage } from 'closer';
import api from 'closer/utils/api';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>(
    'closer/contexts/auth',
  );
  return { ...actual, useAuth: () => mockAuthContext };
});

jest.mock('closer/utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: null } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: { headers: {} },
    setOnSessionInvalid: jest.fn(),
    refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
  },
  setOnSessionInvalid: jest.fn(),
  refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('closer/hooks/useBookingSmartContract', () => ({
  useBookingSmartContract: () => ({
    stakeTokens: jest.fn(() =>
      Promise.resolve({ success: { transactionId: 'tx' }, error: null }),
    ),
    checkContract: jest.fn(() =>
      Promise.resolve({ success: true, error: null }),
    ),
  }),
}));

describe('BookingCheckoutPage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_FEATURE_BOOKING: 'true',
      NEXT_PUBLIC_FEATURE_WEB3_BOOKING: 'true',
      NEXT_PUBLIC_FEATURE_WEB3_WALLET: 'false',
    };
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
    expect(
      screen.getByRole('heading', { name: /checkout/i }),
    ).toBeInTheDocument();
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
        tokenCurrency="TDF"
      />,
    );
    const totalSection = screen.getByText(/Total:/i).closest('div');
    expect(totalSection).toHaveTextContent(/\d+[.,]\d{2}\s*€/);
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
    expect(
      screen.getByText(/token refund is not currently available/i),
    ).toBeInTheDocument();
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
        tokenCurrency="TDF"
      />,
    );
    const payButton = screen.getByRole('button', {
      name: /stake|pay|confirm/i,
    });
    expect(payButton).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', { name: /tokens are being staked/i }),
    );
    await waitFor(() => {
      expect(payButton).toBeEnabled();
    });
  }, 10000);

  it('does not call update-payment to flip useTokens off when status is tokens-staked', async () => {
    const tokensStakedBooking = {
      ...bookingWithTokens,
      utilityFiat: { val: 24, cur: 'EUR' as const },
      rentalFiat: { val: 0, cur: 'EUR' as const },
      total: { val: 24, cur: 'EUR' as const },
      rentalToken: { cur: 'TDF' as const, val: 6 },
    };

    renderWithProviders(
      <BookingCheckoutPage
        booking={tokensStakedBooking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
        tokenCurrency="TDF"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /checkout/i }),
      ).toBeInTheDocument();
    });

    const updatePaymentCalls = (api.post as jest.Mock).mock.calls.filter(
      ([url, body]) =>
        String(url).includes('/update-payment') && body?.useTokens === false,
    );
    expect(updatePaymentCalls).toHaveLength(0);
  });

  it('does not call update-payment when status is credits-paid', async () => {
    const creditsPaidBooking = {
      ...bookingWithCredits,
      utilityFiat: { val: 24, cur: 'EUR' as const },
      rentalFiat: { val: 0, cur: 'EUR' as const },
      total: { val: 24, cur: 'EUR' as const },
    };

    renderWithProviders(
      <BookingCheckoutPage
        booking={creditsPaidBooking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /checkout/i }),
      ).toBeInTheDocument();
    });

    const updatePaymentCalls = (api.post as jest.Mock).mock.calls.filter(
      ([url]) => String(url).includes('/update-payment'),
    );
    expect(updatePaymentCalls).toHaveLength(0);
  });

  it('does not call update-payment to flip useTokens off on refresh for open token booking', async () => {
    const openTokenBooking = {
      ...booking,
      status: 'open' as const,
      useTokens: true,
      useCredits: false,
      rentalFiat: { val: 0, cur: 'EUR' as const },
      rentalToken: { val: 1.4, cur: 'TDF' as const },
      utilityFiat: { val: 28, cur: 'EUR' as const },
      total: { val: 227, cur: 'EUR' as const },
    };

    renderWithProviders(
      <BookingCheckoutPage
        booking={openTokenBooking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
        tokenCurrency="TDF"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /checkout/i }),
      ).toBeInTheDocument();
    });

    const updatePaymentCalls = (api.post as jest.Mock).mock.calls.filter(
      ([url, body]) =>
        String(url).includes('/update-payment') && body?.useTokens === false,
    );
    expect(updatePaymentCalls).toHaveLength(0);
  });

  it('shows currency switcher on open checkout', async () => {
    renderWithProviders(
      <BookingCheckoutPage
        booking={booking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
        tokenCurrency="TDF"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Euro/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /TDF/i })).toBeInTheDocument();
    });
  });

  it('hides currency switcher when status is pending-payment', async () => {
    renderWithProviders(
      <BookingCheckoutPage
        booking={bookingWithPaymentDelta}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
        tokenCurrency="TDF"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /checkout/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /Euro/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /TDF/i }),
    ).not.toBeInTheDocument();
  });

  it('shows currency switcher when status is tokens-staked', async () => {
    const tokensStakedBooking = {
      ...bookingWithTokens,
      utilityFiat: { val: 24, cur: 'EUR' as const },
      rentalFiat: { val: 0, cur: 'EUR' as const },
      total: { val: 24, cur: 'EUR' as const },
      rentalToken: { cur: 'TDF' as const, val: 6 },
    };

    renderWithProviders(
      <BookingCheckoutPage
        booking={tokensStakedBooking}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
        tokenCurrency="TDF"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Euro/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /TDF/i })).toBeInTheDocument();
    });
  });

  it('calls update-payment with useTokens when switching to TDF despite paymentDelta on open booking', async () => {
    const user = userEvent.setup();
    const bookingWithDelta = {
      ...booking,
      status: 'open' as const,
      useTokens: false,
      useCredits: false,
      paymentDelta: {
        fiat: { val: 24, cur: 'EUR' as const },
        token: { val: 0, cur: 'TDF' as const },
      },
      rentalToken: { val: 6, cur: 'TDF' as const },
      rentalFiat: { val: 210, cur: 'EUR' as const },
    };

    (api.post as jest.Mock).mockImplementation((url: string, body: unknown) => {
      if (String(url).includes('/update-payment')) {
        return Promise.resolve({
          data: {
            results: {
              ...bookingWithDelta,
              useTokens: true,
              rentalFiat: { val: 0, cur: 'EUR' },
            },
          },
        });
      }
      return Promise.resolve({ data: { results: null } });
    });

    renderWithProviders(
      <BookingCheckoutPage
        booking={bookingWithDelta}
        listing={listing}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
        event={null}
        tokenCurrency="TDF"
      />,
    );

    await user.click(screen.getByRole('button', { name: /TDF/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/update-payment'),
        expect.objectContaining({ useTokens: true }),
      );
    });
  });
});
