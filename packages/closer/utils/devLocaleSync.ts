import { IntlErrorCode } from 'next-intl';

const DEBOUNCE_MS = 1200;
const SESSION_KEY = '__closer_locale_dev_sync_count';
const MAX_SESSION_SYNCS = 3;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight = false;

function isMissingMessageError(error: Error & { code?: string }): boolean {
  return (
    error.code === IntlErrorCode.MISSING_MESSAGE ||
    error.code === 'MISSING_MESSAGE'
  );
}

async function runDevLocaleSync(): Promise<void> {
  if (typeof window === 'undefined' || syncInFlight) {
    return;
  }

  const count = Number(window.sessionStorage.getItem(SESSION_KEY) || '0');
  if (count >= MAX_SESSION_SYNCS) {
    return;
  }

  syncInFlight = true;
  try {
    const res = await fetch('/api/dev/sync-locales', { method: 'POST' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[dev] locale bundle sync failed', res.status, text);
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, String(count + 1));
    console.info('[dev] Locale bundles regenerated; reloading.');
    window.location.reload();
  } catch (e) {
    console.error('[dev] locale bundle sync request failed', e);
  } finally {
    syncInFlight = false;
  }
}

export function handleDevMissingLocaleSync(
  error: Error & { code?: string },
): void {
  if (process.env.NODE_ENV !== 'development') {
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
    void runDevLocaleSync();
  }, DEBOUNCE_MS);
}
