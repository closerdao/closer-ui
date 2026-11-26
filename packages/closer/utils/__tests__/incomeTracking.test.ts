import api from '../api';
import {
  createToconlineExpense,
  fetchIncomeEntries,
  fetchSubscriptionPayments,
} from '../incomeTracking';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    incomeTracking: { entries: { query: jest.fn() } },
    toconline: { createExpense: { mutate: jest.fn() } },
    stripeData: { subscriptionPayments: { query: jest.fn() } },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const entries = (
  trpc.incomeTracking as unknown as { entries: { query: jest.Mock } }
).entries.query;
const createExpense = (
  trpc.toconline as unknown as { createExpense: { mutate: jest.Mock } }
).createExpense.mutate;

const input = {
  from: '2026-09-01',
  to: '2026-09-30',
  page: 1,
  limit: 50,
  toconlineDocumentType: 'FR',
};

beforeEach(() => jest.clearAllMocks());

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('reads combined entries with the snake_case params', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: { entries: [] } } });
    await expect(fetchIncomeEntries(input)).resolves.toEqual({
      results: { entries: [] },
    });
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/income-tracking/combined-entries',
      {
        params: {
          from: '2026-09-01',
          to: '2026-09-30',
          page: 1,
          limit: 50,
          sort_by: '-date',
          toconline_document_type: 'FR',
        },
      },
    );
  });

  it('posts the expense', async () => {
    mockedApi.post.mockResolvedValue({ status: 200 });
    await createToconlineExpense({ description: 'x' });
    expect(mockedApi.post).toHaveBeenCalledWith('/toconline/expense', {
      expenseData: { description: 'x' },
    });
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('reads combined entries through the procedure', async () => {
    entries.mockResolvedValue({ entries: [], total: 0 });
    await expect(fetchIncomeEntries(input)).resolves.toEqual({
      entries: [],
      total: 0,
    });
    expect(entries).toHaveBeenCalledWith(input);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('creates the expense through the procedure', async () => {
    createExpense.mockResolvedValue({ result: 'ok' });
    await createToconlineExpense({ description: 'x' });
    expect(createExpense).toHaveBeenCalledWith({
      expenseData: { description: 'x' },
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('fetchSubscriptionPayments', () => {
  const subscriptionPayments = (
    trpc.stripeData as unknown as {
      subscriptionPayments: { query: jest.Mock };
    }
  ).subscriptionPayments.query;
  const range = {
    start: new Date('2026-09-01T00:00:00.000Z'),
    end: new Date('2026-09-30T23:59:59.999Z'),
  };
  const payments = [{ id: 'in_1', amount: 10 }];

  it('posts the legacy route with the group off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { results: payments } });

    await expect(fetchSubscriptionPayments(range)).resolves.toEqual(payments);

    expect(mockedEnabled).toHaveBeenCalledWith('13.0a');
    expect(mockedApi.post.mock.calls).toEqual([
      ['/stripe-data/subscription-payments', range],
    ]);
    expect(subscriptionPayments).not.toHaveBeenCalled();
  });

  it('queries the procedure with the dates as ISO strings with the group on', async () => {
    mockedEnabled.mockReturnValue(true);
    subscriptionPayments.mockResolvedValue(payments);

    await expect(fetchSubscriptionPayments(range)).resolves.toEqual(payments);

    expect(subscriptionPayments.mock.calls).toEqual([
      [{ start: '2026-09-01T00:00:00.000Z', end: '2026-09-30T23:59:59.999Z' }],
    ]);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects when the procedure fails, so the dashboard keeps its catch', async () => {
    mockedEnabled.mockReturnValue(true);
    subscriptionPayments.mockRejectedValue(new Error('boom'));

    await expect(fetchSubscriptionPayments(range)).rejects.toThrow('boom');
  });
});
