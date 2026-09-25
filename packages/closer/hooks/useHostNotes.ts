import { useCallback, useEffect, useState } from 'react';

import type { HostNote } from '../types/stay';
import { getHostNotes } from '../utils/stays.api';

/** Host notes for a list of stays, by id. Pass no ids for a viewer who is not a host. */
export function useHostNotes(stayIds: string[] | undefined) {
  const [notes, setNotes] = useState<Record<string, HostNote>>({});
  const [tick, setTick] = useState(0);
  const key = stayIds?.join(',') ?? '';

  const refetchHostNotes = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!key) {
      setNotes({});
      return undefined;
    }
    let cancelled = false;
    getHostNotes(key.split(','))
      .then((found) => {
        if (!cancelled) setNotes(found);
      })
      .catch(() => {
        if (!cancelled) setNotes({});
      });
    return () => {
      cancelled = true;
    };
  }, [key, tick]);

  return { hostNotes: notes, refetchHostNotes };
}
