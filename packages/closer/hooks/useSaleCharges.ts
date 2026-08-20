import { useEffect, useState } from 'react';

import type { SaleChargeRecord } from '../types/api';
import api, { formatSearch } from '../utils/api';

/**
 * Loads the charges booked against a sale. The sale itself only stores charge
 * ids, so validating a sale means reading the charge rows they point at.
 */
export function useSaleCharges(saleId: string | undefined) {
  const [charges, setCharges] = useState<SaleChargeRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) {
      setCharges(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await api.get('/charge', {
          params: {
            where: formatSearch({ saleId }),
            sort: '-date',
            limit: 100,
          },
          cache: false,
        } as Parameters<typeof api.get>[1]);
        const rows = Array.isArray(res?.data?.results) ? res.data.results : [];
        if (!cancelled) setCharges(rows as SaleChargeRecord[]);
      } catch (err) {
        if (!cancelled) {
          setCharges([]);
          setError(
            (err as { message?: string })?.message || 'Failed to load charges',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [saleId]);

  return { charges, isLoading, error };
}

export default useSaleCharges;
