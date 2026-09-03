import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppConfigForStandardPages } from '../constants/standardPages';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import api from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import {
  FIRST_STEPS_SETTINGS_KEY,
  FirstStepsFacts,
  FirstStepsProgress,
  FirstStepsUserState,
  emptyFirstStepsFacts,
  emptyFirstStepsUserState,
  firstStepsStorageKey,
  getFirstStepsProgress,
  mergeFirstStepsUserState,
  parseFirstStepsUserState,
} from '../utils/firstSteps.helpers';
import { PageListItem, mergeEditorPages } from '../utils/standardPages';
import { mergeUserSettings } from '../utils/userSettings.helpers';

/**
 * What `/first-steps` and the dashboard banner both need: the live state of the
 * instance, this user's skips, and the progress derived from the two.
 *
 * Config is read through `platform.config`, never `useConfig()`. The rest of
 * the app runs off a snapshot frozen at build time, so a setup wizard reading
 * that would show a brand-new village an empty instance however much they had
 * just saved.
 */

/** Config groups needed to derive progress and render the steps. */
const READ_SLUGS_HINT = 200;

export interface UseFirstStepsStatus {
  facts: FirstStepsFacts;
  progress: FirstStepsProgress;
  liveConfig: Record<string, any>;
  userState: FirstStepsUserState;
  persistUserState: (next: FirstStepsUserState) => Promise<void>;
  /** Re-read config, pages and inventory after a write. */
  reload: () => Promise<void>;
  reloadPages: () => Promise<void>;
  /** Record that a deploy was triggered; persists with the rest of the state. */
  markDeployed: () => Promise<void>;
  isLoaded: boolean;
  error: string | null;
  setError: (value: string | null) => void;
}

/**
 * `enabled: false` keeps the dashboard from paying for the fetches when the
 * viewer could never act on them.
 */
export const useFirstStepsStatus = (enabled = true): UseFirstStepsStatus => {
  const { user, refetchUser } = useAuth();
  const { platform }: any = usePlatform();

  const [liveConfig, setLiveConfig] = useState<Record<string, any>>({});
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [foodCount, setFoodCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userState, setUserState] = useState<FirstStepsUserState>(
    emptyFirstStepsUserState,
  );

  const hasLoadedUserState = useRef(false);
  const configRef = useRef<Record<string, any>>({});

  const loadConfig = useCallback(async () => {
    const rows = await platform.config.get();
    const list = rows?.results?.toJS?.() ?? rows?.toJS?.() ?? [];
    const bySlug: Record<string, any> = {};
    (Array.isArray(list) ? list : []).forEach((row: any) => {
      if (row?.slug) bySlug[row.slug] = row.value ?? {};
    });
    configRef.current = bySlug;
    setLiveConfig(bySlug);
    return bySlug;
  }, [platform]);

  const loadPagesFor = useCallback(async (config: Record<string, any>) => {
    // A failed platform read resolves undefined rather than throwing, so an
    // empty list and a refused request look identical here. Treating both as
    // "no pages" is right for a wizard: it re-derives on every load.
    const response = await api
      .get('/page', { params: { limit: READ_SLUGS_HINT } })
      .catch(() => null);
    const dbPages: PageListItem[] = response?.data?.results ?? [];
    setPages(mergeEditorPages(dbPages, config as AppConfigForStandardPages));
  }, []);

  const loadInventory = useCallback(async () => {
    const [listings, food] = await Promise.all([
      api.get('/listing', { params: { limit: 1 } }).catch(() => null),
      api.get('/food', { params: { limit: 1 } }).catch(() => null),
    ]);
    setListingCount(
      listings?.data?.total ?? listings?.data?.results?.length ?? 0,
    );
    setFoodCount(food?.data?.total ?? food?.data?.results?.length ?? 0);
  }, []);

  const reload = useCallback(async () => {
    try {
      const config = await loadConfig();
      await Promise.all([loadPagesFor(config), loadInventory()]);
    } catch (err) {
      setError(parseMessageFromError(err));
    }
  }, [loadConfig, loadPagesFor, loadInventory]);

  const reloadPages = useCallback(
    () => loadPagesFor(configRef.current),
    [loadPagesFor],
  );

  useEffect(() => {
    if (!enabled || !user) return;
    let cancelled = false;

    (async () => {
      await reload();
      if (!cancelled) setIsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user, reload]);

  /**
   * Skips live on the user record and are mirrored locally, so one made while
   * the patch is still in flight survives a refetch. Union both, the way the
   * token onboarding flow does with quest claims.
   */
  useEffect(() => {
    if (!user?._id || hasLoadedUserState.current) return;
    hasLoadedUserState.current = true;

    const remote = parseFirstStepsUserState(
      (user as any)?.settings?.[FIRST_STEPS_SETTINGS_KEY],
    );

    let local = emptyFirstStepsUserState();
    try {
      const raw = window.localStorage.getItem(firstStepsStorageKey(user._id));
      if (raw) local = parseFirstStepsUserState(JSON.parse(raw));
    } catch {
      // A private window or cleared storage just means no local mirror.
    }

    setUserState(mergeFirstStepsUserState(local, remote));
  }, [user]);

  const persistUserState = useCallback(
    async (next: FirstStepsUserState) => {
      setUserState(next);
      if (!user?._id) return;

      try {
        window.localStorage.setItem(
          firstStepsStorageKey(user._id),
          JSON.stringify(next),
        );
      } catch {
        // Non-fatal; the user record below is the source of truth.
      }

      try {
        // `PATCH /user/:id` replaces `settings` wholesale, so this must go
        // through mergeUserSettings or it wipes unrelated keys.
        await platform.user.patch(user._id, {
          settings: mergeUserSettings(user as any, {
            [FIRST_STEPS_SETTINGS_KEY]: next,
          }),
        });
        await refetchUser();
      } catch (err) {
        setError(parseMessageFromError(err));
      }
    },
    [platform, user, refetchUser],
  );

  const markDeployed = useCallback(
    () => persistUserState({ ...userState, hasDeployed: true }),
    [persistUserState, userState],
  );

  const facts: FirstStepsFacts = useMemo(
    () => ({
      ...emptyFirstStepsFacts(),
      config: liveConfig,
      pages,
      listingCount,
      foodCount,
      skipped: userState.skipped,
      hasDeployed: userState.hasDeployed,
    }),
    [
      liveConfig,
      pages,
      listingCount,
      foodCount,
      userState.skipped,
      userState.hasDeployed,
    ],
  );

  const progress = useMemo(() => getFirstStepsProgress(facts), [facts]);

  return {
    facts,
    progress,
    liveConfig,
    userState,
    persistUserState,
    reload,
    reloadPages,
    markDeployed,
    isLoaded,
    error,
    setError,
  };
};

export default useFirstStepsStatus;
