import { useEffect, useMemo, useState } from 'react';

import { configDescription } from '../config';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { getDefaultConfigValue } from '../utils/config.utils';

export const BOOKING_CONFIG_SLUG = 'booking';

/**
 * `configCached` is a build-time snapshot committed to git
 * (`generated/appConfig.snapshot.json`). Anything read from it only changes on
 * a rebuild + redeploy, so a toggle flipped in `/admin/config` is invisible to
 * the running site. This hook layers the live `booking` config document on top
 * of that snapshot at runtime.
 *
 * Two properties are load-bearing and must not be regressed:
 *
 * 1. The snapshot is always the fallback. A failed, slow, or empty fetch leaves
 *    the caller with exactly the value it renders today — a config outage must
 *    never blank or crash a page.
 * 2. There is no "loading" state. The snapshot value is returned synchronously
 *    on first render, so values that gate rendering (`enabled`) never flicker
 *    through a falsy intermediate.
 *
 * The fetch is gated on an authenticated session so that unauthenticated guest
 * page loads do not gain an extra request.
 */

type LiveConfigValue = Record<string, unknown>;

const isNonEmptyObject = (value: unknown): value is LiveConfigValue =>
  value != null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value as object).length > 0;

/**
 * The platform store holds the *raw* API document, whereas `configCached`
 * exposes defaults-merged values (see `buildMergedConfig`). Merging the live
 * value over `getDefaultConfigValue` reproduces what a rebuild would have
 * produced, rather than handing callers a document missing every key ops never
 * explicitly set (`enabled` among them, whose default is `false`).
 */
export const mergeLiveBookingConfig = <T>(
  cachedConfig: T,
  liveValue: unknown,
): T => {
  if (!isNonEmptyObject(liveValue)) return cachedConfig;
  const defaults = getDefaultConfigValue(
    BOOKING_CONFIG_SLUG,
    configDescription as any[],
  );
  return { ...defaults, ...liveValue } as T;
};

/**
 * Reads the booking value out of the action `getOne` resolves with.
 *
 * It must come from the action, NOT from `platform.config.findOne`. `findOne`
 * reads `stateRef.current` (`contexts/platform/platform.js:322`), which the
 * provider assigns in its *render body* (`:311-312`), while `getOne` dispatches
 * `GET_ONE_SUCCESS` inside a `.then()` (`:384`). The await continuation here is
 * a microtask and React's re-render is a macrotask, so a store read immediately
 * after awaiting is guaranteed to miss and this hook would silently never apply
 * the live value. `getOne` returns the dispatched action (`:377-385`), so the
 * data is already in hand and no re-render has to have happened.
 */
export const readBookingConfigFromAction = (action: any): unknown => {
  try {
    const results = action?.results;
    if (results == null) return null;
    const value =
      typeof results.get === 'function' ? results.get('value') : results.value;
    if (value == null) return null;
    return typeof value?.toJS === 'function' ? value.toJS() : value;
  } catch {
    return null;
  }
};

/**
 * Fetches the live `booking` config once per mount and merges it over the
 * build-time snapshot the caller already has. Returns the snapshot unchanged
 * until (and unless) a usable live value arrives.
 */
export const useLiveBookingConfig = <T>(cachedConfig: T): T => {
  const { platform } = usePlatform() as { platform: any };
  const { isAuthenticated } = useAuth();
  const [liveValue, setLiveValue] = useState<LiveConfigValue | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      let action: unknown;
      try {
        action = await platform?.config?.getOne?.(BOOKING_CONFIG_SLUG, {
          force: true,
        });
      } catch {
        // Keep the snapshot — a config outage must not change what renders.
        return;
      }
      if (cancelled) return;
      const raw = readBookingConfigFromAction(action);
      if (isNonEmptyObject(raw)) setLiveValue(raw);
    })();
    return () => {
      cancelled = true;
    };
  }, [platform, isAuthenticated]);

  return useMemo(
    () => mergeLiveBookingConfig(cachedConfig, liveValue),
    [cachedConfig, liveValue],
  );
};

export default useLiveBookingConfig;
