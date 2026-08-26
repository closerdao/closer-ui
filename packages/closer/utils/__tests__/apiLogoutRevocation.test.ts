/**
 * Logout revokes the refresh token server-side (POST /auth/logout) so the
 * token can't keep minting sessions after the user leaves. Revocation is
 * best-effort: local logout must complete even when the endpoint is missing
 * or down, and the call must bypass the api instance so a 401 can never
 * trigger the refresh-and-retry interceptor mid-logout.
 */
let accessToken: string | undefined;
let refreshToken: string | undefined;

jest.mock('../authStorage', () => ({
  getAccessToken: jest.fn(() => accessToken),
  getRefreshToken: jest.fn(() => refreshToken),
  getStoredAccountId: jest.fn(() => undefined),
  getAccessTokenExpiryMs: jest.fn(() => null),
  setTokens: jest.fn(),
  setStoredAccountId: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
  ensureInteractionSession: jest.fn(async () => undefined),
  getStoredInteractionSessionKey: jest.fn(() => 'session-key'),
  refreshInteractionSession: jest.fn(async () => undefined),
}));

import axios from 'axios';

import { revokeRefreshToken } from '../api';

describe('revokeRefreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    accessToken = 'access-user-a';
    refreshToken = 'refresh-user-a';
  });

  afterEach(() => {
    (axios.post as unknown as jest.Mock).mockRestore?.();
  });

  it('posts the refresh token to /auth/logout with the bearer token', async () => {
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await revokeRefreshToken();

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, body, config] = spy.mock.calls[0];
    expect(url).toMatch(/\/auth\/logout$/);
    expect(body).toEqual({ refresh_token: 'refresh-user-a' });
    expect((config as any).headers.Authorization).toBe('Bearer access-user-a');
  });

  it('does nothing when there is no refresh token to revoke', async () => {
    refreshToken = undefined;
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await revokeRefreshToken();

    expect(spy).not.toHaveBeenCalled();
  });

  it('swallows endpoint failures so logout can proceed locally', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('404 Not Found'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(revokeRefreshToken()).resolves.toBeUndefined();

    errorSpy.mockRestore();
  });

  it('omits the Authorization header when the access cookie already expired', async () => {
    accessToken = undefined;
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await revokeRefreshToken();

    const [, , config] = spy.mock.calls[0];
    expect((config as any).headers.Authorization).toBeUndefined();
  });
});
