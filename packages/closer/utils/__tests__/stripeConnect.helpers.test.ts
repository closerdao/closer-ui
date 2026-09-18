import { PaymentConfig } from '../../types/api';
import {
  areSubscriptionsConnectReady,
  createStripePromise,
  getResolvedStripeConnectedAccountId,
  isCardPaymentReady,
  isStripeConnectAccountReady,
  isStripeWebhookLive,
  resolveStripeConnectBannerKind,
} from '../stripeConnect.helpers';

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(null)),
}));

type GatingCase = {
  name: string;
  config: Partial<PaymentConfig>;
  card: boolean;
  subscriptions: boolean;
};

describe('stripeConnect.helpers gating', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const gatingCases: GatingCase[] = [
    {
      name: 'no account',
      config: { cardPayment: true, webhookLive: true },
      card: false,
      subscriptions: false,
    },
    {
      name: 'account, card off, webhook live',
      config: {
        connectedAccountId: 'acct_1',
        cardPayment: false,
        webhookLive: true,
      },
      card: false,
      subscriptions: true,
    },
    {
      name: 'account, card on, webhook live',
      config: {
        connectedAccountId: 'acct_1',
        cardPayment: true,
        webhookLive: true,
      },
      card: true,
      subscriptions: true,
    },
    {
      name: 'account, card on, webhook pending',
      config: {
        connectedAccountId: 'acct_1',
        cardPayment: true,
        webhookLive: false,
      },
      card: false,
      subscriptions: false,
    },
    {
      name: 'account, card on, webhookLive undefined fails open',
      config: {
        connectedAccountId: 'acct_1',
        cardPayment: true,
      },
      card: true,
      subscriptions: true,
    },
    {
      name: 'connectStatus pending blocks even if webhookLive',
      config: {
        connectedAccountId: 'acct_1',
        cardPayment: true,
        webhookLive: true,
        connectStatus: 'pending',
      },
      card: false,
      subscriptions: false,
    },
    {
      name: 'connectStatus active allows card when webhookLive',
      config: {
        connectedAccountId: 'acct_1',
        cardPayment: true,
        webhookLive: true,
        connectStatus: 'active',
      },
      card: true,
      subscriptions: true,
    },
  ];

  it.each(gatingCases)(
    '$name',
    ({ config, card, subscriptions }: GatingCase) => {
      expect(isCardPaymentReady(config)).toBe(card);
      expect(areSubscriptionsConnectReady(config)).toBe(subscriptions);
    },
  );

  it('isStripeWebhookLive fails open when the flag is absent', () => {
    expect(isStripeWebhookLive(undefined)).toBe(true);
    expect(isStripeWebhookLive({})).toBe(true);
    expect(isStripeWebhookLive({ webhookLive: false })).toBe(false);
  });

  it('createStripePromise returns null without a resolvable account id', () => {
    process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY = 'pk_test';
    expect(createStripePromise({})).toBeNull();
    expect(getResolvedStripeConnectedAccountId({})).toBeNull();
    expect(isStripeConnectAccountReady({})).toBe(false);
  });

  it('ignores NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT', () => {
    process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT = 'acct_from_env';
    expect(
      getResolvedStripeConnectedAccountId({
        connectedAccountId: 'acct_config',
      }),
    ).toBe('acct_config');
    expect(getResolvedStripeConnectedAccountId({})).toBeNull();
  });
});

describe('resolveStripeConnectBannerKind', () => {
  it('shows failed even when no account is stored', () => {
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: 'failed',
        storedAccountId: null,
        live: null,
      }),
    ).toBe('failed');
  });

  it('ignores leftover stripeConnect query when no account is stored', () => {
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: 'pending',
        storedAccountId: null,
        live: { accountLinked: true, webhookUrlMatches: true },
      }),
    ).toBeNull();
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: 'success',
        storedAccountId: '',
        live: null,
      }),
    ).toBeNull();
  });

  it('prefers stored connectStatus over leftover query', () => {
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: 'success',
        storedAccountId: 'acct_1',
        live: { accountLinked: true, webhookUrlMatches: true },
        connectStatus: 'pending',
      }),
    ).toBe('pending');
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: 'pending',
        storedAccountId: 'acct_1',
        live: { accountLinked: true, webhookUrlMatches: false },
        connectStatus: 'active',
      }),
    ).toBe('active');
  });

  it('does not show active from a stored id until Stripe confirms the link and webhook', () => {
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: '',
        storedAccountId: 'acct_1',
        live: null,
      }),
    ).toBe('pending');
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: '',
        storedAccountId: 'acct_1',
        live: { accountLinked: false, webhookUrlMatches: false },
      }),
    ).toBe('not_linked');
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: '',
        storedAccountId: 'acct_1',
        live: { accountLinked: true, webhookUrlMatches: false },
      }),
    ).toBe('pending');
    expect(
      resolveStripeConnectBannerKind({
        stripeConnectQuery: '',
        storedAccountId: 'acct_1',
        live: { accountLinked: true, webhookUrlMatches: true },
      }),
    ).toBe('active');
  });
});
