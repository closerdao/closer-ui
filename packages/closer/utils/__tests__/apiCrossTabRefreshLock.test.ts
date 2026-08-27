/**
 * The refresh token lives in localStorage, shared by every tab of the
 * origin, but the backend rotates it single-use: a second /auth/refresh
 * call with an already-consumed token gets a 401. Two tabs racing to
 * refresh at the same time must not both hit the network -- one refreshes,
 * the rest wait for it and reuse the tokens it wrote to storage. See
 * api.js's REFRESH_LOCK_* helpers and coordinateCrossTabRefresh.
 */
let accessToken: string | undefined;
let refreshToken: string | undefined;
let accountId: string | undefined;

jest.mock('../authStorage', () => ({
  getAccessToken: jest.fn(() => accessToken),
  getRefreshToken: jest.fn(() => refreshToken),
  getStoredAccountId: jest.fn(() => accountId),
  // Always report the access token as expired so refreshTokensProactively
  // attempts a refresh every time it's called.
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

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
  ensureInteractionSession: jest.fn(async () => undefined),
  getStoredInteractionSessionKey: jest.fn(() => 'session-key'),
  refreshInteractionSession: jest.fn(async () => undefined),
}));

import axios from 'axios';

import { refreshTokensProactively } from '../api';

const LOCK_KEY = 'closer_refresh_token_lock';

const mockRefreshResponse = (userId: string) =>
  jest.spyOn(axios, 'post').mockResolvedValue({
    data: {
      access_token: `access-${userId}`,
      refresh_token: `refresh-${userId}`,
      results: { _id: userId },
    },
  });

describe('cross-tab refresh lock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    accessToken = 'access-old';
    refreshToken = 'refresh-old';
    accountId = 'user-a';
  });

  it('waits for another tab holding a fresh lock and reuses its tokens instead of refreshing again', async () => {
    // Simulate another tab that just started refreshing.
    window.localStorage.setItem(
      LOCK_KEY,
      JSON.stringify({ owner: 'other-tab', ts: Date.now() }),
    );
    const postSpy = mockRefreshResponse('user-a');

    // Simulate the other tab finishing shortly after: it releases the lock
    // and writes the rotated tokens to storage.
    setTimeout(() => {
      accessToken = 'access-from-other-tab';
      refreshToken = 'refresh-from-other-tab';
      window.localStorage.removeItem(LOCK_KEY);
    }, 200);

    const result = await refreshTokensProactively();

    expect(postSpy).not.toHaveBeenCalled();
    expect(accessToken).toBe('access-from-other-tab');
    expect(refreshToken).toBe('refresh-from-other-tab');
    expect(result).toEqual({ results: null });
  }, 10000);

  it('reclaims a stale lock left behind by a crashed/closed tab and refreshes normally', async () => {
    // A lock far older than the staleness window -- the owning tab is gone.
    window.localStorage.setItem(
      LOCK_KEY,
      JSON.stringify({ owner: 'dead-tab', ts: Date.now() - 60000 }),
    );
    const postSpy = mockRefreshResponse('user-a');

    const result = await refreshTokensProactively();

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(result?.results).toEqual({ _id: 'user-a' });
    expect(window.localStorage.getItem(LOCK_KEY)).toBeNull();
  });

  it('falls back to a direct refresh when localStorage throws (private mode / blocked storage)', async () => {
    const setItemSpy = jest
      .spyOn(window.localStorage.__proto__, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage blocked');
      });
    const postSpy = mockRefreshResponse('user-a');

    const result = await refreshTokensProactively();

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(result?.results).toEqual({ _id: 'user-a' });

    setItemSpy.mockRestore();
  });

  it('releases the lock after a failed refresh so a later refresh is not blocked', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('network down'));

    await expect(refreshTokensProactively()).resolves.toBeNull();

    expect(window.localStorage.getItem(LOCK_KEY)).toBeNull();
  });
});
