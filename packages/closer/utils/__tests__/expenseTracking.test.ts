import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { fetchCombinedEntries, requestDocumentsZip } from '../expenseTracking';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), getUri: jest.fn() },
}));
jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    expenseTracking: {
      entries: { query: jest.fn() },
      documentsZipToken: { mutate: jest.fn() },
    },
  },
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

describe('requestDocumentsZip', () => {
  const legacyApi = api as unknown as { post: jest.Mock; getUri: jest.Mock };
  const zipToken = (
    trpc.expenseTracking as unknown as {
      documentsZipToken: { mutate: jest.Mock };
    }
  ).documentsZipToken.mutate;
  const zipInput = {
    from: '2026-01-01',
    to: '2026-01-31',
    dateBy: 'document',
    toconlineDocumentType: 'FC',
  };
  const trpcUrl = process.env.NEXT_PUBLIC_TRPC_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_TRPC_URL = trpcUrl;
  });

  it('posts the legacy token route and downloads from the legacy API with the group off', async () => {
    mockedEnabled.mockReturnValue(false);
    legacyApi.post.mockResolvedValue({ data: { token: 'legacy-jwt' } });
    legacyApi.getUri.mockReturnValue(
      'https://api.test/expense-tracking/documents-zip',
    );

    await expect(requestDocumentsZip(zipInput)).resolves.toEqual({
      token: 'legacy-jwt',
      action: 'https://api.test/expense-tracking/documents-zip',
    });

    expect(mockedEnabled).toHaveBeenCalledWith('13.0a');
    expect(legacyApi.post.mock.calls).toEqual([
      [
        '/expense-tracking/documents-zip/token',
        {
          from: '2026-01-01',
          to: '2026-01-31',
          date_by: 'document',
          toconline_document_type: 'FC',
        },
      ],
    ]);
    expect(legacyApi.getUri).toHaveBeenCalledWith({
      url: '/expense-tracking/documents-zip',
    });
    expect(zipToken).not.toHaveBeenCalled();
  });

  it('asks the procedure for the token and downloads from the tRPC origin with the group on', async () => {
    mockedEnabled.mockReturnValue(true);
    process.env.NEXT_PUBLIC_TRPC_URL = 'https://trpc.test/trpc';
    zipToken.mockResolvedValue({ token: 'trpc-jwt', count: 3 });

    await expect(requestDocumentsZip(zipInput)).resolves.toEqual({
      token: 'trpc-jwt',
      action: 'https://trpc.test/expense-tracking/documents-zip',
    });

    expect(zipToken.mock.calls).toEqual([[zipInput]]);
    expect(legacyApi.post).not.toHaveBeenCalled();
  });

  it('rejects with the API error text the page alerts when the range has no documents', async () => {
    mockedEnabled.mockReturnValue(true);
    zipToken.mockRejectedValue(
      new TRPCClientError('No expense documents in this period', {
        result: {
          error: {
            message: 'No expense documents in this period',
            code: -32004,
            data: { code: 'NOT_FOUND', httpStatus: 404, zodError: null },
          },
        },
      }),
    );

    await expect(requestDocumentsZip(zipInput)).rejects.toMatchObject({
      response: {
        status: 404,
        data: { error: 'No expense documents in this period' },
      },
    });
  });
});
