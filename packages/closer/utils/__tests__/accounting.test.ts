import { TRPCClientError } from '@trpc/client';

import { requestTokenTransactions } from '../accounting';
import api from '../api';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: { accounting: { requestTokenTransactions: { mutate: jest.fn() } } },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mutate = (
  trpc.accounting as unknown as {
    requestTokenTransactions: { mutate: jest.Mock };
  }
).requestTokenTransactions.mutate;

beforeEach(() => jest.clearAllMocks());

describe('requestTokenTransactions', () => {
  it('posts the year to legacy when tRPC is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { status: 'ok' } });
    await expect(requestTokenTransactions('2025')).resolves.toEqual({
      status: 'ok',
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/accounting/request-token-transactions?year=2025',
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it('calls the procedure when tRPC is on', async () => {
    mockedEnabled.mockReturnValue(true);
    mutate.mockResolvedValue({ status: 'token transactions sent' });
    await requestTokenTransactions('2025');
    expect(mutate).toHaveBeenCalledWith({ year: '2025' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a tRPC failure with the legacy error text', async () => {
    mockedEnabled.mockReturnValue(true);
    const message = 'No token transaction files available to send.';
    mutate.mockRejectedValue(
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
    const error = await requestTokenTransactions('2025').catch((e) => e);
    expect(parseMessageFromError(error)).toBe(message);
  });
});
