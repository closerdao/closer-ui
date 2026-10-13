import { TRPCClientError } from '@trpc/client';
import axios from 'axios';

import { INTERACTION_SESSION_LOCAL_STORAGE_KEY } from '../../constants';
import { isTrpcEnabled, plainTrpc } from '../trpcBase';

const mockInit = jest.fn();

jest.mock('../trpcBase', () => ({
  ...jest.requireActual('../trpcBase'),
  isTrpcEnabled: jest.fn(),
  plainTrpc: jest.fn(() => ({ interaction: { init: { mutate: mockInit } } })),
}));

// test/jest.mocks.tsx stubs it for every suite.
const { ensureInteractionSession } = jest.requireActual(
  '../interactionSession',
);

const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedPlainTrpc = plainTrpc as jest.Mock;

const encode = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj)).toString('base64url');
const sessionKey = `${encode({ alg: 'HS256' })}.${encode({
  typ: 'interaction',
  exp: Math.floor(Date.now() / 1000) + 3600,
})}.sig`;

const storedKey = () =>
  localStorage.getItem(INTERACTION_SESSION_LOCAL_STORAGE_KEY);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  (axios.post as unknown as jest.Mock).mockRestore?.();
});

describe('ensureInteractionSession', () => {
  it('posts to legacy /interaction/init with the flag off and stores the key', async () => {
    mockedEnabled.mockReturnValue(false);
    const post = jest
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { results: { sessionkey: sessionKey } } });

    await ensureInteractionSession();

    const [url, body] = post.mock.calls[0];
    expect(url).toBe(`${process.env.NEXT_PUBLIC_API_URL}/interaction/init`);
    expect(body).toEqual(
      expect.objectContaining({ screen: expect.any(String) }),
    );
    expect(storedKey()).toBe(sessionKey);
    expect(mockedPlainTrpc).not.toHaveBeenCalled();
  });

  it('calls interaction.init on the plain client with the flag on and stores the key', async () => {
    mockedEnabled.mockReturnValue(true);
    const post = jest.spyOn(axios, 'post');
    mockInit.mockResolvedValue({ sessionkey: sessionKey });

    await ensureInteractionSession();

    // No headers: the trpc client's own headers wait for this call.
    expect(mockedPlainTrpc).toHaveBeenCalledWith();
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ screen: expect.any(String) }),
    );
    expect(storedKey()).toBe(sessionKey);
    expect(post).not.toHaveBeenCalled();
  });

  it('logs a tRPC rate limit as the legacy 429', async () => {
    mockedEnabled.mockReturnValue(true);
    const message = 'Too many requests, please try again in 60 s.';
    mockInit.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32029,
            data: {
              code: 'TOO_MANY_REQUESTS',
              httpStatus: 429,
              zodError: null,
            },
          },
        },
      }),
    );
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await ensureInteractionSession();

    expect(warn).toHaveBeenCalledWith(
      'Interaction session init rate limited (429).',
      '',
    );
    expect(storedKey()).toBeNull();
    warn.mockRestore();
  });
});
