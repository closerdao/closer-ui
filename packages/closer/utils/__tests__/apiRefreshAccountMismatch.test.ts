/**
 * The refresh token lives in localStorage, which is shared across tabs and can
 * hold a token from a different account than the one this session belongs to
 * (e.g. a background tab's proactive refresh racing an account switch). A
 * silent refresh must never switch the session to another account — it must
 * drop the session and force a fresh login instead.
 */
let accessToken: string | undefined;
let refreshToken: string | undefined;
let accountId: string | undefined;

jest.mock('../authStorage', () => ({
  getAccessToken: jest.fn(() => accessToken),
  getRefreshToken: jest.fn(() => refreshToken),
  getStoredAccountId: jest.fn(() => accountId),
  // Report the access token as already expired so refreshTokensProactively
  // always attempts a refresh.
  getAccessTokenExpiryMs: jest.fn(() => Date.now() - 1000),
  setTokens: jest.fn((access: string, refresh?: string) => {
    accessToken = access;
    refreshToken = refresh;
  }),
  setStoredAccountId: jest.fn((id: string) => {
    accountId = id;
  }),
  clearTokens: jest.fn(() => {
    accessToken = undefined;
    refreshToken = undefined;
    accountId = undefined;
  }),
}));

const {
  setTokens,
  setStoredAccountId,
  clearTokens,
} = jest.requireMock('../authStorage');

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
  ensureInteractionSession: jest.fn(async () => undefined),
  getStoredInteractionSessionKey: jest.fn(() => 'session-key'),
  refreshInteractionSession: jest.fn(async () => undefined),
}));

import axios from 'axios';

import { refreshTokensProactively, setOnSessionInvalid } from '../api';

const mockRefreshResponse = (userId: string) =>
  jest.spyOn(axios, 'post').mockResolvedValue({
    data: {
      access_token: `access-${userId}`,
      refresh_token: `refresh-${userId}`,
      results: { _id: userId },
    },
  });

describe('silent refresh across accounts', () => {
  const onSessionInvalid = jest.fn();

  beforeEach(() => {
    // Not restoreAllMocks: that would strip the implementations off the
    // jest.fn()s inside the authStorage module mock.
    jest.clearAllMocks();
    accessToken = 'access-user-a';
    refreshToken = 'refresh-user-a';
    accountId = 'user-a';
    setOnSessionInvalid(onSessionInvalid);
  });

  afterEach(() => {
    setOnSessionInvalid(null);
  });

  it('applies a refresh that returns the same account', async () => {
    mockRefreshResponse('user-a');

    const result = await refreshTokensProactively();

    expect(result?.results).toEqual({ _id: 'user-a' });
    expect(setTokens).toHaveBeenCalledWith('access-user-a', 'refresh-user-a');
    expect(setStoredAccountId).toHaveBeenCalledWith('user-a');
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });

  it('drops the session when the refresh resolves to a different account', async () => {
    mockRefreshResponse('user-b');

    const result = await refreshTokensProactively();

    expect(result).toBeNull();
    expect(setTokens).not.toHaveBeenCalled();
    expect(clearTokens).toHaveBeenCalled();
    expect(onSessionInvalid).toHaveBeenCalled();
  });

  it('accepts a refresh when no account id was stored, and backfills it', async () => {
    accountId = undefined;
    mockRefreshResponse('user-a');

    const result = await refreshTokensProactively();

    expect(result?.results).toEqual({ _id: 'user-a' });
    expect(setStoredAccountId).toHaveBeenCalledWith('user-a');
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });
});
