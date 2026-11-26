import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  confirmSaleCard,
  confirmSaleCrypto,
  confirmTokenSale,
  countSales,
  createManualSale,
  fetchSales,
  initSale,
  loadSaleCount,
  loadSales,
  matchSaleBuyer,
  sumSales,
  toSaleFilterInput,
} from '../sales';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  formatSearch: JSON.stringify,
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    sale: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      sum: { query: jest.fn() },
      createManual: { mutate: jest.fn() },
      matchBuyer: { mutate: jest.fn() },
      init: { mutate: jest.fn() },
      confirmCard: { mutate: jest.fn() },
      confirmCrypto: { mutate: jest.fn() },
      confirmTokenSale: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<'get' | 'post', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const sale = trpc.sale as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;

const tokensPaid = {
  $and: [
    { product_type: { $in: ['token', 'tokens'] } },
    { status: 'paid' },
    { created: { $gte: '2026-01-01' } },
  ],
};

const manual = {
  userId: 'u1',
  product_type: 'tokens',
  quantity: 2,
  total_price: 10,
  paymentMethod: 'bank',
  status: 'paid',
  createCharge: true,
};

const init = { type: 'token', paymentMethod: 'bank', quantity: 3 };

const store = () => ({
  sale: { get: jest.fn(), getCount: jest.fn() },
});

beforeEach(() => jest.clearAllMocks());

describe('toSaleFilterInput', () => {
  it('maps every where the UI sends', () => {
    expect(toSaleFilterInput(tokensPaid)).toEqual({
      productTypes: ['token', 'tokens'],
      statuses: ['paid'],
      createdFrom: '2026-01-01',
    });
    expect(
      toSaleFilterInput({
        product_type: { $nin: ['token', 'donation'] },
        status: { $in: ['pending-payment', 'cancelled'] },
      }),
    ).toEqual({
      excludeProductTypes: ['token', 'donation'],
      statuses: ['pending-payment', 'cancelled'],
    });
    expect(
      toSaleFilterInput({
        _id: 's1',
        createdBy: 'u1',
        product_type: 'token',
      }),
    ).toEqual({ id: 's1', createdBy: 'u1', productTypes: ['token'] });
    expect(toSaleFilterInput()).toEqual({});
  });
});

describe('with tRPC off', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: 'r' } });
    mockedApi.post.mockResolvedValue({ data: { results: 'r' } });
  });

  it('lists with the where as JSON and the axios config as given', async () => {
    await expect(
      fetchSales({ where: { _id: 's1' }, limit: 1 }, { cache: false }),
    ).resolves.toBe('r');
    await fetchSales({ where: { createdBy: 'u1' }, sort: '-created' });
    expect(mockedApi.get.mock.calls).toEqual([
      ['/sale', { params: { where: '{"_id":"s1"}', limit: 1 }, cache: false }],
      ['/sale', { params: { where: '{"createdBy":"u1"}', sort: '-created' } }],
    ]);
    expect(mockedEnabled).toHaveBeenCalledWith('12.8a');
    expect(sale.list.query).not.toHaveBeenCalled();
  });

  it('counts and sums with the raw where', async () => {
    await expect(countSales(tokensPaid)).resolves.toEqual({ results: 'r' });
    await expect(sumSales('total_price', tokensPaid)).resolves.toEqual({
      results: 'r',
    });
    expect(mockedApi.get.mock.calls).toEqual([
      ['/count/sale', { params: { where: tokensPaid } }],
      ['/sum/sale/total_price', { params: { where: tokensPaid } }],
    ]);
  });

  it('leaves the store on its own requests', () => {
    const platform = store();
    const filter = { where: tokensPaid, page: 1, limit: 20 };
    loadSales(platform, filter, { force: true });
    loadSaleCount(platform, filter);
    expect(platform.sale.get).toHaveBeenCalledWith(filter, { force: true });
    expect(platform.sale.getCount).toHaveBeenCalledWith(filter);
  });

  it('posts the sale routes', async () => {
    await expect(createManualSale(manual)).resolves.toBe('r');
    await matchSaleBuyer({ saleId: 's1', matchedSaleId: 's2' });
    await expect(initSale(init)).resolves.toBe('r');
    await expect(confirmSaleCard('s1', 'pi_1')).resolves.toBe('r');
    await confirmSaleCrypto('s1', '0xabc');
    await confirmTokenSale('s/1', '0xdef');
    expect(mockedApi.post.mock.calls).toEqual([
      ['/sale/manual', manual],
      ['/sale/buyer-match', { saleId: 's1', matchedSaleId: 's2' }],
      ['/sale/init', init],
      ['/sale/s1/confirm-card', { paymentId: 'pi_1' }],
      ['/sale/s1/confirm-crypto', { txHash: '0xabc' }],
      ['/sale/s%2F1/confirm-token-sale', { txHash: '0xdef' }],
    ]);
    expect(sale.init.mutate).not.toHaveBeenCalled();
  });
});

describe('with tRPC on', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists through the procedure, dropping the sort legacy ignores', async () => {
    const signal = new AbortController().signal;
    sale.list.query.mockResolvedValue([{ _id: 's1' }]);
    await expect(
      fetchSales({ where: { _id: 's1' }, limit: 1 }, { signal }),
    ).resolves.toEqual([{ _id: 's1' }]);
    await fetchSales({ where: { createdBy: 'u1' }, sort: '-created' });
    expect(sale.list.query.mock.calls).toEqual([
      [{ id: 's1', limit: 1 }, { signal }],
      [{ createdBy: 'u1' }, { signal: undefined }],
    ]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('counts and sums every visible sale, as legacy drops the where', async () => {
    sale.count.query.mockResolvedValue(158);
    sale.sum.query.mockResolvedValue(379007.38);
    await expect(countSales(tokensPaid)).resolves.toEqual({ results: 158 });
    await expect(sumSales('total_price', tokensPaid)).resolves.toEqual({
      results: 379007.38,
    });
    expect(sale.count.query).toHaveBeenCalledWith();
    expect(sale.sum.query).toHaveBeenCalledWith({ field: 'total_price' });
  });

  it('loads the store through the procedures', async () => {
    const platform = store();
    const filter = { where: tokensPaid, page: 2, limit: 20, _refresh: 1 };
    sale.list.query.mockResolvedValue([]);
    sale.count.query.mockResolvedValue(158);
    loadSales(platform, filter, { force: true });
    loadSaleCount(platform, filter);
    const [, listOpts] = platform.sale.get.mock.calls[0];
    const [, countOpts] = platform.sale.getCount.mock.calls[0];
    expect(listOpts.force).toBe(true);
    await listOpts.load();
    await expect(countOpts.load()).resolves.toBe(158);
    expect(sale.list.query).toHaveBeenCalledWith({
      productTypes: ['token', 'tokens'],
      statuses: ['paid'],
      createdFrom: '2026-01-01',
      limit: 20,
      page: 2,
      sortBy: '-created',
    });
    expect(sale.count.query).toHaveBeenCalledWith();
  });

  it('calls the sale procedures and returns their results', async () => {
    sale.createManual.mutate.mockResolvedValue({ saleId: 's1' });
    sale.init.mutate.mockResolvedValue({ saleId: 's2' });
    sale.confirmCard.mutate.mockResolvedValue({ status: 'success' });
    sale.matchBuyer.mutate.mockResolvedValue({ status: 'success' });
    sale.confirmCrypto.mutate.mockResolvedValue({ status: 'success' });
    sale.confirmTokenSale.mutate.mockResolvedValue({ results: {} });
    await expect(createManualSale(manual)).resolves.toEqual({ saleId: 's1' });
    await matchSaleBuyer({ saleId: 's1', matchedSaleId: 's2' });
    await expect(initSale(init)).resolves.toEqual({ saleId: 's2' });
    await expect(confirmSaleCard('s1', 'pi_1')).resolves.toEqual({
      status: 'success',
    });
    await confirmSaleCrypto('s1', '0xabc');
    await confirmTokenSale('s/1', '0xdef');
    expect(sale.createManual.mutate).toHaveBeenCalledWith(manual);
    expect(sale.matchBuyer.mutate).toHaveBeenCalledWith({
      saleId: 's1',
      matchedSaleId: 's2',
    });
    expect(sale.init.mutate).toHaveBeenCalledWith(init);
    expect(sale.confirmCard.mutate).toHaveBeenCalledWith({
      id: 's1',
      paymentId: 'pi_1',
    });
    expect(sale.confirmCrypto.mutate).toHaveBeenCalledWith({
      id: 's1',
      txHash: '0xabc',
    });
    expect(sale.confirmTokenSale.mutate).toHaveBeenCalledWith({
      id: 's/1',
      txHash: '0xdef',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a list, count or sum failure with the legacy status and text', async () => {
    const message = "Invalid search param in 'where': kyc";
    const failure = new TRPCClientError(message, {
      result: {
        error: {
          message,
          code: -32600,
          data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
        },
      },
    });
    sale.list.query.mockRejectedValue(failure);
    sale.count.query.mockRejectedValue(failure);
    sale.sum.query.mockRejectedValue(failure);
    for (const call of [
      () => fetchSales({ where: { _id: 's1' }, limit: 1 }),
      () => countSales(tokensPaid),
      () => sumSales('total_price', tokensPaid),
    ]) {
      await expect(call()).rejects.toMatchObject({
        message,
        response: { status: 400, data: { error: message } },
      });
    }
  });

  it('rethrows a failure with the legacy status and text', async () => {
    const message = 'Payment has not completed yet';
    sale.confirmCard.mutate.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
          },
        },
      }),
    );
    const error = await confirmSaleCard('s1', 'pi_1').catch((e) => e);
    expect(parseMessageFromError(error)).toBe(message);
    expect(error).toMatchObject({ response: { status: 400 } });
  });
});
