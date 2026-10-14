import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';
import {
  createUserReport,
  fetchIsReported,
  withdrawReport,
} from '../userReports';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    userReport: {
      mine: { query: jest.fn() },
      create: { mutate: jest.fn() },
      withdraw: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  delete: jest.Mock;
};
const mockedEnabled = isTrpcEnabled as jest.Mock;
const userReport = trpc.userReport as unknown as {
  mine: { query: jest.Mock };
  create: { mutate: jest.Mock };
  withdraw: { mutate: jest.Mock };
};

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

const report = { reason: 'spam', unsafe: true };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('reads the flag from GET /report/user/:id', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: { reported: true } } });
    await expect(fetchIsReported('u1')).resolves.toBe(true);

    mockedApi.get.mockResolvedValue({ data: { results: { reported: false } } });
    await expect(fetchIsReported('u1')).resolves.toBe(false);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/report/user/u1'],
      ['/report/user/u1'],
    ]);
    expect(userReport.mine.query).not.toHaveBeenCalled();
  });

  it('makes the POST and DELETE /report/user/:id calls it replaced', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    mockedApi.delete.mockResolvedValue({ data: {} });

    await createUserReport('u1', report);
    await withdrawReport('u1');

    expect(mockedApi.post.mock.calls).toEqual([['/report/user/u1', report]]);
    expect(mockedApi.delete.mock.calls).toEqual([['/report/user/u1']]);
    expect(userReport.create.mutate).not.toHaveBeenCalled();
    expect(userReport.withdraw.mutate).not.toHaveBeenCalled();
  });

  it('rejects when the request fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('Request failed with 400'));
    await expect(createUserReport('u1', report)).rejects.toThrow(
      'Request failed with 400',
    );
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('reads the flag from userReport.mine; no such user is not reported', async () => {
    userReport.mine.query.mockResolvedValueOnce({ reported: true });
    userReport.mine.query.mockResolvedValueOnce(null);

    await expect(fetchIsReported('u1')).resolves.toBe(true);
    await expect(fetchIsReported('u2')).resolves.toBe(false);

    expect(userReport.mine.query.mock.calls).toEqual([
      [{ userId: 'u1' }],
      [{ userId: 'u2' }],
    ]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reports and withdraws through the procedures', async () => {
    userReport.create.mutate.mockResolvedValue({ success: true });
    userReport.withdraw.mutate.mockResolvedValue({ reported: false });

    await createUserReport('u1', report);
    await withdrawReport('u1');

    expect(userReport.create.mutate.mock.calls).toEqual([
      [{ userId: 'u1', reason: 'spam', unsafe: true }],
    ]);
    expect(userReport.withdraw.mutate.mock.calls).toEqual([[{ userId: 'u1' }]]);
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it("rejects with the API's text, as the page shows it", async () => {
    userReport.create.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'You have already reported this user'),
    );
    const error = await createUserReport('u1', report).catch((e: unknown) => e);
    expect(parseMessageFromError(error)).toBe(
      'You have already reported this user',
    );

    userReport.mine.query.mockRejectedValue(
      trpcError('UNAUTHORIZED', 401, 'Unauthorized'),
    );
    await expect(fetchIsReported('u1')).rejects.toBeTruthy();
  });
});
