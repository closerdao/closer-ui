import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Spinner } from '../../components/ui';

function DonateSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const rawSaleId = router.query.saleId;
    const resolvedSaleId = typeof rawSaleId === 'string' ? rawSaleId : '';
    if (resolvedSaleId.trim()) {
      router.replace(`/sale/${encodeURIComponent(resolvedSaleId)}`);
      return;
    }
    router.replace('/fundraiser');
  }, [router]);

  return (
    <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
      <Spinner />
    </div>
  );
}

export default DonateSuccessPage;
