import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  applyForFinance,
  cancelFinance,
  distributeFinanced,
  fetchTokenStats,
} from '../token.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    token: {
      stats: { query: jest.fn() },
      applyForFinance: { mutate: jest.fn() },
      cancelFinance: { mutate: jest.fn() },
      distributeFinanced: { mutate: jest.fn() },
    },
  },
}));

const mockedEnabled = isTrpcEnabled as jest.Mock;
const post = api.post as jest.Mock;
const get = api.get as jest.Mock;
const token = trpc.token as unknown as Record<
  string,
  { mutate: jest.Mock; query: jest.Mock }
>;

const application = {
  tokensToFinance: 10,
  totalToPayInFiat: 2500,
  iban: 'PT50000201231234567890154',
  durationInMonths: 24,
  monthlyPaymentAmount: 93.75,
  downPaymentAmount: 250,
  aprPercent: 0,
  isCitizenApplication: true,
  why: 'to live here',
};

const plan = { _id: 'f1', userId: 'u1', status: 'canceled' };

const badRequest = new TRPCClientError(
  'Cannot distribute more tokens than accrued',
  {
    result: {
      error: {
        message: 'Cannot distribute more tokens than accrued',
        code: -32600,
        data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
      },
    },
  },
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('applyForFinance posts the form as is and resolves the body', async () => {
    post.mockResolvedValue({ data: { status: 'success', memoCode: 'AB12' } });
    await expect(applyForFinance(application)).resolves.toEqual({
      status: 'success',
      memoCode: 'AB12',
    });
    expect(post).toHaveBeenCalledWith(
      '/token/finance-application',
      application,
    );
    expect(token.applyForFinance.mutate).not.toHaveBeenCalled();
  });

  it('cancelFinance posts the reason to the escaped id and resolves the plan', async () => {
    post.mockResolvedValue({ data: { results: plan } });
    await expect(cancelFinance('f/1', 'changed my mind')).resolves.toBe(plan);
    expect(post).toHaveBeenCalledWith('/token/finance/f%2F1/cancel', {
      reason: 'changed my mind',
    });
  });

  it('distributeFinanced posts the distribution and resolves the plan', async () => {
    post.mockResolvedValue({ data: { results: plan } });
    const body = { amount: 2, txHash: '0xabc', date: '2026-10-01' };
    await expect(distributeFinanced('f1', body)).resolves.toBe(plan);
    expect(post).toHaveBeenCalledWith(
      '/token/financeapplication/f1/token-distribution',
      body,
    );
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('applyForFinance sends only the fields the procedure reads', async () => {
    token.applyForFinance.mutate.mockResolvedValue({
      status: 'success',
      memoCode: 'AB12',
    });
    await expect(applyForFinance(application)).resolves.toEqual({
      status: 'success',
      memoCode: 'AB12',
    });
    expect(token.applyForFinance.mutate).toHaveBeenCalledWith({
      tokensToFinance: 10,
      totalToPayInFiat: 2500,
      iban: 'PT50000201231234567890154',
      durationInMonths: 24,
      monthlyPaymentAmount: 93.75,
      isCitizenApplication: true,
      why: 'to live here',
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('cancelFinance resolves the plan', async () => {
    token.cancelFinance.mutate.mockResolvedValue(plan);
    await expect(cancelFinance('f1', 'changed my mind')).resolves.toBe(plan);
    expect(token.cancelFinance.mutate).toHaveBeenCalledWith({
      id: 'f1',
      reason: 'changed my mind',
    });
  });

  it('distributeFinanced resolves the plan', async () => {
    token.distributeFinanced.mutate.mockResolvedValue(plan);
    await expect(
      distributeFinanced('f1', { amount: 2, txHash: '0xabc' }),
    ).resolves.toBe(plan);
    expect(token.distributeFinanced.mutate).toHaveBeenCalledWith({
      id: 'f1',
      amount: 2,
      txHash: '0xabc',
    });
  });

  it('rejects with the legacy error text', async () => {
    token.distributeFinanced.mutate.mockRejectedValue(badRequest);
    await expect(
      distributeFinanced('f1', { amount: 99, txHash: '0xabc' }),
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: { error: 'Cannot distribute more tokens than accrued' },
      },
    });
  });
});

describe('fetchTokenStats', () => {
  const stats = {
    tokenHolders: 300,
    tokenPrice: 0.5,
    currentSupply: 7000,
    lastUpdated: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => jest.clearAllMocks());

  it('reads legacy GET /token/stats when tRPC is off', async () => {
    mockedEnabled.mockReturnValue(false);
    get.mockResolvedValue({ data: stats });
    expect(await fetchTokenStats()).toEqual(stats);
    expect(get).toHaveBeenCalledWith('/token/stats');
  });

  it('calls token.stats when tRPC is on', async () => {
    mockedEnabled.mockReturnValue(true);
    token.stats.query.mockResolvedValue(stats);
    expect(await fetchTokenStats()).toEqual(stats);
    expect(get).not.toHaveBeenCalled();
  });
});
