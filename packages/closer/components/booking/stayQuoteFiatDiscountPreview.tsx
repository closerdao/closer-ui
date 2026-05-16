import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { Stay, StayQuoteResponse } from '../../types/stay';
import { formatStayMoney, quoteStay } from '../../utils/stays.api';
import Spinner from '../ui/Spinner';

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
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [quote, setQuote] = useState<StayQuoteResponse | null>(null);

  const quotePayload = useMemo(() => {
    if (typeof appliedCredits === 'number' && appliedCredits > 0) {
      return { appliedCredits };
    }
    if (typeof appliedTokens === 'number' && appliedTokens > 0) {
      return { appliedTokens };
    }
    return null;
  }, [appliedCredits, appliedTokens]);

  useEffect(() => {
    if (!quotePayload || !stay._id) {
      setQuote(null);
      setPhase('idle');
      return;
    }
    let cancelled = false;
    setPhase('loading');
    setQuote(null);
    void (async () => {
      try {
        const res = await quoteStay(stay._id, quotePayload);
        if (!cancelled) {
          setQuote(res);
          setPhase('ready');
        }
      } catch {
        if (!cancelled) {
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stay._id, quotePayload]);

  if (!quotePayload) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
      {phase === 'loading' && (
        <div className="flex items-center gap-2 text-gray-600">
          <Spinner />
          <span>{t('stay_create_fiat_quote_preview_loading')}</span>
        </div>
      )}
      {phase === 'error' && (
        <p className="text-system-error">{t('stay_create_fiat_quote_preview_error')}</p>
      )}
      {phase === 'ready' && quote && (
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-gray-900">
            {t('stay_create_fiat_quote_preview_title')}
          </p>
          <p className="text-gray-700">
            {t('stay_create_fiat_quote_preview_card_total', {
              amount: formatStayMoney(quote.priceLock.total),
            })}
          </p>
          {quote.delta.fiat.val !== 0 && (
            <p className="text-xs text-gray-600">
              {t('stay_create_fiat_quote_preview_fiat_change', {
                amount: formatStayMoney(quote.delta.fiat),
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
