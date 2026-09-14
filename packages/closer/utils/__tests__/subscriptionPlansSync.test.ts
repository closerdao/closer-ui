import type { SubscriptionPlan } from '../../types/subscriptions';
import api from '../api';
import { syncSubscriptionPlansWithStripe } from '../subscriptionPlansSync';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const post = api.post as jest.Mock;

const plan = (overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan =>
  ({
    slug: 'wanderer',
    title: 'Wanderer',
    description: 'A plan',
    price: 30,
    tier: 1,
    available: true,
    tiersAvailable: false,
    perks: '',
    billingPeriod: 'month',
    ...overrides,
  } as SubscriptionPlan);

const stripeError = (message: string) => ({
  response: { data: { error: message } },
});

beforeEach(() => {
  post.mockReset();
});

describe('syncSubscriptionPlansWithStripe', () => {
  it('retries without a priceId Stripe cannot find, and keeps the new one', async () => {
    const missing = 'price_1PLO0OE9CDXOM807SZXbUUEm';
    post
      .mockRejectedValueOnce(
        stripeError(
          `Stripe price "${missing}" was not found on the Stripe connected account.`,
        ),
      )
      .mockResolvedValueOnce({
        data: {
          elements: [
            plan({ priceId: 'price_new', productId: 'prod_existing' }),
          ],
        },
      });

    const result = await syncSubscriptionPlansWithStripe(
      [plan({ priceId: missing, productId: 'prod_existing' })],
      'EUR',
    );

    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[0][1].elements[0].priceId).toBe(missing);
    // The stale price is dropped on retry; the product it lives on is not.
    expect(post.mock.calls[1][1].elements[0].priceId).toBeUndefined();
    expect(post.mock.calls[1][1].elements[0].productId).toBe('prod_existing');
    expect(result[0].priceId).toBe('price_new');
  });

  it('drops a missing productId as well as the price', async () => {
    post
      .mockRejectedValueOnce(stripeError('No such product: prod_gone'))
      .mockResolvedValueOnce({
        data: { elements: [plan({ priceId: 'price_new' })] },
      });

    await syncSubscriptionPlansWithStripe(
      [plan({ priceId: 'price_ok', productId: 'prod_gone' })],
      'EUR',
    );

    expect(post.mock.calls[1][1].elements[0].productId).toBeUndefined();
    expect(post.mock.calls[1][1].elements[0].priceId).toBe('price_ok');
  });

  it('never returns a stale id when the response omits the plan', async () => {
    const missing = 'price_stale';
    post
      .mockRejectedValueOnce(stripeError(`No such price: ${missing}`))
      .mockResolvedValueOnce({ data: { elements: [] } });

    const result = await syncSubscriptionPlansWithStripe(
      [plan({ priceId: missing })],
      'EUR',
    );

    expect(result[0].priceId).toBe('');
  });

  it('does not retry on unrelated errors', async () => {
    post.mockRejectedValue(stripeError('Invalid API key provided'));

    await expect(
      syncSubscriptionPlansWithStripe([plan({ priceId: 'price_ok' })], 'EUR'),
    ).rejects.toThrow('Invalid API key provided');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('gives up when the same id keeps coming back as missing', async () => {
    post.mockRejectedValue(stripeError('No such price: price_stale'));

    await expect(
      syncSubscriptionPlansWithStripe(
        [plan({ priceId: 'price_stale' })],
        'EUR',
      ),
    ).rejects.toThrow('No such price: price_stale');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('retries without a stale couponId and merges the synced coupon', async () => {
    const missingCoupon = 'coupon_stale';
    post
      .mockRejectedValueOnce(stripeError(`No such coupon: ${missingCoupon}`))
      .mockResolvedValueOnce({
        data: {
          elements: [
            plan({
              priceId: 'price_new',
              productId: 'prod_new',
              couponId: 'coupon_new',
              firstMonthFree: true,
            }),
          ],
        },
      });

    const result = await syncSubscriptionPlansWithStripe(
      [
        plan({
          priceId: 'price_ok',
          productId: 'prod_new',
          couponId: missingCoupon,
          firstMonthFree: true,
        }),
      ],
      'EUR',
    );

    expect(post.mock.calls[1][1].elements[0].couponId).toBeUndefined();
    expect(post.mock.calls[1][1].elements[0].firstMonthFree).toBe(true);
    expect(result[0].couponId).toBe('coupon_new');
  });

  it('sends firstMonthFree and couponId in sync payload', async () => {
    post.mockResolvedValueOnce({
      data: {
        elements: [
          plan({
            priceId: 'price_new',
            couponId: 'coupon_new',
            firstMonthFree: true,
          }),
        ],
      },
    });

    await syncSubscriptionPlansWithStripe(
      [plan({ firstMonthFree: true, couponId: 'coupon_old' })],
      'EUR',
    );

    expect(post.mock.calls[0][1].elements[0]).toEqual(
      expect.objectContaining({
        firstMonthFree: true,
        couponId: 'coupon_old',
      }),
    );
  });
});
