import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { fetchSales } from '../utils/sales';

export function useSalePaidRedirect(): void {
  const router = useRouter();
  const raw = router.query.saleId;
  const saleId = typeof raw === 'string' ? raw.trim() : '';

  useEffect(() => {
    if (!router.isReady || !saleId) return;

    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchSales(
          { where: { _id: saleId }, limit: 1 },
          { cache: false },
        );
        const list = Array.isArray(rows) ? rows : [];
        const first = list[0] as { status?: string } | undefined;
        if (
          !cancelled &&
          (first?.status === 'paid' || first?.status === 'completed')
        ) {
          router.replace(`/sale/${encodeURIComponent(saleId)}`);
        }
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, saleId, router]);
}
