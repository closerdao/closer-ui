import { useCallback, useEffect, useState } from 'react';

import { Charge } from '../types/booking';
import api, { formatSearch } from '../utils/api';

export function useBookingLinkedCharges(
  bookingId: string | undefined,
  refreshKey?: unknown,
) {
  const [result, setResult] = useState<{
    bookingId: string;
    charges: Charge[];
  }>();
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState(false);

  const refetchCharges = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!bookingId) {
      setResult(undefined);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await api.get('/charge', {
          params: {
            where: formatSearch({
              linkedObjectType: 'Booking',
              linkedObjectId: bookingId,
              status: { $in: ['paid', 'refunded', 'pending-refund'] },
            }),
            sort: '-date',
            limit: 200,
          },
          cache: false,
        } as Parameters<typeof api.get>[1]);
        const rows = Array.isArray(res?.data?.results) ? res.data.results : [];
        if (!cancelled) setResult({ bookingId, charges: rows as Charge[] });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, tick, refreshKey]);

  return {
    linkedCharges:
      result?.bookingId === bookingId ? result?.charges : undefined,
    refetchCharges,
    loading,
    error,
  };
}
