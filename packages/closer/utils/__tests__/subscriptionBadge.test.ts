/**
 * The badge sits next to avatars all over the app, so it has to be safe to
 * render for any user: no membership, an expired one, or a plan the admin never
 * gave a badge all have to come back as "nothing to show".
 */
import { SubscriptionsConfig } from '../../types/subscriptions';
import { resolveSubscriptionBadge } from '../subscriptions.helpers';

const inThirtyDays = new Date(
  Date.now() + 30 * 24 * 60 * 60 * 1000,
).toISOString();
const lastYear = new Date(
  Date.now() - 365 * 24 * 60 * 60 * 1000,
).toISOString();

const config = {
  enabled: true,
  elements: [
    {
      slug: 'basic',
      title: 'Basic subscription',
      emoji: '🔥',
      description: '',
      priceId: 'price_basic',
      tier: 0,
      price: 5,
      available: true,
      tiersAvailable: false,
      perks: '',
      billingPeriod: 'monthly',
    },
    {
      slug: 'pro',
      title: 'Pro subscription',
      emoji: '🐏',
      badge: 'https://cdn.example.com/pro-badge.png',
      description: '',
      priceId: 'price_pro,price_pro_yearly',
      tier: 1,
      price: 20,
      available: true,
      tiersAvailable: false,
      perks: '',
      billingPeriod: 'monthly',
    },
  ],
} as SubscriptionsConfig;

const member = {
  plan: 'basic',
  priceId: 'price_basic',
  validUntil: inThirtyDays,
};

describe('resolveSubscriptionBadge', () => {
  it('falls back to the plan emoji when no badge image is uploaded', () => {
    expect(resolveSubscriptionBadge(member, config)).toEqual({
      imageUrl: null,
      label: '🔥',
      title: 'Basic subscription',
    });
  });

  it('prefers the uploaded badge image over the emoji', () => {
    expect(
      resolveSubscriptionBadge(
        { plan: 'pro', priceId: 'price_pro', validUntil: inThirtyDays },
        config,
      ),
    ).toEqual({
      imageUrl: 'https://cdn.example.com/pro-badge.png',
      label: '🐏',
      title: 'Pro subscription',
    });
  });

  it('matches a plan that lists several prices', () => {
    expect(
      resolveSubscriptionBadge(
        { plan: 'pro', priceId: 'price_pro_yearly', validUntil: inThirtyDays },
        config,
      )?.imageUrl,
    ).toBe('https://cdn.example.com/pro-badge.png');
  });

  it('shows the image for a plan with no emoji at all', () => {
    const imageOnly = {
      ...config,
      elements: [{ ...config.elements[1], emoji: '' }],
    };
    expect(
      resolveSubscriptionBadge(
        { plan: 'pro', priceId: 'price_pro', validUntil: inThirtyDays },
        imageOnly,
      ),
    ).toEqual({
      imageUrl: 'https://cdn.example.com/pro-badge.png',
      label: '',
      title: 'Pro subscription',
    });
  });

  it('still shows for a cancelled membership that has not expired', () => {
    expect(resolveSubscriptionBadge(member, config)).toBeTruthy();
  });

  it('shows nothing once the membership has expired', () => {
    expect(
      resolveSubscriptionBadge({ ...member, validUntil: lastYear }, config),
    ).toBeNull();
  });

  it('shows nothing for a member without a subscription', () => {
    expect(resolveSubscriptionBadge(undefined, config)).toBeNull();
    expect(resolveSubscriptionBadge({}, config)).toBeNull();
    expect(
      resolveSubscriptionBadge(
        { plan: 'free', priceId: 'free', validUntil: inThirtyDays },
        config,
      ),
    ).toBeNull();
  });

  it('shows nothing when badges are turned off in config', () => {
    expect(
      resolveSubscriptionBadge(member, { ...config, showBadges: false }),
    ).toBeNull();
    expect(
      resolveSubscriptionBadge(member, { ...config, enabled: false }),
    ).toBeNull();
    expect(resolveSubscriptionBadge(member, null)).toBeNull();
  });

  it('shows nothing when the matched plan has neither badge nor emoji', () => {
    const noEmoji = {
      ...config,
      elements: [{ ...config.elements[0], emoji: '' }],
    };
    expect(resolveSubscriptionBadge(member, noEmoji)).toBeNull();
  });
});
