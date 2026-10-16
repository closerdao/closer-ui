import type { ReactNode } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import type { Stay } from '../../types/stay';
import {
  computeTokensOwed,
  formatStakeNights,
  formatStayMoney,
  hasLiveModificationPayment,
} from '../../utils/stays.api';
import InfoTooltip from '../ui/InfoTooltip';

export const useStayTokenDisplay = () => {
  const format = useFormatter();
  return (amount: number, currency = 'TDF') =>
    `${currency} ${format.number(amount, {
      minimumFractionDigits: 2,
      maximumFractionDigits: amount > 0 && amount < 0.01 ? 6 : 2,
    })}`;
};

export function StayTokenPaymentSummary({
  stay,
  actions,
}: {
  stay: Stay;
  actions?: ReactNode;
}) {
  const t = useTranslations();
  const display = useStayTokenDisplay();
  const held = hasLiveModificationPayment(stay);
  const required = Math.max(
    0,
    Number(stay.tokensTarget?.val ?? 0) +
      (held ? Number(stay.pendingModification?.quote?.tokensDelta ?? 0) : 0),
  );
  const staked = Math.max(
    Number(stay.tokensStaked?.val ?? 0),
    held ? Number(stay.pendingModification?.stake?.lockedStakeVal ?? 0) : 0,
  );
  const remaining = computeTokensOwed(stay);
  const currency =
    stay.tokensTarget?.cur || stay.priceLock?.appliedTokens?.cur || 'TDF';
  if (required <= 0 && staked <= 0) return null;
  return (
    <div className="space-y-1 text-sm" aria-live="polite">
      <div className="flex justify-between gap-2">
        <span>{t('stay_tokens_required', { currency })}</span>
        <span className="tabular-nums">{display(required, currency)}</span>
      </div>
      {remaining > 0 && staked > 0 && (
        <div className="flex justify-between gap-2">
          <span>{t('stay_tokens_verified')}</span>
          <span>{display(staked, currency)}</span>
        </div>
      )}
      <div
        className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-1 ${remaining > 0 ? 'font-medium' : 'text-success'}`}
      >
        <span>
          {t(remaining > 0 ? 'stay_tokens_remaining' : 'stay_tokens_complete', {
            currency,
          })}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-1">
          {remaining > 0 && (
            <span className="tabular-nums">{display(remaining, currency)}</span>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

/** Explicit disclosure works on touch and keyboard, without hover-only content. */
export function StayUnstakedNightsInfo({ stay }: { stay: Stay }) {
  const t = useTranslations();
  const display = useStayTokenDisplay();
  const conversion = stay.priceLock?.lines.adjustment?.unstakedNights;
  if (!conversion?.nights.length) return null;
  const currency = conversion.tokens.cur || 'TDF';
  const dates = formatStakeNights(conversion.nights);
  return (
    <InfoTooltip label={t('stay_conversion_info_label')}>
      <span className="block space-y-2">
        <span className="block">
          {t(
            conversion.waived
              ? 'stay_conversion_waived_explanation'
              : 'stay_conversion_explanation',
            {
              nights: dates,
              tokens: display(conversion.tokens.val, currency),
              fiat: formatStayMoney(conversion),
            },
          )}
        </span>
        <span className="block">
          {t('stay_conversion_allocation', {
            original: display(stay.priceLock?.appliedTokens.val ?? 0, currency),
            required: display(stay.tokensTarget?.val ?? 0, currency),
          })}
        </span>
      </span>
    </InfoTooltip>
  );
}
