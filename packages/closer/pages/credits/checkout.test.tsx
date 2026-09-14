import { useRouter } from 'next/router';

import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import CheckoutPage from './checkout';

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('../../components/CreditsCheckoutForm', () => ({
  __esModule: true,
  default: ({ credits, total }: { credits: number; total: number }) => (
    <div data-testid="card-form">{`card:${credits}:${total}`}</div>
  ),
}));

jest.mock('../../components/CreditsCryptoPayment', () => ({
  __esModule: true,
  default: ({ credits }: { credits: number }) => (
    <div data-testid="crypto-form">{`crypto:${credits}`}</div>
  ),
}));

let mockAuth: Record<string, unknown> = {
  isAuthenticated: true,
  isLoading: false,
  user: { email: 'a@b.co' },
};

jest.mock('../../contexts/auth', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('../../components/CreditsListingPreview', () => ({
  __esModule: true,
  default: ({ credits }: { credits: number }) => (
    <div data-testid="listing-preview">{`nights:${credits}`}</div>
  ),
}));

let cachedConfigs: Record<string, any> = {};
let savedConfigs: Record<string, any> = {};

jest.mock('../../utils/cachedConfig.helpers', () => ({
  getCachedConfig: (slug: string) => cachedConfigs[slug] ?? null,
  getSavedConfig: (slug: string) => savedConfigs[slug] ?? null,
}));

let push: jest.Mock;

const setQuery = (query: Record<string, string>) => {
  push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({
    query,
    asPath: '/credits/checkout?amount=3',
    isReady: true,
    push,
    replace: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  });
};

const enabledCredit = (overrides: Record<string, unknown> = {}) => ({
  enabled: true,
  creditPricePerUnit: 30,
  minPurchase: 1,
  maxPurchase: 100,
  ...overrides,
});

const amountInput = () =>
  screen.getByLabelText('Number of credits') as HTMLInputElement;

describe('credit checkout', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_CARROTS = 'true';
    mockAuth = {
      isAuthenticated: true,
      isLoading: false,
      user: { email: 'a@b.co' },
    };
    cachedConfigs = {
      credit: enabledCredit(),
      payment: { enabled: true },
    };
    savedConfigs = { credit: { creditPricePerUnit: 30 } };
    setQuery({ amount: '3' });
  });

  it('prices the amount asked for in the URL', () => {
    renderWithNextIntl(<CheckoutPage />);

    expect(amountInput().value).toBe('3');
    expect(screen.getByTestId('card-form')).toHaveTextContent('card:3:90');
  });

  it('clamps an out-of-range URL amount to the configured maximum', () => {
    cachedConfigs.credit = enabledCredit({ maxPurchase: 5 });
    setQuery({ amount: '900' });

    renderWithNextIntl(<CheckoutPage />);

    expect(amountInput().value).toBe('5');
  });

  it('reprices as the buyer steps the amount up', async () => {
    renderWithNextIntl(<CheckoutPage />);

    await userEvent.click(
      screen.getByRole('button', { name: 'One credit more' }),
    );

    expect(amountInput().value).toBe('4');
    expect(screen.getByTestId('card-form')).toHaveTextContent('card:4:120');
  });

  it('will not step below the configured minimum', async () => {
    cachedConfigs.credit = enabledCredit({ minPurchase: 3 });
    renderWithNextIntl(<CheckoutPage />);

    expect(
      screen.getByRole('button', { name: 'One credit fewer' }),
    ).toBeDisabled();
  });

  it('selects a configured bundle and shows its free credits', async () => {
    cachedConfigs.credit = enabledCredit({
      packages: [{ title: 'Week', credits: 7, bonusCredits: 1 }],
    });
    renderWithNextIntl(<CheckoutPage />);

    await userEvent.click(screen.getByRole('button', { name: /Week/ }));

    expect(amountInput().value).toBe('7');
    expect(screen.getByText('+1 free')).toBeInTheDocument();
    // The bonus is free: the charge is still 7 x 30.
    expect(screen.getByTestId('card-form')).toHaveTextContent('card:7:210');
  });

  it('offers crypto only when the village allows it', async () => {
    renderWithNextIntl(<CheckoutPage />);
    expect(screen.queryByRole('tab', { name: 'Pay with crypto' })).toBeNull();
  });

  it('switches to the stablecoin form on the crypto tab', async () => {
    cachedConfigs.credit = enabledCredit({ allowCryptoPayment: true });
    renderWithNextIntl(<CheckoutPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Pay with crypto' }));

    expect(screen.getByTestId('crypto-form')).toHaveTextContent('crypto:3');
    expect(screen.queryByTestId('card-form')).toBeNull();
  });

  it('keeps selling in crypto when card payments are switched off', () => {
    cachedConfigs.credit = enabledCredit({ allowCryptoPayment: true });
    cachedConfigs.payment = { enabled: false };

    renderWithNextIntl(<CheckoutPage />);

    expect(screen.getByRole('tab', { name: 'Pay with crypto' })).toBeInTheDocument();
    expect(screen.queryByTestId('card-form')).toBeNull();
  });

  it('waits for the session to load before bouncing to signup', () => {
    // `isAuthenticated` is false for the whole first render while the cookie
    // is being read; redirecting on it signed members out of their own
    // checkout.
    mockAuth = { isAuthenticated: false, isLoading: true, user: null };

    renderWithNextIntl(<CheckoutPage />);

    expect(push).not.toHaveBeenCalled();
  });

  it('sends a genuinely signed-out visitor to signup', () => {
    mockAuth = { isAuthenticated: false, isLoading: false, user: null };

    renderWithNextIntl(<CheckoutPage />);

    expect(push).toHaveBeenCalledWith(
      '/signup?back=/credits/checkout?amount=3',
    );
  });

  it('takes the volume discount off the total the buyer pays', async () => {
    cachedConfigs.credit = enabledCredit({
      volumeDiscounts: [{ minCredits: 5, discountPercent: 20 }],
    });
    renderWithNextIntl(<CheckoutPage />);

    // 3 credits is below the tier: full price.
    expect(screen.getByTestId('card-form')).toHaveTextContent('card:3:90');

    await userEvent.click(
      screen.getByRole('button', { name: '🥕 5+ → −20%' }),
    );

    // 5 x 30 = 150, less 20%.
    expect(screen.getByText('Volume discount (−20%)')).toBeInTheDocument();
    expect(screen.getByTestId('card-form')).toHaveTextContent('card:5:120');
  });

  it('shows no bundles when the village authored none', () => {
    renderWithNextIntl(<CheckoutPage />);

    expect(screen.queryByRole('button', { name: /^🥕 \d+$/ })).toBeNull();
    // The stepper is still there to buy with.
    expect(amountInput().value).toBe('3');
  });

  it('prices what the credits are worth, bonus included', async () => {
    cachedConfigs.credit = enabledCredit({
      packages: [{ title: 'Week', credits: 7, bonusCredits: 1 }],
    });
    renderWithNextIntl(<CheckoutPage />);

    await userEvent.click(screen.getByRole('button', { name: /Week/ }));

    expect(screen.getByTestId('listing-preview')).toHaveTextContent(
      'nights:8',
    );
  });

  it('makes an unreachable tier selectable when bundles are authored', async () => {
    // The village's only bundle is 15 credits, but the discounts start at 20:
    // without the chips a buyer would have to find the tier with the slider.
    cachedConfigs.credit = enabledCredit({
      packages: [{ title: 'A month stay', credits: 15 }],
      volumeDiscounts: [{ minCredits: 20, discountPercent: 20 }],
    });
    renderWithNextIntl(<CheckoutPage />);

    await userEvent.click(
      screen.getByRole('button', { name: '🥕 20+ → −20%' }),
    );

    expect(amountInput().value).toBe('20');
    // 20 x 30 = 600, less 20%.
    expect(screen.getByTestId('card-form')).toHaveTextContent('card:20:480');
  });

  it('shows no tier chips when the village configured none', () => {
    renderWithNextIntl(<CheckoutPage />);
    expect(screen.queryByText('Buy more, save more:')).toBeNull();
  });

  it('is not found when the village does not sell credits', () => {
    cachedConfigs.credit = { enabled: false };
    cachedConfigs.fundraiser = { enabled: false };

    renderWithNextIntl(<CheckoutPage />);

    expect(screen.queryByLabelText('Number of credits')).toBeNull();
    expect(screen.queryByTestId('card-form')).toBeNull();
  });
});
