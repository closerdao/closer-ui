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

// Rejecting api.post for a whole test also fails the metric the page posts on
// mount, which logs. That log is part of the case under test, not a surprise.
let consoleError: jest.SpyInstance | null = null;
const expectFailureLogs = () => {
  consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
};

describe('SubscriptionSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
    api.post.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    consoleError?.mockRestore();
    consoleError = null;
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

  describe('on an older price of a plan that still exists', () => {
    // The slug still matches a configured plan; the priceId does not, because
    // the plan's price was edited after they subscribed.
    const legacyPricedSubscriber = {
      ...activeSubscriber,
      subscription: {
        ...activeSubscriber.subscription,
        priceId: 'price_basic_2023',
        monthlyPrice: { val: 3, cur: 'EUR' },
      },
    };

    it('offers the current price without pushing them off the old one', async () => {
      setUser(legacyPricedSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      expect(await screen.findByText(/older price for this plan/i)).toBeTruthy();
      expect(screen.getByText(/keep it for as long as you like/i)).toBeTruthy();
      // Their own plan is still recognised, so this is not the retired-plan case.
      expect(screen.queryByText(/plan we no longer offer/i)).toBeNull();
      expect(screen.getByText(/basic subscription/i)).toBeTruthy();
    });

    it('shows what they actually pay, not the new price of the plan', async () => {
      setUser(legacyPricedSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      // 3 is their subscription; 5 is what the plan sells for today and
      // belongs in the offer, not in the headline.
      // Locale-agnostic: '3,00 €' (pt-PT) or '€3.00' (the neutral en-US
      // default now that schema defaults carry no country, #946).
      expect(await screen.findByText(/^[€$]?\s?3[.,]00/)).toBeTruthy();
      expect(
        screen.getByText(/this plan is now [€$]?\s?5[.,]00/i),
      ).toBeTruthy();
    });

    it('moves them to the current price of the same plan', async () => {
      setUser(legacyPricedSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      await userEvent.click(
        await screen.findByRole('button', {
          name: /move to the current price/i,
        }),
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/stripe/change-subscription', {
          priceId: 'price_basic',
        });
      });
    });

    it('says nothing when the plan carries the old price too', async () => {
      // A plan listing several prices keeps earlier subscribers matched.
      mockPlans[0].priceId = 'price_basic,price_basic_2023';
      setUser(legacyPricedSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      expect(
        await screen.findByRole('button', { name: /^change plan$/i }),
      ).toBeTruthy();
      expect(screen.queryByText(/older price for this plan/i)).toBeNull();
      mockPlans[0].priceId = 'price_basic';
    });
  });

  describe('on a plan that is no longer offered', () => {
    // Neither the priceId nor the plan slug matches anything in the config —
    // the plan was retired, renamed, or its Stripe price was rotated.
    const deprecatedSubscriber = {
      ...activeSubscriber,
      subscription: {
        ...activeSubscriber.subscription,
        plan: 'founding-member',
        priceId: 'price_retired',
      },
    };

    it('says the plan is deprecated and offers the migration', async () => {
      setUser(deprecatedSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      expect(
        await screen.findByText(/plan we no longer offer/i),
      ).toBeTruthy();
      // The membership itself is untouched, so cancelling stays available.
      expect(
        screen.getByRole('button', { name: /cancel membership/i }),
      ).toBeTruthy();
      // One route out, not two competing buttons.
      expect(screen.queryByRole('button', { name: /^change plan$/i })).toBeNull();
    });

    it('migrates to a current plan', async () => {
      setUser(deprecatedSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      await userEvent.click(
        await screen.findByRole('button', { name: /move to a current plan/i }),
      );
      // Every configured plan is on offer, since none of them is theirs.
      await userEvent.click(screen.getByRole('button', { name: /^upgrade$/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/stripe/change-subscription', {
          priceId: 'price_pro',
        });
      });
    });

    it('leaves a matched plan alone', async () => {
      setUser(activeSubscriber);
      renderWithNextIntl(<SubscriptionSettings />);

      expect(
        await screen.findByRole('button', { name: /^change plan$/i }),
      ).toBeTruthy();
      expect(screen.queryByText(/plan we no longer offer/i)).toBeNull();
    });
  });

  it('falls back to the Stripe portal when the backend has no endpoint yet', async () => {
    setUser(activeSubscriber);
    expectFailureLogs();
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
    expectFailureLogs();
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
