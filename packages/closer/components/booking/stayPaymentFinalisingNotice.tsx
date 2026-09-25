import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import Button from '../ui/Button';

export const FINALISING_POLL_MS = 30_000;

interface Props {
  /** Re-reads the stay; the page leaves for the confirmation once it is paid. */
  onRefresh: () => Promise<unknown>;
}

const StayPaymentFinalisingNotice = ({ onRefresh }: Props) => {
  const t = useTranslations();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const id = setInterval(() => {
      onRefreshRef.current().catch(() => undefined);
    }, FINALISING_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
    } catch {
      // The next poll tries again.
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div role="status" className="flex flex-col gap-3">
      <p className="text-sm text-gray-700">{t('stay_payment_finalising')}</p>
      <Button
        variant="secondary"
        isEnabled={!isRefreshing}
        isLoading={isRefreshing}
        onClick={() => void refresh()}
        className="min-h-[48px]"
      >
        {t('stay_payment_finalising_refresh')}
      </Button>
    </div>
  );
};

export default StayPaymentFinalisingNotice;
