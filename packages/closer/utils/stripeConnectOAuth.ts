import crypto from 'crypto';

import { STRIPE_CONNECT_OAUTH_STATE_COOKIE } from '../constants/shared.constants';

export function oauthStatesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  try {
    const left = new Uint8Array(Buffer.from(a, 'utf8'));
    const right = new Uint8Array(Buffer.from(b, 'utf8'));
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function readStripeConnectOAuthStateFromCookieHeader(
  cookieHeader: string | undefined,
): string | null {
  if (!cookieHeader) {
    return null;
  }
  const segments = cookieHeader.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const name = trimmed.slice(0, eq).trim();
    if (name !== STRIPE_CONNECT_OAUTH_STATE_COOKIE) {
      continue;
    }
    const rawValue = trimmed.slice(eq + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }
  return null;
}
