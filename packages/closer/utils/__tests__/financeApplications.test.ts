import { TRPCClientError } from '@trpc/client';

import {
  loadFinanceApplication,
  loadFinanceApplicationCount,
  loadFinanceApplications,
  toFinanceApplicationFilterInput,
} from '../financeApplications';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    financeApplication: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      get: { query: jest.fn() },
    },
  },
}));

const mockedEnabled = isTrpcEnabled as jest.Mock;
const finance = trpc.financeApplication as unknown as Record<
  string,
  { query: jest.Mock }
>;

const makePlatform = () => ({
  financeapplication: {
    get: jest.fn().mockResolvedValue(undefined),
    getCount: jest.fn().mockResolvedValue(undefined),
    getOne: jest.fn().mockResolvedValue(undefined),
  },
});

// The `load` the helper handed the store, which the store runs instead of its own request.
const runLoad = (mock: jest.Mock) => {
  const args = mock.mock.calls[0];
  return args[args.length - 1].load();
};

const plan = { _id: 'f1', userId: 'u1', status: 'up-to-date' };

const notFound = new TRPCClientError('FinanceApplication not found', {
  result: {
    error: {
      message: 'FinanceApplication not found',
      code: -32004,
      data: { code: 'NOT_FOUND', httpStatus: 404, zodError: null },
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('toFinanceApplicationFilterInput', () => {
  it('maps each store where onto the named filters', () => {
    expect(toFinanceApplicationFilterInput(undefined)).toEqual({});
    expect(toFinanceApplicationFilterInput({})).toEqual({});
    expect(toFinanceApplicationFilterInput({ status: 'paid' })).toEqual({
      status: 'paid',
    });
    expect(
      toFinanceApplicationFilterInput({
        userId: 'u1',
        status: { $in: ['paid', 'delinquent'] },
      }),
    ).toEqual({ userId: 'u1', status: ['paid', 'delinquent'] });
    expect(
      toFinanceApplicationFilterInput({ _id: 'f1', userId: 'u1' }),
    ).toEqual({ id: 'f1', userId: 'u1' });
  });
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('loads the list, count and one plan through the store', () => {
    const platform = makePlatform();
    const filter = { where: { status: 'paid' }, limit: 20, page: 2 };

    loadFinanceApplications(platform, filter, { force: true });
    loadFinanceApplicationCount(platform, filter);
    loadFinanceApplication(platform, 'f1', { force: true });

    expect(platform.financeapplication.get).toHaveBeenCalledWith(filter, {
      force: true,
    });
    expect(platform.financeapplication.getCount).toHaveBeenCalledWith(filter);
    expect(platform.financeapplication.getOne).toHaveBeenCalledWith('f1', {
      force: true,
    });
    expect(finance.list.query).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists newest first under the store filter', async () => {
    const platform = makePlatform();
    const filter = {
      where: { userId: 'u1', status: { $in: ['paid', 'pending'] } },
      limit: 50,
    };
    finance.list.query.mockResolvedValue([plan, {}]);

    loadFinanceApplications(platform, filter, { force: true });

    expect(platform.financeapplication.get.mock.calls[0][0]).toBe(filter);
    expect(platform.financeapplication.get.mock.calls[0][1].force).toBe(true);
    await expect(runLoad(platform.financeapplication.get)).resolves.toEqual([
      plan,
      {},
    ]);
    expect(finance.list.query).toHaveBeenCalledWith({
      userId: 'u1',
      status: ['paid', 'pending'],
      limit: 50,
      sortBy: '-created',
    });
  });

  it('counts under the store filter', async () => {
    const platform = makePlatform();
    const filter = { where: { status: 'paid' }, limit: 20, page: 1 };
    finance.count.query.mockResolvedValue(7);

    loadFinanceApplicationCount(platform, filter);

    expect(platform.financeapplication.getCount.mock.calls[0][0]).toBe(filter);
    await expect(runLoad(platform.financeapplication.getCount)).resolves.toBe(
      7,
    );
    expect(finance.count.query).toHaveBeenCalledWith({ status: 'paid' });
  });

  it('reads one plan, rejecting a missing one', async () => {
    const platform = makePlatform();
    finance.get.query.mockResolvedValueOnce(plan);
    finance.get.query.mockRejectedValueOnce(notFound);

    loadFinanceApplication(platform, 'f1', { force: true });
    loadFinanceApplication(platform, 'f2');

    expect(platform.financeapplication.getOne.mock.calls[0][1].force).toBe(
      true,
    );
    await expect(runLoad(platform.financeapplication.getOne)).resolves.toEqual(
      plan,
    );
    await expect(
      platform.financeapplication.getOne.mock.calls[1][1].load(),
    ).rejects.toThrow('FinanceApplication not found');
    expect(finance.get.query).toHaveBeenCalledWith({ id: 'f1' });
  });
});
