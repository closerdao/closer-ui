import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { getChargedAwaitingSettlementCount } from '../../utils/stays.api';

const ChargedAwaitingSettlement = () => {
  const t = useTranslations();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getChargedAwaitingSettlementCount()
      .then((result) => {
        if (!cancelled) setCount(result);
      })
      // Not a host, or the API is down: the settling card simply shows no count.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!count) return null;

  return (
    <p className="text-sm font-medium text-error">
      {t('dashboard_settling_charged_awaiting_settlement', { count })}
    </p>
  );
};

export default ChargedAwaitingSettlement;
