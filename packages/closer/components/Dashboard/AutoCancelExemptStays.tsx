import Link from 'next/link';

import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import type { AutoCancelExemptStay } from '../../types/stay';
import { getAutoCancelExemptStays } from '../../utils/stays.api';

const AutoCancelExemptStays = () => {
  const t = useTranslations();
  const [stays, setStays] = useState<AutoCancelExemptStay[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAutoCancelExemptStays()
      .then((results) => {
        if (!cancelled) setStays(results);
      })
      // Not a host, or the API is down: the settling card simply shows no list.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stays.length) return null;

  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-medium">
        {t('dashboard_settling_auto_cancel_exempt', { count: stays.length })}
      </p>
      <ul className="flex flex-col gap-1">
        {stays.map((stay) => (
          <li key={stay._id}>
            <Link href={`/stay/${stay._id}`} className="underline">
              {dayjs(stay.start).format('DD MMM')}
            </Link>
            {stay.autoCancelExemption.reason && (
              <span className="text-disabled">
                {' '}
                — {stay.autoCancelExemption.reason}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AutoCancelExemptStays;
