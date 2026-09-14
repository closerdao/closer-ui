import { useCallback, useEffect, useRef, useState } from 'react';

import { GeocodeResult, searchPlaces } from '../utils/geocode.helpers';

/**
 * One place lookup at a time against `/api/places/search`, shared by every
 * address field (profile homes, the village form).
 *
 * The search is an explicit action rather than a per-keystroke effect —
 * Nominatim's usage policy rules out autocomplete — so callers decide when to
 * fire it (button, Enter) and `clear` when the text changes underneath a
 * result list. A newer search aborts the one in flight, so results never
 * arrive out of order.
 */
export const usePlaceSearch = () => {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setResults([]);
    setIsLoading(false);
    setHasFailed(false);
  }, []);

  const search = useCallback(
    async (value: string) => {
      if (value.trim().length < 2) {
        clear();
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setHasFailed(false);
      try {
        const places = await searchPlaces(value, controller.signal);
        if (!controller.signal.aborted) setResults(places);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setResults([]);
          setHasFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [clear],
  );

  return { results, isLoading, hasFailed, search, clear };
};
