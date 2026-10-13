import { TRPCClientError } from '@trpc/client';
import axios from 'axios';

import { refreshSession, revokeSession } from '../authSession';
import { isTrpcEnabled, plainTrpc } from '../trpcBase';

const mockRefresh = jest.fn();
const mockLogout = jest.fn();

jest.mock('../trpcBase', () => ({
  ...jest.requireActual('../trpcBase'),
  isTrpcEnabled: jest.fn(),
  plainTrpc: jest.fn(() => ({
    auth: {
      refresh: { mutate: mockRefresh },
      logout: { mutate: mockLogout },
    },
  })),
}));

const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedPlainTrpc = plainTrpc as jest.Mock;

const user = { _id: 'u1', email: 'ada@example.com' };

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  (axios.post as unknown as jest.Mock).mockRestore?.();
});

describe('refreshSession', () => {
  it('posts to legacy /auth/refresh with the flag off and returns its body', async () => {
    mockedEnabled.mockReturnValue(false);
    const body = { results: user, access_token: 'a2', refresh_token: 'r2' };
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: body });

    await expect(refreshSession('r1')).resolves.toBe(body);
    const [url, sent] = post.mock.calls[0];
    expect(url).toMatch(/\/auth\/refresh$/);
    expect(sent).toEqual({ refresh_token: 'r1' });
    expect(mockedPlainTrpc).not.toHaveBeenCalled();
  });

  it('calls auth.refresh on the plain client with the flag on and renames user to results', async () => {
    mockedEnabled.mockReturnValue(true);
    const post = jest.spyOn(axios, 'post');
    mockRefresh.mockResolvedValue({
      user,
      access_token: 'a2',
      refresh_token: 'r2',
    });

    await expect(refreshSession('r1')).resolves.toEqual({
      results: user,
      access_token: 'a2',
      refresh_token: 'r2',
    });
    // No headers: legacy sent neither the access token nor the interaction session.
    expect(mockedPlainTrpc).toHaveBeenCalledWith();
    expect(mockRefresh).toHaveBeenCalledWith({ refresh_token: 'r1' });
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects a refused refresh in legacy 401 shape', async () => {
    mockedEnabled.mockReturnValue(true);
    mockRefresh.mockRejectedValue(
      new TRPCClientError('jwt expired', {
        result: {
          error: {
            message: 'jwt expired',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, zodError: null },
          },
        },
      }),
    );

    await expect(refreshSession('r1')).rejects.toMatchObject({
      message: 'jwt expired',
      response: { status: 401, data: { error: 'jwt expired' } },
    });
  });
});

describe('revokeSession', () => {
  it('posts to legacy /auth/logout with the bearer token and a timeout with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await revokeSession('r1', 'a1');
    const [url, sent, config] = post.mock.calls[0];
    expect(url).toMatch(/\/auth\/logout$/);
    expect(sent).toEqual({ refresh_token: 'r1' });
    expect(config).toMatchObject({
      headers: { Authorization: 'Bearer a1' },
      timeout: 5000,
    });
    expect(mockedPlainTrpc).not.toHaveBeenCalled();
  });

  it('calls auth.logout on the plain client with an abort signal with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const post = jest.spyOn(axios, 'post');
    mockLogout.mockResolvedValue({ status: 'Logged out', revoked: true });

    await expect(revokeSession('r1', 'a1')).resolves.toBeUndefined();
    expect(mockLogout).toHaveBeenCalledWith(
      { refresh_token: 'r1' },
      { signal: expect.any(AbortSignal) },
    );
    expect(post).not.toHaveBeenCalled();
  });
  it('aborts the tRPC logout after 5 s, as legacy timed out', async () => {
    jest.useFakeTimers();
    mockedEnabled.mockReturnValue(true);
    mockLogout.mockImplementation(
      (_input, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );

    const pending = revokeSession('r1', 'a1');
    jest.advanceTimersByTime(5000);
    await expect(pending).rejects.toThrow('aborted');
    jest.useRealTimers();
  });
});
