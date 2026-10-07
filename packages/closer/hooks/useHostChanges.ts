import { useCallback, useEffect, useState } from 'react';

import type { HostChangeEntry } from '../types/stay';
import { getStayChanges } from '../utils/stays.api';

/** The newest host change on a stay, for the "Last changed by" hint. Pass no id for a guest. */
export function useHostChanges(stayId: string | undefined) {
  const [latest, setLatest] = useState<HostChangeEntry | null>(null);
  const [tick, setTick] = useState(0);

  const refetchHostChanges = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!stayId) {
      setLatest(null);
      return undefined;
    }
    let cancelled = false;
    getStayChanges(stayId)
      .then((page) => {
        if (!cancelled) setLatest(page.entries[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setLatest(null);
      });
    return () => {
      cancelled = true;
    };
  }, [stayId, tick]);

  return { latestHostChange: latest, refetchHostChanges };
}
