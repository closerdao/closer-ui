import api from '../api';
import { createToconlineExpense, fetchIncomeEntries } from '../incomeTracking';
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
