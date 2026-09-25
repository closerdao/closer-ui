import type { Stripe } from '@stripe/stripe-js';

import api from '../api';
import { checkoutStayWithStripe } from '../stayStripeCheckout';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };

const CHECKOUT = '/stays/stay_1/checkout';
const CONFIRM = '/stays/stay_1/checkout/confirm';

const checkoutReply = (
  paymentIntent: { id: string; status: string; client_secret?: string } | null,
  extra: Record<string, unknown> = {},
) => ({
  data: {
    results: {
      paymentIntent,
      fiatAmount: 100,
      tokensAmount: 0,
      creditsSpent: 0,
      needsTokenStake: false,
      ...extra,
    },
  },
});

const httpError = (status: number, error = 'nope') =>
  Object.assign(new Error(error), { response: { status, data: { error } } });

const stayWithStatus = (status: string) => ({
  data: { results: { _id: 'stay_1', status } },
});

const stripeReturning = (result: unknown) =>
  ({
    confirmCardPayment: jest.fn().mockResolvedValue(result),
  }) as unknown as Stripe & { confirmCardPayment: jest.Mock };

const routePosts = (
  checkout: () => Promise<unknown>,
  confirm: () => Promise<unknown> = () => Promise.resolve({ data: {} }),
) =>
  mockedApi.post.mockImplementation((url: string) =>
    url === CHECKOUT ? checkout() : confirm(),
  );

const confirmCalls = () =>
  mockedApi.post.mock.calls.filter(([url]) => url === CONFIRM);

const run = (stripe: Stripe | null = null) =>
  checkoutStayWithStripe({
    stayId: 'stay_1',
    paymentMethodId: 'pm_1',
    stripe,
  });

describe('checkoutStayWithStripe', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApi.get.mockResolvedValue(stayWithStatus('pending-payment'));
  });

  it('skips /confirm when the server settled inline', async () => {
    routePosts(() =>
      Promise.resolve(
        checkoutReply({ id: 'pi_1', status: 'succeeded' }, { settled: true }),
      ),
    );

    expect(await run()).toMatchObject({ status: 'ok' });
    expect(confirmCalls()).toHaveLength(0);
  });

  it('confirms a succeeded intent', async () => {
    routePosts(() =>
      Promise.resolve(checkoutReply({ id: 'pi_1', status: 'succeeded' })),
    );

    expect(await run()).toMatchObject({ status: 'ok' });
    expect(confirmCalls()).toEqual([[CONFIRM, { paymentIntentId: 'pi_1' }]]);
  });

  it('still confirms a processing intent and reports it finalising', async () => {
    routePosts(
      () =>
        Promise.resolve(checkoutReply({ id: 'pi_1', status: 'processing' })),
      () => Promise.reject(httpError(400)),
    );

    expect(await run()).toEqual({ status: 'finalising' });
    expect(confirmCalls()).toHaveLength(1);
  });

  it('still confirms after a 3DS result that is not succeeded', async () => {
    routePosts(
      () =>
        Promise.resolve(
          checkoutReply({
            id: 'pi_1',
            status: 'requires_action',
            client_secret: 'secret_1',
          }),
        ),
      () => Promise.reject(httpError(400)),
    );
    const stripe = stripeReturning({
      paymentIntent: { id: 'pi_1', status: 'processing' },
    });

    expect(await run(stripe)).toEqual({ status: 'finalising' });
    expect(stripe.confirmCardPayment).toHaveBeenCalledWith('secret_1', {
      payment_method: 'pm_1',
    });
    expect(confirmCalls()).toHaveLength(1);
  });

  it('confirms after a declined 3DS and shows the decline', async () => {
    routePosts(
      () =>
        Promise.resolve(
          checkoutReply({
            id: 'pi_1',
            status: 'requires_action',
            client_secret: 'secret_1',
          }),
        ),
      () => Promise.reject(httpError(400)),
    );
    const stripe = stripeReturning({
      error: {
        message: 'Your card was declined.',
        payment_intent: { status: 'requires_payment_method' },
      },
    });

    expect(await run(stripe)).toEqual({
      status: 'failed',
      message: 'Your card was declined.',
    });
    expect(confirmCalls()).toHaveLength(1);
  });

  it('still confirms when Stripe.js throws during 3DS', async () => {
    routePosts(() =>
      Promise.resolve(
        checkoutReply({
          id: 'pi_1',
          status: 'requires_action',
          client_secret: 'secret_1',
        }),
      ),
    );
    const stripe = {
      confirmCardPayment: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as Stripe;

    expect(await run(stripe)).toMatchObject({ status: 'ok' });
    expect(confirmCalls()).toHaveLength(1);
  });

  it('shows success when /confirm fails but the stay is paid', async () => {
    routePosts(
      () => Promise.resolve(checkoutReply({ id: 'pi_1', status: 'succeeded' })),
      () => Promise.reject(new Error('Network Error')),
    );
    mockedApi.get.mockResolvedValue(stayWithStatus('paid'));

    expect(await run()).toMatchObject({ status: 'ok' });
  });

  it('reports finalising when /confirm fails on a succeeded intent', async () => {
    routePosts(
      () => Promise.resolve(checkoutReply({ id: 'pi_1', status: 'succeeded' })),
      () => Promise.reject(new Error('Network Error')),
    );

    expect(await run()).toEqual({ status: 'finalising' });
  });

  it('shows success when /checkout throws but the stay is paid', async () => {
    routePosts(() => Promise.reject(new Error('Network Error')));
    mockedApi.get.mockResolvedValue(stayWithStatus('paid'));

    expect(await run()).toEqual({ status: 'ok', checkout: null });
    expect(mockedApi.get).toHaveBeenCalledWith('/stays/stay_1', {
      cache: false,
    });
  });

  it('shows the error when /checkout throws and the stay is unpaid', async () => {
    routePosts(() => Promise.reject(httpError(400, 'Insufficient credits')));

    expect(await run()).toEqual({
      status: 'failed',
      message: 'Insufficient credits',
    });
  });

  it.each([409, 503])(
    'reports finalising when /checkout answers %s',
    async (status) => {
      routePosts(() => Promise.reject(httpError(status)));

      expect(await run()).toEqual({ status: 'finalising' });
    },
  );

  it('reports finalising when /confirm answers 503', async () => {
    routePosts(
      () =>
        Promise.resolve(
          checkoutReply({ id: 'pi_1', status: 'requires_payment_method' }),
        ),
      () => Promise.reject(httpError(503)),
    );

    expect(await run()).toEqual({ status: 'finalising' });
  });
});
