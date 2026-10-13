import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { login } from '../auth';
import { applyInteractionIsHumanFromResponse } from '../interactionSession';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: { auth: { login: { mutate: jest.fn() } } },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedLogin = trpc.auth.login.mutate as unknown as jest.Mock;
const mockedApplyIsHuman = applyInteractionIsHumanFromResponse as jest.Mock;

const user = { _id: 'u1', email: 'ada@example.com', screenname: 'Ada' };
const credentials = {
  email: 'ada@example.com',
  password: 'secret',
  turnstileToken: null,
};

const badRequest = (message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
      },
    },
  });

const failureOf = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (error) {
    return error as Error & {
      response?: { status?: number; data?: { error?: string } };
    };
  }
  throw new Error('expected the call to fail');
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login', () => {
  it('posts to legacy /login with the flag off and returns its body', async () => {
    mockedEnabled.mockReturnValue(false);
    const body = {
      results: user,
      access_token: 'a',
      refresh_token: 'r',
      isHuman: true,
    };
    mockedApi.post.mockResolvedValue({ data: body });

    await expect(login(credentials)).resolves.toBe(body);
    expect(mockedApi.post).toHaveBeenCalledWith('/login', credentials);
    expect(mockedLogin).not.toHaveBeenCalled();
    // The axios response interceptor applies isHuman on this path.
    expect(mockedApplyIsHuman).not.toHaveBeenCalled();
  });

  it('calls auth.login with the flag on, renames user to results and applies isHuman', async () => {
    mockedEnabled.mockReturnValue(true);
    mockedLogin.mockResolvedValue({
      user,
      access_token: 'a',
      refresh_token: 'r',
      isHuman: true,
    });

    await expect(login(credentials)).resolves.toEqual({
      results: user,
      access_token: 'a',
      refresh_token: 'r',
      isHuman: true,
    });
    expect(mockedLogin).toHaveBeenCalledWith(credentials);
    expect(mockedApplyIsHuman).toHaveBeenCalledWith({
      access_token: 'a',
      refresh_token: 'r',
      isHuman: true,
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it.each(['User not found.', 'Invalid password.'])(
    'turns "%s" into legacy 401',
    async (message) => {
      mockedEnabled.mockReturnValue(true);
      mockedLogin.mockRejectedValue(badRequest(message));

      const error = await failureOf(login(credentials));
      expect(error.message).toBe(message);
      expect(error.response).toEqual({ status: 401, data: { error: message } });
    },
  );

  it('keeps other failures as their status and text', async () => {
    mockedEnabled.mockReturnValue(true);
    mockedLogin.mockRejectedValue(badRequest('Missing Turnstile token.'));

    const error = await failureOf(login(credentials));
    expect(error.response).toEqual({
      status: 400,
      data: { error: 'Missing Turnstile token.' },
    });
    expect(mockedApplyIsHuman).not.toHaveBeenCalled();
  });
});
