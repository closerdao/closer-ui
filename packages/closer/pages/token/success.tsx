import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Spinner } from '../../components/ui';

function TokenSaleSuccessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.saleId;
    const saleId =
      typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] || '' : '';
    if (!saleId.trim()) {
      router.replace('/');
      return;
    }
    const params = new URLSearchParams();
    Object.entries(router.query).forEach(([key, val]) => {
      if (key === 'saleId') return;
      if (typeof val === 'string') {
        params.append(key, val);
        return;
      }
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (v) params.append(key, v);
        });
      }
    });
    const qs = params.toString();
    router.replace(
      qs
        ? `/sale/${encodeURIComponent(saleId)}?${qs}`
        : `/sale/${encodeURIComponent(saleId)}`,
    );
  }, [router]);

  return (
    <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
      <Spinner />
    </div>
  );
}

export default TokenSaleSuccessRedirectPage;
