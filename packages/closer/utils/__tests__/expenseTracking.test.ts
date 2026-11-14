import api from '../api';
import { fetchCombinedEntries } from '../expenseTracking';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: { expenseTracking: { entries: { query: jest.fn() } } },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const query = (
  trpc.expenseTracking as unknown as { entries: { query: jest.Mock } }
).entries.query;

const input = {
  from: '2026-01-01',
  to: '2026-01-31',
  page: 1,
  limit: 500,
  dateBy: 'document' as const,
  toconlineDocumentType: 'FC',
};

beforeEach(() => jest.clearAllMocks());

describe('fetchCombinedEntries', () => {
  it('gets the legacy route with a cache buster on refresh when tRPC is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: { entries: [] } } });
    await expect(fetchCombinedEntries(input, true)).resolves.toEqual({
      results: { entries: [] },
    });
    expect(mockedEnabled).toHaveBeenCalledWith('8.4a');
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/expense-tracking/combined-entries',
      {
        params: expect.objectContaining({
          from: '2026-01-01',
          date_by: 'document',
          toconline_document_type: 'FC',
          _refresh: expect.any(Number),
        }),
      },
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('calls the procedure when tRPC is on', async () => {
    mockedEnabled.mockReturnValue(true);
    query.mockResolvedValue({ entries: [], total: 0 });
    await expect(fetchCombinedEntries(input)).resolves.toEqual({
      entries: [],
      total: 0,
    });
    expect(query).toHaveBeenCalledWith(input);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
