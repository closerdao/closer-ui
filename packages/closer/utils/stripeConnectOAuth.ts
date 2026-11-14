import crypto from 'crypto';
import type { IncomingMessage } from 'http';

import { STRIPE_CONNECT_OAUTH_STATE_COOKIE } from '../constants/shared.constants';
import { STRIPE_CONNECT_OAUTH_RETURN_TO_COOKIE } from '../constants/shared.constants';

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

function readNamedCookie(
  cookieHeader: string | undefined,
  cookieName: string,
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
    if (name !== cookieName) {
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

export function readStripeConnectOAuthStateFromCookieHeader(
  cookieHeader: string | undefined,
): string | null {
  return readNamedCookie(cookieHeader, STRIPE_CONNECT_OAUTH_STATE_COOKIE);
}

export function readStripeConnectReturnToFromCookieHeader(
  cookieHeader: string | undefined,
): string | null {
  return readNamedCookie(cookieHeader, STRIPE_CONNECT_OAUTH_RETURN_TO_COOKIE);
}

export function requestOrigin(req: IncomingMessage | undefined): string {
  if (!req?.headers?.host) {
    return '';
  }
  const host = req.headers.host;
  let proto = 'https';
  const xf = req.headers['x-forwarded-proto'];
  if (typeof xf === 'string') {
    proto = xf.split(',')[0]?.trim() ?? proto;
  } else if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    proto = 'http';
  }
  return `${proto}://${host}`;
}
