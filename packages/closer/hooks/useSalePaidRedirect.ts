import { useRouter } from 'next/router';

import { useEffect } from 'react';

import api, { formatSearch } from '../utils/api';

export function useSalePaidRedirect(): void {
  const router = useRouter();
  const raw = router.query.saleId;
  const saleId = typeof raw === 'string' ? raw.trim() : '';

  useEffect(() => {
    if (!router.isReady || !saleId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await api.get('/sale', {
          params: {
            where: formatSearch({ _id: saleId }),
            limit: 1,
          },
        });
        const rows = res?.data?.results;
        const list = Array.isArray(rows) ? rows : [];
        const first = list[0] as { status?: string } | undefined;
        if (!cancelled && first?.status === 'paid') {
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
