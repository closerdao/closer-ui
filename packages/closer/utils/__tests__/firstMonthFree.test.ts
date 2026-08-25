import { getUpdatedArray } from '../config.utils';
import {
  hasConsumedFirstMonthFree,
  isEligibleForFirstMonthFree,
  isFirstMonthFreePlan,
  isMonthlySubscriptionPlan,
  normalizeSubscriptionBillingPeriod,
} from '../subscriptions.helpers';

describe('normalizeSubscriptionBillingPeriod', () => {
  it('normalizes legacy monthly and yearly values', () => {
    expect(normalizeSubscriptionBillingPeriod('month')).toBe('month');
    expect(normalizeSubscriptionBillingPeriod('monthly')).toBe('month');
    expect(normalizeSubscriptionBillingPeriod('year')).toBe('year');
    expect(normalizeSubscriptionBillingPeriod('yearly')).toBe('year');
  });
});

describe('isFirstMonthFreePlan', () => {
  it('is true only for monthly plans with the flag', () => {
    expect(
      isFirstMonthFreePlan({
        slug: 'wanderer',
        title: 'Wanderer',
        description: '',
        priceId: 'price_1',
        tier: 1,
        price: 10,
        available: true,
        tiersAvailable: false,
        perks: '',
        billingPeriod: 'month',
        firstMonthFree: true,
      }),
    ).toBe(true);
    expect(
      isFirstMonthFreePlan({
        slug: 'wanderer',
        title: 'Wanderer',
        description: '',
        priceId: 'price_1',
        tier: 1,
        price: 120,
        available: true,
        tiersAvailable: false,
        perks: '',
        billingPeriod: 'year',
        firstMonthFree: true,
      }),
    ).toBe(false);
  });
});

describe('isMonthlySubscriptionPlan', () => {
  it('treats monthly aliases as monthly', () => {
    expect(isMonthlySubscriptionPlan({ billingPeriod: 'monthly' } as any)).toBe(
      true,
    );
  });
});

describe('isEligibleForFirstMonthFree', () => {
  const monthlyFreePlan = {
    slug: 'wanderer',
    title: 'Wanderer',
    description: '',
    priceId: 'price_1',
    tier: 1,
    price: 10,
    available: true,
    tiersAvailable: false,
    perks: '',
    billingPeriod: 'month',
    firstMonthFree: true,
  };

  it('is false after a prior Closer subscription', () => {
    expect(hasConsumedFirstMonthFree({})).toBe(false);
    expect(hasConsumedFirstMonthFree({ subscriptionId: 'sub_1' })).toBe(true);
    expect(
      hasConsumedFirstMonthFree({ introClaimedAt: new Date().toISOString() }),
    ).toBe(true);
    expect(isEligibleForFirstMonthFree(monthlyFreePlan, {})).toBe(true);
    expect(
      isEligibleForFirstMonthFree(monthlyFreePlan, {
        createdAt: new Date().toISOString(),
      }),
    ).toBe(false);
    expect(isEligibleForFirstMonthFree(monthlyFreePlan, {}, false)).toBe(false);
  });
});

describe('getUpdatedArray billingPeriod side effects', () => {
  it('clears firstMonthFree when billing period switches to year', () => {
    const updated = getUpdatedArray(
      [{ billingPeriod: 'month', firstMonthFree: true }],
      0,
      'billingPeriod-0',
      'year',
    );

    expect(updated[0]).toEqual({
      billingPeriod: 'year',
      firstMonthFree: false,
    });
  });
});
