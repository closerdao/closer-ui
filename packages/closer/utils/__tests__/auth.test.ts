import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  login,
  requestPasswordReset,
  setPassword,
  signup,
  userExists,
  walletLogin,
  walletNonce,
} from '../auth';
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
  trpc: {
    auth: {
      login: { mutate: jest.fn() },
      userExists: { mutate: jest.fn() },
      walletNonce: { mutate: jest.fn() },
      walletLogin: { mutate: jest.fn() },
      signup: { mutate: jest.fn() },
      requestPasswordReset: { mutate: jest.fn() },
      setPassword: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const auth = trpc.auth as unknown as Record<
  | 'login'
  | 'userExists'
  | 'walletNonce'
  | 'walletLogin'
  | 'signup'
  | 'requestPasswordReset'
  | 'setPassword',
  { mutate: jest.Mock }
>;
const mockedLogin = auth.login.mutate;
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

describe('userExists', () => {
  it('posts to legacy /check-user-exists with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { doesUserExist: true } });

    await expect(userExists('ada@example.com')).resolves.toEqual({
      doesUserExist: true,
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/check-user-exists', {
      email: 'ada@example.com',
    });
    expect(auth.userExists.mutate).not.toHaveBeenCalled();
  });

  it('calls auth.userExists with the flag on, a missing email as undefined', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.userExists.mutate.mockResolvedValue({ doesUserExist: false });

    await expect(userExists(null)).resolves.toEqual({ doesUserExist: false });
    expect(auth.userExists.mutate).toHaveBeenCalledWith({ email: undefined });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('walletNonce', () => {
  it('posts to legacy /auth/web3/pre-sign with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { nonce: 'n1' } });

    await expect(walletNonce('0xabc')).resolves.toEqual({ nonce: 'n1' });
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/web3/pre-sign', {
      walletAddress: '0xabc',
    });
    expect(auth.walletNonce.mutate).not.toHaveBeenCalled();
  });

  it('calls auth.walletNonce with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.walletNonce.mutate.mockResolvedValue({ nonce: 'n1' });

    await expect(walletNonce('0xabc')).resolves.toEqual({ nonce: 'n1' });
    expect(auth.walletNonce.mutate).toHaveBeenCalledWith({
      walletAddress: '0xabc',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('walletLogin', () => {
  const signature = {
    walletAddress: '0xabc',
    signedMessage: '0xsig',
    message: 'Signing in with code n1',
  };

  it('posts to legacy /auth/web3/login with the flag off and returns its body', async () => {
    mockedEnabled.mockReturnValue(false);
    const body = { results: user, access_token: 'a', refresh_token: 'r' };
    mockedApi.post.mockResolvedValue({ data: body });

    await expect(walletLogin(signature)).resolves.toBe(body);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/web3/login', signature);
    expect(auth.walletLogin.mutate).not.toHaveBeenCalled();
  });

  it('calls auth.walletLogin with the flag on and renames user to results', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.walletLogin.mutate.mockResolvedValue({
      user,
      access_token: 'a',
      refresh_token: 'r',
    });

    await expect(walletLogin(signature)).resolves.toEqual({
      results: user,
      access_token: 'a',
      refresh_token: 'r',
    });
    expect(auth.walletLogin.mutate).toHaveBeenCalledWith(signature);
  });

  it('rejects a refused signature in legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.walletLogin.mutate.mockRejectedValue(
      badRequest('Invalid or expired nonce. Request a new one.'),
    );

    const error = await failureOf(walletLogin(signature));
    expect(error.response).toEqual({
      status: 400,
      data: { error: 'Invalid or expired nonce. Request a new one.' },
    });
  });
});

describe('signup', () => {
  const form = {
    email: 'ada@example.com',
    password: 'secret1',
    screenname: 'Ada',
    slug: 'ada',
    emailConsent: true,
    turnstileToken: 'tt',
  };

  it('posts the whole form to legacy /signup with the flag off and returns its body', async () => {
    mockedEnabled.mockReturnValue(false);
    const body = {
      results: user,
      access_token: 'a',
      refresh_token: 'r',
      claimedVillages: [],
    };
    mockedApi.post.mockResolvedValue({ data: body });

    await expect(signup(form)).resolves.toBe(body);
    expect(mockedApi.post).toHaveBeenCalledWith('/signup', form);
    expect(auth.signup.mutate).not.toHaveBeenCalled();
    expect(mockedApplyIsHuman).not.toHaveBeenCalled();
  });

  it('calls auth.signup with the flag on, renames user to results and applies isHuman', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.signup.mutate.mockResolvedValue({
      user,
      access_token: 'a',
      refresh_token: 'r',
      claimedVillages: ['v1'],
      isHuman: true,
    });

    await expect(signup(form)).resolves.toEqual({
      results: user,
      access_token: 'a',
      refresh_token: 'r',
      claimedVillages: ['v1'],
      isHuman: true,
    });
    expect(auth.signup.mutate).toHaveBeenCalledWith(form);
    expect(mockedApplyIsHuman).toHaveBeenCalledWith(
      expect.objectContaining({ isHuman: true }),
    );
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refused signup in legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.signup.mutate.mockRejectedValue(badRequest('Email already in use.'));

    const error = await failureOf(signup(form));
    expect(error.response).toEqual({
      status: 400,
      data: { error: 'Email already in use.' },
    });
  });
});

describe('requestPasswordReset', () => {
  it('posts email and Turnstile token to legacy /reset-password with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({
      data: { status: 'Password reset email sent.' },
    });

    await expect(
      requestPasswordReset({ email: 'ada@example.com', turnstileToken: 'tt' }),
    ).resolves.toEqual({ status: 'Password reset email sent.' });
    expect(mockedApi.post).toHaveBeenCalledWith('/reset-password', {
      email: 'ada@example.com',
      turnstileToken: 'tt',
    });
    expect(auth.requestPasswordReset.mutate).not.toHaveBeenCalled();
  });

  it('calls auth.requestPasswordReset with the form with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.requestPasswordReset.mutate.mockResolvedValue({
      status: 'Password reset email sent.',
    });

    await requestPasswordReset({
      email: 'ada@example.com',
      turnstileToken: 'tt',
    });
    expect(auth.requestPasswordReset.mutate).toHaveBeenCalledWith({
      email: 'ada@example.com',
      turnstileToken: 'tt',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('setPassword', () => {
  const input = { reset_token: 'rt', password: 'secret1' };

  it('posts to legacy /set-password with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { status: 'Password reset.' } });

    await expect(setPassword(input)).resolves.toEqual({
      status: 'Password reset.',
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/set-password', input);
    expect(auth.setPassword.mutate).not.toHaveBeenCalled();
  });

  it('calls auth.setPassword with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    auth.setPassword.mutate.mockResolvedValue({ status: 'Password reset.' });

    await expect(setPassword(input)).resolves.toEqual({
      status: 'Password reset.',
    });
    expect(auth.setPassword.mutate).toHaveBeenCalledWith(input);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
