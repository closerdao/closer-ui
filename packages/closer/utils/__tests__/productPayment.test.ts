import api from '../api';
import { confirmProductPayment, payForProduct } from '../productPayment';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    product: {
      pay: { mutate: jest.fn() },
      confirmPayment: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const product = trpc.product as unknown as {
  pay: { mutate: jest.Mock };
  confirmPayment: { mutate: jest.Mock };
};

const input = { productId: 'p1', productType: 'lesson', token: 't' };
const payment = { paymentIntent: { id: 'pi_1', status: 'succeeded' } };

beforeEach(() => jest.clearAllMocks());

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('pays and confirms through the product routes', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: payment } });
    await expect(payForProduct(input)).resolves.toBe(payment);
    await confirmProductPayment(input);
    expect(mockedApi.post.mock.calls).toEqual([
      ['/products/payment', input],
      ['/products/payment/confirmation', input],
    ]);
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('pays and confirms through the procedures', async () => {
    product.pay.mutate.mockResolvedValue(payment);
    product.confirmPayment.mutate.mockResolvedValue({ result: 'ok' });
    await expect(payForProduct(input)).resolves.toBe(payment);
    await confirmProductPayment(input);
    expect(product.pay.mutate).toHaveBeenCalledWith(input);
    expect(product.confirmPayment.mutate).toHaveBeenCalledWith(input);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a card decline with its text', async () => {
    product.pay.mutate.mockRejectedValue(new Error('Your card was declined.'));
    await expect(payForProduct(input)).rejects.toThrow(
      'Your card was declined.',
    );
  });
});
