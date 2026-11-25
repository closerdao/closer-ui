import api from '../api';
import {
  checkoutStay,
  confirmStayCheckout,
  getStayStripeIntents,
  settleStayStripe,
} from '../stays.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    stay: {
      checkout: { mutate: jest.fn() },
      confirmCheckout: { mutate: jest.fn() },
      stripeIntents: { query: jest.fn() },
      settleStripe: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const stay = trpc.stay as unknown as Record<
  string,
  { query?: jest.Mock; mutate?: jest.Mock }
>;

beforeEach(() => jest.clearAllMocks());

describe('on the legacy API', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({
      data: { results: { intents: [{ id: 'pi_1' }] } },
    });
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 's1' } } },
    });
  });

  it('calls the stay checkout routes', async () => {
    await checkoutStay('s1', ' pm_1 ');
    await checkoutStay('s1');
    await confirmStayCheckout('s1', 'pi_1');
    await expect(getStayStripeIntents('s1')).resolves.toEqual([{ id: 'pi_1' }]);
    await expect(settleStayStripe('s1', 'stuck')).resolves.toEqual({
      _id: 's1',
    });
    expect(mockedApi.post.mock.calls).toEqual([
      ['/stays/s1/checkout', { paymentMethod: 'pm_1' }],
      ['/stays/s1/checkout', {}],
      ['/stays/s1/checkout/confirm', { paymentIntentId: 'pi_1' }],
      ['/stays/s1/admin/settle-stripe', { reason: 'stuck' }],
    ]);
    expect(stay.checkout.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('calls the stay checkout procedures', async () => {
    stay.checkout.mutate!.mockResolvedValue({ settled: false });
    stay.confirmCheckout.mutate!.mockResolvedValue({ _id: 's1' });
    stay.stripeIntents.query!.mockResolvedValue({
      status: 'paid',
      intents: [{ id: 'pi_1' }],
      truncated: false,
    });
    stay.settleStripe.mutate!.mockResolvedValue({ booking: { _id: 's1' } });

    await checkoutStay('s1', ' pm_1 ');
    await checkoutStay('s1');
    await expect(confirmStayCheckout('s1', 'pi_1')).resolves.toEqual({
      _id: 's1',
    });
    await expect(getStayStripeIntents('s1')).resolves.toEqual([{ id: 'pi_1' }]);
    await expect(settleStayStripe('s1', 'stuck')).resolves.toEqual({
      _id: 's1',
    });

    expect(stay.checkout.mutate!.mock.calls).toEqual([
      [{ id: 's1', paymentMethod: 'pm_1' }],
      [{ id: 's1' }],
    ]);
    expect(stay.confirmCheckout.mutate).toHaveBeenCalledWith({
      id: 's1',
      paymentIntentId: 'pi_1',
    });
    expect(stay.stripeIntents.query).toHaveBeenCalledWith({ id: 's1' });
    expect(stay.settleStripe.mutate).toHaveBeenCalledWith({
      id: 's1',
      reason: 'stuck',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
