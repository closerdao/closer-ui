import api from '../api';
import {
  awardCreditsBatch,
  claimOnboardingCredits,
  fetchCreditsAvailability,
  fetchCreditsBalance,
  fetchReferralCredits,
} from '../credits';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  formatSearch: (where: unknown) => JSON.stringify(where),
}));
jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    credit: {
      balance: { query: jest.fn() },
      availability: { mutate: jest.fn() },
      claimOnboarding: { mutate: jest.fn() },
      awardBatch: { mutate: jest.fn() },
      list: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<'get' | 'post', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const credit = trpc.credit as unknown as Record<
  string,
  Record<string, jest.Mock>
>;

beforeEach(() => jest.clearAllMocks());

describe('with tRPC off', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('reads the balance with and without the cache bypass', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: 9 } });
    await expect(fetchCreditsBalance()).resolves.toBe(9);
    expect(mockedApi.get).toHaveBeenLastCalledWith('/credits/balance');
    await fetchCreditsBalance({ cache: false });
    expect(mockedApi.get).toHaveBeenLastCalledWith('/credits/balance', {
      cache: false,
    });
    expect(mockedEnabled).toHaveBeenCalledWith('12.5a');
  });

  it('posts availability, onboarding claims and batch awards as sent', async () => {
    const startDate = new Date('2036-01-31T00:00:00.000Z');
    mockedApi.post.mockResolvedValue({
      data: { results: true },
    });
    const input = { startDate, creditsAmount: 2, minCreditsAmount: 1 };
    await expect(fetchCreditsAvailability(input)).resolves.toBe(true);
    expect(mockedApi.post).toHaveBeenLastCalledWith(
      '/credits/availability',
      input,
    );
    await expect(
      claimOnboardingCredits({ step: 's1', response: { a: 1 } }),
    ).resolves.toBe(true);
    expect(mockedApi.post).toHaveBeenLastCalledWith(
      '/credits/claim/onboarding',
      { step: 's1', response: { a: 1 } },
    );
    const batch = { users: ['a@b.c'], amount: 2, reason: 'r' };
    await awardCreditsBatch(batch);
    expect(mockedApi.post).toHaveBeenLastCalledWith(
      '/credits/award/batch',
      batch,
    );
  });

  it('lists referral credits with the legacy where filter', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [{ amount: 1 }] } });
    await expect(fetchReferralCredits('u1')).resolves.toEqual([{ amount: 1 }]);
    expect(mockedApi.get).toHaveBeenLastCalledWith('/credit', {
      params: { where: '{"userId":"u1","source":"referral"}' },
    });
    await fetchReferralCredits('u1', { from: '2026-11-01', to: '2026-11-30' });
    expect(mockedApi.get).toHaveBeenLastCalledWith('/credit', {
      params: {
        where:
          '{"userId":"u1","source":"referral","created":{"$gte":"2026-11-01","$lte":"2026-11-30"}}',
      },
    });
  });
});

describe('with tRPC on', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('calls each procedure', async () => {
    credit.balance.query.mockResolvedValue(9);
    credit.availability.mutate.mockResolvedValue(true);
    credit.claimOnboarding.mutate.mockResolvedValue({ alreadyClaimed: true });
    credit.awardBatch.mutate.mockResolvedValue([]);

    await expect(fetchCreditsBalance({ cache: false })).resolves.toBe(9);
    await expect(
      fetchCreditsAvailability({
        startDate: new Date('2036-01-31T00:00:00.000Z'),
        creditsAmount: 2,
        minCreditsAmount: 1,
      }),
    ).resolves.toBe(true);
    expect(credit.availability.mutate).toHaveBeenCalledWith({
      startDate: '2036-01-31T00:00:00.000Z',
      creditsAmount: 2,
      minCreditsAmount: 1,
    });
    await claimOnboardingCredits({ step: 's1', response: {} });
    expect(credit.claimOnboarding.mutate).toHaveBeenCalledWith({
      step: 's1',
      response: {},
    });
    const batch = { users: ['a@b.c'], amount: 2, reason: 'r' };
    await expect(awardCreditsBatch(batch)).resolves.toBeUndefined();
    expect(credit.awardBatch.mutate).toHaveBeenCalledWith(batch);
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('lists referral credits as named filters and skips unreadable rows', async () => {
    credit.list.query.mockResolvedValue([{}, { amount: 2 }]);
    await expect(
      fetchReferralCredits('u1', { from: '2026-11-01', to: '2026-11-30' }),
    ).resolves.toEqual([{ amount: 2 }]);
    expect(credit.list.query).toHaveBeenCalledWith({
      userId: 'u1',
      source: 'referral',
      createdFrom: '2026-11-01',
      createdTo: '2026-11-30',
    });
    await fetchReferralCredits('u1');
    expect(credit.list.query).toHaveBeenLastCalledWith({
      userId: 'u1',
      source: 'referral',
    });
  });
});
