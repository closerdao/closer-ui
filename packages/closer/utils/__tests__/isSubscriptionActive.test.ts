/**
 * Every user carries a `subscription` object, free tier included, so the guards
 * on the subscription funnel have to tell a paying member apart from a user who
 * has never paid. Getting this wrong bounces a would-be subscriber straight out
 * of checkout.
 */
import { isSubscriptionActive } from '../subscriptions.helpers';

const inThirtyDays = new Date(
  Date.now() + 30 * 24 * 60 * 60 * 1000,
).toISOString();
const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

describe('isSubscriptionActive', () => {
  it('is true for a paid membership that has not run out', () => {
    expect(
      isSubscriptionActive({
        plan: 'pro',
        priceId: 'price_pro',
        validUntil: inThirtyDays,
      }),
    ).toBe(true);
  });

  it('is false for the free tier, so a free user can start checkout', () => {
    expect(
      isSubscriptionActive({
        plan: 'free',
        priceId: 'free',
        validUntil: inThirtyDays,
      }),
    ).toBe(false);
  });

  it('is false once the paid period has passed', () => {
    expect(
      isSubscriptionActive({
        plan: 'pro',
        priceId: 'price_pro',
        validUntil: lastYear,
      }),
    ).toBe(false);
  });

  it('is false when there is no expiry to go on', () => {
    expect(isSubscriptionActive({ plan: 'pro', priceId: 'price_pro' })).toBe(
      false,
    );
  });

  it('is false for a missing, empty or plan-less subscription', () => {
    expect(isSubscriptionActive(undefined)).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
    expect(isSubscriptionActive({})).toBe(false);
    expect(
      isSubscriptionActive({ priceId: 'price_pro', validUntil: inThirtyDays }),
    ).toBe(false);
    expect(
      isSubscriptionActive({
        plan: 'pro',
        priceId: '   ',
        validUntil: inThirtyDays,
      }),
    ).toBe(false);
  });
});
