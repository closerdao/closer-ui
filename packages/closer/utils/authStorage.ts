import Cookies from 'js-cookie';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_STORAGE = 'refresh_token';

const ACCESS_TOKEN_MAX_AGE_MINUTES = 90;

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
    expires: ACCESS_TOKEN_MAX_AGE_MINUTES / 60,
    sameSite: 'strict',
    secure: true,
  });
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE, token);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  setAccessToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

export function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE);
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
