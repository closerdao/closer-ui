import Cookies from 'js-cookie';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_STORAGE = 'refresh_token';
const ACCOUNT_ID_STORAGE = 'auth_account_id';

const ACCESS_TOKEN_MAX_AGE_MINUTES = 90;
// js-cookie interprets `expires` as days.
const ACCESS_TOKEN_MAX_AGE_DAYS = ACCESS_TOKEN_MAX_AGE_MINUTES / (60 * 24);

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE) ?? undefined;
}

export function setAccessToken(token: string): void {
  Cookies.set(ACCESS_TOKEN_COOKIE, token, {
    expires: ACCESS_TOKEN_MAX_AGE_DAYS,
    sameSite: 'strict',
    secure: true,
  });
}

export function getStoredAccountId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ACCOUNT_ID_STORAGE) ?? undefined;
}

export function setStoredAccountId(accountId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCOUNT_ID_STORAGE, accountId);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE, token);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  setAccessToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  } else if (typeof window !== 'undefined') {
    // A stale refresh token from a previous account must not outlive the
    // access token it was issued with, or the next silent refresh switches
    // the session back to that account.
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE);
  }
}

export function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE);
    window.localStorage.removeItem(ACCOUNT_ID_STORAGE);
  }
}

export function getAccessTokenExpiryMs(): number | null {
  const token = getAccessToken();
  if (!token || typeof window === 'undefined') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decoded = JSON.parse(atob(base64));
    const exp = decoded?.exp;
    if (typeof exp !== 'number') return null;
    return exp * 1000;
  } catch {
    return null;
  }
}
