import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  countCharges,
  fetchAffiliateCharges,
  fetchStoreCharges,
  listCharges,
  recordAffiliatePayout,
  removeCharge,
  sumCharges,
} from '../charges';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    charge: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      sum: { query: jest.fn() },
      affiliate: { query: jest.fn() },
      remove: { mutate: jest.fn() },
      recordPayout: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  delete: jest.Mock;
};
const mockedEnabled = isTrpcEnabled as jest.Mock;
const charge = trpc.charge as unknown as Record<
  string,
  { query?: jest.Mock; mutate?: jest.Mock }
>;

const badRequest = (message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
      },
    },
  });

beforeEach(() => jest.clearAllMocks());

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('lists charges with the where as sent', async () => {
    const res = { data: { results: [{ _id: 'c1' }] } };
    mockedApi.get.mockResolvedValue(res);
    const where = { method: 'stripe', date: { $gte: '2026-01-01' } };

    await expect(
      listCharges(where, { limit: 5, sortBy: '-date' }),
    ).resolves.toBe(res);
    expect(mockedApi.get).toHaveBeenCalledWith('/charge', {
      params: { where, limit: 5, page: undefined, sort_by: '-date' },
    });
  });

  it('sends the where pre-encoded when asked to', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [] } });
    await listCharges({ saleId: 's1' }, { encodeWhere: true });
    expect(mockedApi.get.mock.calls[0][1].params.where).toBe(
      encodeURIComponent(JSON.stringify({ saleId: 's1' })),
    );
  });

  it('bypasses the GET cache when asked to', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [] } });
    await listCharges({ saleId: 's1' }, { cache: false });
    expect(mockedApi.get.mock.calls[0][1]).toMatchObject({ cache: false });
  });

  it('sums, counts and removes through the CRUD routes', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: 3 } });
    await sumCharges('amount.total.val', { status: 'paid' });
    await countCharges({ status: 'paid' });
    await removeCharge('c1');
    expect(mockedApi.get.mock.calls).toEqual([
      [
        '/sum/charge/amount.total.val',
        { params: { where: { status: 'paid' } } },
      ],
      ['/count/charge', { params: { where: { status: 'paid' } } }],
    ]);
    expect(mockedApi.delete).toHaveBeenCalledWith('/charge/c1');
    expect(charge.list.query).not.toHaveBeenCalled();
  });

  it('reads the store and unwraps its rows', async () => {
    const get = jest
      .fn()
      .mockResolvedValue({ results: { toJS: () => [{ _id: 'c1' }] } });
    const filter = { where: { type: 'product' }, limit: 10 };
    await expect(
      fetchStoreCharges({ charge: { get } }, filter),
    ).resolves.toEqual([{ _id: 'c1' }]);
    expect(get).toHaveBeenCalledWith(filter);
  });

  it('unwraps the affiliate ledger and posts the payout', async () => {
    mockedApi.get.mockResolvedValue({
      data: { results: { affiliateData: [], payoutData: [] } },
    });
    mockedApi.post.mockResolvedValue({ data: { results: 'ok' } });
    await expect(fetchAffiliateCharges()).resolves.toEqual({
      affiliateData: [],
      payoutData: [],
    });
    await recordAffiliatePayout('u1', 12);
    expect(mockedApi.post).toHaveBeenCalledWith('/charges/record-payout', {
      amount: 12,
      userId: 'u1',
    });
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('turns the where into typed filters', async () => {
    charge.list.query!.mockResolvedValue([{ _id: 'c1' }]);
    const res = await listCharges(
      {
        date: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: '2026-02-01' },
        method: { $in: ['cash', 'bank-transfer'] },
        status: { $in: ['paid', 'refunded'] },
        type: 'subscription',
        linkedObjectType: 'Booking',
        linkedObjectId: 'b1',
        'meta.productType': 'lesson',
        productId: { $in: ['p1'] },
      },
      { limit: 7, page: 2, sortBy: '-date' },
    );
    expect(res).toEqual({ data: { results: [{ _id: 'c1' }] } });
    expect(charge.list.query).toHaveBeenCalledWith({
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-02-01',
      methods: ['cash', 'bank-transfer'],
      statuses: ['paid', 'refunded'],
      types: ['subscription'],
      linkedObjectType: 'Booking',
      linkedObjectId: 'b1',
      productType: 'lesson',
      productIds: ['p1'],
      limit: 7,
      page: 2,
      sortBy: '-date',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('maps the exclusions', async () => {
    charge.sum.query!.mockResolvedValue(42);
    const res = await sumCharges('amount.event.val', {
      status: { $ne: 'refunded' },
      type: { $nin: ['tokenSale', 'subscription'] },
    });
    expect(res).toEqual({ data: { results: 42 } });
    expect(charge.sum.query).toHaveBeenCalledWith({
      field: 'amount.event.val',
      excludeStatuses: ['refunded'],
      excludeTypes: ['tokenSale', 'subscription'],
    });
  });

  it('counts and removes through the procedures', async () => {
    charge.count.query!.mockResolvedValue(9);
    charge.remove.mutate!.mockResolvedValue({ deleted: true });
    await expect(countCharges({ type: { $ne: 'x' } })).resolves.toEqual({
      data: { results: 9 },
    });
    expect(charge.count.query).toHaveBeenCalledWith({ excludeTypes: ['x'] });
    await removeCharge('c1');
    expect(charge.remove.mutate).toHaveBeenCalledWith({ id: 'c1' });
  });

  it('keeps legacy error text for a refused sum', async () => {
    charge.sum.query!.mockRejectedValue(
      badRequest('No permissions to read field.'),
    );
    const error = await sumCharges('meta.stripeConnectFee', {}).catch((e) => e);
    expect(parseMessageFromError(error)).toBe('No permissions to read field.');
  });

  it('lets the store read resolve empty on a failed read', async () => {
    charge.list.query!.mockRejectedValue(badRequest('nope'));
    await expect(
      fetchStoreCharges({}, { where: { type: 'product' }, limit: 10 }),
    ).resolves.toBeUndefined();
    charge.list.query!.mockResolvedValue([{ _id: 'c1' }]);
    await expect(
      fetchStoreCharges({}, { where: { type: 'product' } }),
    ).resolves.toEqual([{ _id: 'c1' }]);
  });

  it('reads the affiliate ledger and records the payout', async () => {
    const ledger = { affiliateData: [], payoutData: [] };
    charge.affiliate.query!.mockResolvedValue(ledger);
    charge.recordPayout.mutate!.mockResolvedValue({ _id: 'c2' });
    await expect(fetchAffiliateCharges()).resolves.toBe(ledger);
    await recordAffiliatePayout('u1', 12);
    expect(charge.recordPayout.mutate).toHaveBeenCalledWith({
      amount: 12,
      userId: 'u1',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
