import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { Stay } from '../../types/stay';
import {
  computeFiatDiscountFromStayQuote,
  formatStayMoney,
  quoteStay,
} from '../../utils/stays.api';

export type StayQuoteFiatDiscountPreviewProps = {
  stay: Stay;
  appliedCredits?: number;
  appliedTokens?: number;
};

export function StayQuoteFiatDiscountPreview({
  stay,
  appliedCredits,
  appliedTokens,
}: StayQuoteFiatDiscountPreviewProps) {
  const t = useTranslations();
  const [line, setLine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const stayRef = useRef(stay);
  stayRef.current = stay;

  useEffect(() => {
    if (!stay._id) {
      setLine(null);
      return;
    }
    const ac =
      appliedCredits != null && Number.isFinite(appliedCredits)
        ? appliedCredits
        : undefined;
    const at =
      appliedTokens != null && Number.isFinite(appliedTokens)
        ? appliedTokens
        : undefined;
    const hasCredits = ac != null && ac > 0;
    const hasTokens = at != null && at > 0;
    if (!hasCredits && !hasTokens) {
      setLine(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void quoteStay(stay._id, {
      ...(hasCredits ? { appliedCredits: ac } : {}),
      ...(hasTokens ? { appliedTokens: at } : {}),
    })
      .then((quote) => {
        if (cancelled) return;
        const { amount, cur } = computeFiatDiscountFromStayQuote(
          stayRef.current,
          quote,
        );
        if (amount <= 0.005) {
          setLine(null);
        } else {
          setLine(
            t('stay_create_payment_modal_eur_discount', {
              amount: formatStayMoney({ val: amount, cur }),
            }),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLine(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    stay._id,
    stay.fiatTarget?.val,
    stay.fiatPaid?.val,
    stay.priceLock?.total?.val,
    appliedCredits,
    appliedTokens,
    t,
  ]);

  if (loading) {
    return (
      <p className="text-sm text-gray-600">
        {t('stay_create_payment_modal_eur_discount_loading')}
      </p>
    );
  }
  if (!line) return null;
  return <p className="text-sm text-gray-800 font-medium">{line}</p>;
}
