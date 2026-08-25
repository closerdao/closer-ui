import { getSubscriptionSuccessUrl } from '../subscriptions.helpers';

describe('getSubscriptionSuccessUrl', () => {
  it('returns the default success page with subscription and price params', () => {
    expect(
      getSubscriptionSuccessUrl(undefined, {
        subscriptionId: 'sub_123',
        priceId: 'price_456',
      }),
    ).toBe('/subscriptions/success?subscriptionId=sub_123&priceId=price_456');
  });

  it('returns the default success page with only a priceId (free plan flow)', () => {
    expect(getSubscriptionSuccessUrl('', { priceId: 'price_456' })).toBe(
      '/subscriptions/success?priceId=price_456',
    );
  });

  it('returns the default success page without params when none are given', () => {
    expect(getSubscriptionSuccessUrl(null)).toBe('/subscriptions/success');
  });

  it('returns the configured success page when set', () => {
    expect(
      getSubscriptionSuccessUrl('/village/launch', {
        subscriptionId: 'sub_123',
        priceId: 'price_456',
      }),
    ).toBe('/village/launch');
  });

  it('ignores a whitespace-only configured success page', () => {
    expect(getSubscriptionSuccessUrl('   ', { priceId: 'price_456' })).toBe(
      '/subscriptions/success?priceId=price_456',
    );
  });

  it('trims the configured success page', () => {
    expect(getSubscriptionSuccessUrl(' /village/launch ')).toBe(
      '/village/launch',
    );
  });
});
