import type { AbstractIntlMessages } from 'next-intl';
import { IntlErrorCode } from 'next-intl';

const DEBOUNCE_MS = 1200;
const SESSION_KEY = '__closer_locale_dev_sync_count';
const MAX_SESSION_SYNCS = 3;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight = false;

let applyBaseLocaleMerge: ((base: AbstractIntlMessages) => void) | null = null;

export function registerDevLocaleBaseMerge(
  fn: (base: AbstractIntlMessages) => void,
): () => void {
  applyBaseLocaleMerge = fn;
  return () => {
    applyBaseLocaleMerge = null;
  };
}

function isMissingMessageError(error: Error & { code?: string }): boolean {
  return (
    error.code === IntlErrorCode.MISSING_MESSAGE ||
    error.code === 'MISSING_MESSAGE'
  );
}

function isLocalEnvironmentLocaleSync(): boolean {
  return process.env.CLOSER_LOCAL_LOCALE_MERGE === '1';
}

function baseLocalePublicName(localeKey: string): string {
  if (localeKey === 'pt') {
    return 'base-pt.json';
  }
  if (localeKey === 'pl') {
    return 'base-pl.json';
  }
  return 'base-en.json';
}

async function loadBaseLocaleMessages(
  localeKey: string,
): Promise<AbstractIntlMessages> {
  const name = baseLocalePublicName(localeKey);
  const res = await fetch(`/__closer_dev_locales/${name}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`fetch ${name} failed: ${res.status}`);
  }
  return (await res.json()) as AbstractIntlMessages;
}

function appOverlayLocaleFilename(localeKey: string): string {
  if (localeKey === 'pt') {
    return 'pt';
  }
  if (localeKey === 'pl') {
    return 'pl';
  }
  return 'en';
}

async function loadMergedLocalLocaleMessages(
  localeKey: string,
): Promise<AbstractIntlMessages> {
  const base = await loadBaseLocaleMessages(localeKey);
  const rawApp = process.env.NEXT_PUBLIC_APP_NAME?.trim();
  const appName =
    rawApp && /^[a-z0-9-]+$/i.test(rawApp) ? rawApp.toLowerCase() : '';
  if (!appName) {
    return base;
  }
  const locFile = appOverlayLocaleFilename(localeKey);
  const res = await fetch(
    `/__closer_dev_locales/apps/${appName}/${locFile}.json`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    return base;
  }
  const overlay = (await res.json()) as AbstractIntlMessages;
  return { ...base, ...overlay };
}

async function runDevLocaleSync(localeKey: string): Promise<void> {
  if (typeof window === 'undefined' || syncInFlight) {
    return;
  }

  const count = Number(window.sessionStorage.getItem(SESSION_KEY) || '0');
  if (count >= MAX_SESSION_SYNCS) {
    return;
  }

  syncInFlight = true;
  try {
    const merged = await loadMergedLocalLocaleMessages(localeKey);
    applyBaseLocaleMerge?.(merged);
    window.sessionStorage.setItem(SESSION_KEY, String(count + 1));
    console.info(
      '[dev] Merged latest base + app locale JSON into next-intl messages.',
    );
  } catch (e) {
    console.error('[dev] locale merge failed', e);
  } finally {
    syncInFlight = false;
  }
}

export function handleDevMissingLocaleSync(
  error: Error & { code?: string },
  locale: string,
): void {
  if (!isLocalEnvironmentLocaleSync()) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  if (!isMissingMessageError(error)) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runDevLocaleSync(locale || 'en');
  }, DEBOUNCE_MS);
}
