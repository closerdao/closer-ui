/**
 * The access token lives in a cookie while the refresh token lives in
 * localStorage. These two stores must never diverge across an account
 * switch — a stale refresh token from a previous account lets the silent
 * refresh flow log the user back into that account.
 */
const cookieStore = new Map<string, string>();
const cookieSetOptions = new Map<string, Record<string, unknown>>();

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: {
    get: jest.fn((name: string) => cookieStore.get(name)),
    set: jest.fn(
      (name: string, value: string, options: Record<string, unknown>) => {
        cookieStore.set(name, value);
        cookieSetOptions.set(name, options);
      },
    ),
    remove: jest.fn((name: string) => {
      cookieStore.delete(name);
      cookieSetOptions.delete(name);
    }),
  },
}));

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredAccountId,
  setStoredAccountId,
  setTokens,
} from '../authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    cookieStore.clear();
    cookieSetOptions.clear();
    localStorage.clear();
  });

  it('stores both tokens when a refresh token is provided', () => {
    setTokens('access-new', 'refresh-new');

    expect(getAccessToken()).toBe('access-new');
    expect(getRefreshToken()).toBe('refresh-new');
  });

  it('removes a stale refresh token when the new login has none', () => {
    // Previous account's session.
    setTokens('access-old', 'refresh-old');

    // New account logs in but the response carried no refresh token.
    setTokens('access-new');

    expect(getAccessToken()).toBe('access-new');
    expect(getRefreshToken()).toBeUndefined();
  });

  it('clearTokens wipes access token, refresh token and account id', () => {
    setTokens('access', 'refresh');
    setStoredAccountId('user-a');

    clearTokens();

    expect(getAccessToken()).toBeUndefined();
    expect(getRefreshToken()).toBeUndefined();
    expect(getStoredAccountId()).toBeUndefined();
  });

  it('sets the access cookie to expire in 90 minutes, in days as js-cookie expects', () => {
    setTokens('access', 'refresh');

    const options = cookieSetOptions.get('access_token');
    expect(options?.expires).toBeCloseTo(90 / (60 * 24), 10);
  });
});
