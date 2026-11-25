import { useCallback, useEffect, useState } from 'react';

import { Charge } from '../types/booking';
import { listCharges } from '../utils/charges';

export function useBookingLinkedCharges(bookingId: string | undefined) {
  const [linkedCharges, setLinkedCharges] = useState<Charge[] | undefined>(
    undefined,
  );
  const [tick, setTick] = useState(0);

  const refetchCharges = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!bookingId) {
      setLinkedCharges(undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await listCharges(
          {
            linkedObjectType: 'Booking',
            linkedObjectId: bookingId,
            status: { $in: ['paid', 'refunded'] },
          },
          { limit: 200, cache: false, encodeWhere: true },
        );
        const rows = Array.isArray(res?.data?.results) ? res.data.results : [];
        if (!cancelled) setLinkedCharges(rows as Charge[]);
      } catch {
        if (!cancelled) setLinkedCharges([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, tick]);

  return { linkedCharges, refetchCharges };
}
