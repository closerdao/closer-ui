import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  Quest,
  QuestAction,
  QuestLeaderboard,
  QuestMe,
} from '../types/quest';
import {
  getMyQuestActions,
  getQuestLeaderboard,
  getQuestMe,
} from '../utils/quests.api';
import { isQuestOpen } from '../utils/quests.helpers';

/** How often an open quest re-pulls the standings. */
const POLL_INTERVAL_MS = 30 * 1000;

/**
 * Sentinel returned by a fetch that threw. Distinct from a legitimately empty
 * result (`null`/`[]`) so a transient failure can preserve the last good value
 * instead of wiping the standings the member is currently looking at.
 */
const FETCH_FAILED = Symbol('quest-fetch-failed');

interface Options {
  quest: Quest | null;
  isAuthenticated: boolean;
  pollIntervalMs?: number;
}

/**
 * Everything on a quest page that is derived rather than stored — the caller's
 * entry, the leaderboard and their own action history. Tickets are aggregated
 * backend-side rather than driven by anything the member does here, so an open
 * quest pulls the standings on an interval instead of waiting for a reload.
 * Polling pauses while the tab is hidden and catches up when it comes back.
 */
export const useQuestLiveData = ({
  quest,
  isAuthenticated,
  pollIntervalMs = POLL_INTERVAL_MS,
}: Options) => {
  const [me, setMe] = useState<QuestMe | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuestLeaderboard | null>(null);
  const [myActions, setMyActions] = useState<QuestAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const slug = quest?.slug;
  const questId = quest?._id;
  const leaderboardSize = quest?.raffleConfig?.leaderboardSize;
  // A raffle can switch the leaderboard off; a singleAction quest always has one.
  const showLeaderboard =
    quest?.type !== 'raffle' || quest?.raffleConfig?.showLeaderboard !== false;
  const isOpen = quest ? isQuestOpen(quest) : false;

  const isFetchingRef = useRef(false);

  const refresh = useCallback(
    async ({ quiet }: { quiet?: boolean } = {}) => {
      if (!slug || isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!quiet) setIsLoading(true);
      try {
        const [meResults, leaderboardResults, actions] = await Promise.all([
          isAuthenticated
            ? getQuestMe(slug).catch(() => FETCH_FAILED)
            : null,
          showLeaderboard
            ? getQuestLeaderboard(slug, { limit: leaderboardSize }).catch(
                () => FETCH_FAILED,
              )
            : null,
          isAuthenticated && questId
            ? getMyQuestActions(questId).catch(() => FETCH_FAILED)
            : [],
        ]);
        // A failed fetch keeps the last good value rather than blanking the UI;
        // this matters most for background polls, where a transient blip would
        // otherwise flash the standings back to their empty state.
        if (meResults !== FETCH_FAILED) setMe(meResults);
        if (leaderboardResults !== FETCH_FAILED)
          setLeaderboard(leaderboardResults);
        if (actions !== FETCH_FAILED) setMyActions(actions);
        setLastUpdated(Date.now());
      } finally {
        isFetchingRef.current = false;
        if (!quiet) setIsLoading(false);
      }
    },
    [slug, questId, isAuthenticated, showLeaderboard, leaderboardSize],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!slug || !isOpen || pollIntervalMs <= 0) return;
    if (typeof document === 'undefined') return;

    const tick = () => {
      if (document.hidden) return;
      refresh({ quiet: true });
    };
    const interval = setInterval(tick, pollIntervalMs);
    // Coming back to a stale tab should not wait out the rest of the interval.
    const onVisible = () => {
      if (!document.hidden) refresh({ quiet: true });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [slug, isOpen, pollIntervalMs, refresh]);

  return {
    me,
    leaderboard,
    myActions,
    isLoading,
    lastUpdated,
    refresh,
    isLive: isOpen,
  };
};

export default useQuestLiveData;
