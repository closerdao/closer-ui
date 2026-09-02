import React from 'react';

import { useRouter } from 'next/router';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CustomSubscriptionPlans from '../components/custom-pages/CustomSubscriptionPlans';
import { useAuth } from '../contexts/auth';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" the app code imports. Mock the
// real file path so the mock is the instance utils/subscriptionActions uses.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const mockPlans = [
  {
    slug: 'basic',
    title: 'Basic subscription',
    description: 'Community access',
    priceId: 'price_basic',
    tier: 0,
    price: 5,
    available: true,
    tiersAvailable: false,
    perks: 'Access to our community chat',
    billingPeriod: 'monthly',
  },
  {
    slug: 'pro',
    title: 'Pro subscription',
    description: 'Everything in basic, plus stays',
    priceId: 'price_pro',
    tier: 1,
    price: 20,
    available: true,
    tiersAvailable: false,
    perks: 'Discounted stays',
    billingPeriod: 'monthly',
  },
];

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn((slug: string) => {
    if (slug === 'subscriptions') {
      return { enabled: true, elements: mockPlans };
    }
    if (slug === 'payment') {
      return { fiatCur: 'EUR' };
    }
    return null;
  }),
}));

const mockUseAuth = useAuth as unknown as jest.Mock;
const refetchUser = jest.fn();

const setUser = (user: Record<string, unknown> | null) => {
  mockUseAuth.mockReturnValue({
    isAuthenticated: Boolean(user),
    isLoading: false,
    user,
    refetchUser,
  });
};

const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const activeSubscriber = {
  email: 'ada@example.com',
  subscription: {
    plan: 'basic',
    priceId: 'price_basic',
    validUntil: inThirtyDays.toISOString(),
    monthlyPrice: { val: 5, cur: 'EUR' },
  },
};

// next/router is mocked globally in test/jest.mocks.tsx with a jest.fn push.
const routerPush = () =>
  (useRouter as unknown as jest.Mock).mock.results[0].value.push as jest.Mock;

describe('CustomSubscriptionPlans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
  });

  describe('visitors and non-subscribers', () => {
    it('asks a logged out visitor to create an account', () => {
      setUser(null);
      renderWithNextIntl(<CustomSubscriptionPlans />);

      expect(
        screen.getAllByRole('button', { name: /create account/i }),
      ).toHaveLength(mockPlans.length);
    });

    it('sends a logged in non-subscriber to checkout', async () => {
      setUser({ email: 'ada@example.com', subscription: {} });
      renderWithNextIntl(<CustomSubscriptionPlans />);

      const buttons = screen.getAllByRole('button', { name: /^subscribe$/i });
      expect(buttons).toHaveLength(mockPlans.length);

      await userEvent.click(buttons[0]);
      expect(routerPush()).toHaveBeenCalledWith(
        '/subscriptions/checkout?priceId=price_basic',
      );
    });

    it('treats an expired subscription as no subscription', () => {
      setUser({
        ...activeSubscriber,
        subscription: {
          ...activeSubscriber.subscription,
          validUntil: '2020-01-01T00:00:00.000Z',
        },
      });
      renderWithNextIntl(<CustomSubscriptionPlans />);

      expect(
        screen.getAllByRole('button', { name: /^subscribe$/i }),
      ).toHaveLength(mockPlans.length);
      expect(screen.queryByText(/your membership/i)).toBeNull();
    });
  });

  describe('members', () => {
    beforeEach(() => {
      setUser(activeSubscriber);
      api.post.mockResolvedValue({ data: {} });
    });

    it('points at the settings page instead of managing the membership here', async () => {
      renderWithNextIntl(<CustomSubscriptionPlans />);

      expect(await screen.findByText(/you are a basic subscription member/i)).toBeTruthy();
      expect(
        screen.getByRole('link', { name: /manage subscription/i }),
      ).toHaveAttribute('href', '/settings/subscription');
      expect(
        screen.queryByRole('button', { name: /cancel membership/i }),
      ).toBeNull();
      expect(screen.queryByRole('button', { name: /^subscribe$/i })).toBeNull();
    });

    it('says the membership is expiring once it has been cancelled', async () => {
      setUser({
        ...activeSubscriber,
        subscription: {
          ...activeSubscriber.subscription,
          cancelledAt: new Date().toISOString(),
        },
      });
      renderWithNextIntl(<CustomSubscriptionPlans />);

      expect(
        await screen.findByText(/basic subscription membership is set to expire/i),
      ).toBeTruthy();
    });

    it('tells a member on an older price that they can keep it', async () => {
      setUser({
        ...activeSubscriber,
        subscription: {
          ...activeSubscriber.subscription,
          priceId: 'price_basic_2023',
        },
      });
      renderWithNextIntl(<CustomSubscriptionPlans />);

      expect(await screen.findByText(/older price for this plan/i)).toBeTruthy();
      expect(
        screen.getByRole('link', { name: /move to the current price/i }),
      ).toHaveAttribute('href', '/settings/subscription');
      // Their plan is still theirs — the table keeps marking it as current.
      expect(screen.getByText(/current plan/i)).toBeTruthy();
    });

    it('flags a plan that is no longer offered and points at the migration', async () => {
      setUser({
        ...activeSubscriber,
        subscription: {
          ...activeSubscriber.subscription,
          plan: 'founding-member',
          priceId: 'price_retired',
        },
      });
      renderWithNextIntl(<CustomSubscriptionPlans />);

      expect(await screen.findByText(/plan we no longer offer/i)).toBeTruthy();
      expect(
        screen.getByRole('link', { name: /move to a current plan/i }),
      ).toHaveAttribute('href', '/settings/subscription');
      // Still a member: no plan below is offered as a fresh subscription.
      expect(screen.queryByRole('button', { name: /^subscribe$/i })).toBeNull();
    });

    it('sends a member picking another plan to the settings page', async () => {
      renderWithNextIntl(<CustomSubscriptionPlans />);

      await userEvent.click(
        await screen.findByRole('button', { name: /manage subscription/i }),
      );

      expect(routerPush()).toHaveBeenCalledWith('/settings/subscription');
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});
