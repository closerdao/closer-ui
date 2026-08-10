import React from 'react';

import { useRouter } from 'next/router';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import SubscriptionSettings from '../components/SubscriptionSettings';
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

const cancelledSubscriber = {
  ...activeSubscriber,
  subscription: {
    ...activeSubscriber.subscription,
    cancelledAt: new Date().toISOString(),
  },
};

// next/router is mocked globally in test/jest.mocks.tsx with a jest.fn push.
const routerPush = () =>
  (useRouter as unknown as jest.Mock).mock.results[0].value.push as jest.Mock;

describe('SubscriptionSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
    api.post.mockResolvedValue({ data: {} });
  });

  it('points a member without a subscription at the plans', async () => {
    setUser({ email: 'ada@example.com', subscription: {} });
    renderWithNextIntl(<SubscriptionSettings />);

    expect(
      await screen.findByText(/you do not have a membership yet/i),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /see plans/i })).toHaveAttribute(
      'href',
      '/subscriptions',
    );
  });

  it('cancels in place after confirmation', async () => {
    setUser(activeSubscriber);
    renderWithNextIntl(<SubscriptionSettings />);

    await userEvent.click(
      await screen.findByRole('button', { name: /cancel membership/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/stripe/cancel-subscription', {
        atPeriodEnd: true,
      });
    });
    expect(refetchUser).toHaveBeenCalled();
  });

  it('switches plan in place instead of starting a checkout', async () => {
    setUser(activeSubscriber);
    renderWithNextIntl(<SubscriptionSettings />);

    await userEvent.click(
      await screen.findByRole('button', { name: /change plan/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^upgrade$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/stripe/change-subscription', {
        priceId: 'price_pro',
      });
    });
    expect(routerPush()).not.toHaveBeenCalled();
  });

  describe('after cancelling', () => {
    beforeEach(() => setUser(cancelledSubscriber));

    it('shows the expiry date and drops the cancel button', async () => {
      renderWithNextIntl(<SubscriptionSettings />);

      expect(await screen.findByText(/expires on/i)).toBeTruthy();
      expect(screen.queryByText(/renews on/i)).toBeNull();
      expect(
        screen.queryByRole('button', { name: /cancel membership/i }),
      ).toBeNull();
    });

    it('resumes the membership', async () => {
      renderWithNextIntl(<SubscriptionSettings />);

      await userEvent.click(
        await screen.findByRole('button', { name: /resume membership/i }),
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/stripe/resume-subscription');
      });
    });

    it('renews the membership when switching to another plan', async () => {
      renderWithNextIntl(<SubscriptionSettings />);

      await userEvent.click(
        await screen.findByRole('button', { name: /change plan/i }),
      );
      await userEvent.click(screen.getByRole('button', { name: /^upgrade$/i }));

      // Resume first: switching plans means the member is staying, and a
      // failure part way through then leaves the subscription untouched.
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/stripe/resume-subscription');
      });
      expect(api.post).toHaveBeenCalledWith('/stripe/change-subscription', {
        priceId: 'price_pro',
      });
      expect(
        api.post.mock.calls
          .map((call) => call[0])
          .filter((url: string) => url.startsWith('/stripe/')),
      ).toEqual([
        '/stripe/resume-subscription',
        '/stripe/change-subscription',
      ]);
    });
  });

  it('falls back to the Stripe portal when the backend has no endpoint yet', async () => {
    setUser(activeSubscriber);
    api.post.mockRejectedValue({ response: { status: 404 } });
    api.get.mockResolvedValue({
      data: { sessionUrl: 'https://billing.stripe.com/session' },
    });

    renderWithNextIntl(<SubscriptionSettings />);

    await userEvent.click(
      await screen.findByRole('button', { name: /cancel membership/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/stripe/create-customer-portal?email=ada%40example.com',
      );
    });
    expect(routerPush()).toHaveBeenCalledWith(
      'https://billing.stripe.com/session',
    );
  });

  it('surfaces a real backend failure without leaving the page', async () => {
    setUser(activeSubscriber);
    api.post.mockRejectedValue({
      response: { status: 500, data: { error: 'Stripe is unhappy' } },
    });

    renderWithNextIntl(<SubscriptionSettings />);

    await userEvent.click(
      await screen.findByRole('button', { name: /cancel membership/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/stripe is unhappy/i)).toBeTruthy();
  });
});
