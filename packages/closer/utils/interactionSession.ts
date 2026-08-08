import axios from 'axios';

import {
  INTERACTION_IS_HUMAN_EVENT,
  INTERACTION_IS_HUMAN_LOCAL_STORAGE_KEY,
  INTERACTION_SESSION_LOCAL_STORAGE_KEY,
} from '../constants';
import type { InteractionInitApiResponse } from '../types/interaction';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

function getUtmFromLocation(): Record<string, string> | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ] as const;
  const utm: Record<string, string> = {};
  for (const k of utmKeys) {
    const v = params.get(k);
    if (v) utm[k] = v;
  }
  return Object.keys(utm).length > 0 ? utm : undefined;
}

function buildInitBody(): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  try {
    body.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    //
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    body.acceptLanguage = navigator.language;
  }
  if (typeof window !== 'undefined') {
    body.screen = `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`;
    body.viewport = `${window.innerWidth ?? 0}x${window.innerHeight ?? 0}`;
    const ref = document.referrer;
    if (ref) body.referrer = ref;
    const utm = getUtmFromLocation();
    if (utm) body.utm = utm;
  }
  return body;
}

export function getStoredInteractionIsHuman(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(INTERACTION_IS_HUMAN_LOCAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setStoredInteractionIsHuman(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      localStorage.setItem(INTERACTION_IS_HUMAN_LOCAL_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(INTERACTION_IS_HUMAN_LOCAL_STORAGE_KEY);
    }
  } catch {
    //
  }
}

export function applyInteractionIsHumanFromResponse(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  if ((data as { isHuman?: boolean }).isHuman !== true) return;
  if (getStoredInteractionIsHuman()) return;
  setStoredInteractionIsHuman(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INTERACTION_IS_HUMAN_EVENT));
  }
}

// Re-init this long before the token actually expires, so a request never goes
// out with a key the API is about to reject.
const SESSION_EXPIRY_BUFFER_MS = 60 * 1000;

/**
 * The session key is a JWT signed by the API. Read its `exp` so we can treat an
 * expired (or unparseable) key as absent instead of sending one the API will
 * reject — an anonymous POST with a stale key gets a 401.
 */
function getSessionKeyExpiryMs(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof decoded.exp !== 'number') return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

export function getStoredInteractionSessionKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(INTERACTION_SESSION_LOCAL_STORAGE_KEY);
    if (!v || v.length === 0) return null;
    const expiryMs = getSessionKeyExpiryMs(v);
    // A key we cannot parse is not one the API will accept either.
    if (expiryMs === null) return null;
    if (expiryMs <= Date.now() + SESSION_EXPIRY_BUFFER_MS) return null;
    return v;
  } catch {
    return null;
  }
}

function setStoredInteractionSessionKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTERACTION_SESSION_LOCAL_STORAGE_KEY, key);
  } catch {
    //
  }
}

let inflightInit: Promise<void> | null = null;

export async function ensureInteractionSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!baseURL) return;
  if (getStoredInteractionSessionKey()) return;
  if (!inflightInit) {
    inflightInit = (async () => {
      try {
        const res = await axios.post<InteractionInitApiResponse>(
          `${baseURL}/interaction/init`,
          buildInitBody(),
          { headers: { 'Content-Type': 'application/json' } },
        );
        const key = res?.data?.results?.sessionkey;
        if (typeof key === 'string' && key.length > 0) {
          setStoredInteractionSessionKey(key);
        }
      } catch (error: unknown) {
        const err = error as {
          response?: { status?: number; headers?: { 'retry-after'?: string } };
        };
        const status = err?.response?.status;
        if (status === 429) {
          const ra = err?.response?.headers?.['retry-after'];
          console.warn(
            'Interaction session init rate limited (429).',
            ra !== undefined ? `Retry-After: ${ra}` : '',
          );
        } else {
          console.error('Interaction session init failed:', error);
        }
      }
    })().finally(() => {
      inflightInit = null;
    });
  }
  await inflightInit;
}

/**
 * Drop the current key and get a new one. Used when the API rejects a request
 * that should have been allowed by the interaction session, so an anonymous
 * visitor can recover without reloading or clearing storage by hand.
 */
export async function refreshInteractionSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTERACTION_SESSION_LOCAL_STORAGE_KEY);
  } catch {
    //
  }
  await ensureInteractionSession();
}

export function clearInteractionSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTERACTION_SESSION_LOCAL_STORAGE_KEY);
    localStorage.removeItem(INTERACTION_IS_HUMAN_LOCAL_STORAGE_KEY);
  } catch {
    //
  }
}
