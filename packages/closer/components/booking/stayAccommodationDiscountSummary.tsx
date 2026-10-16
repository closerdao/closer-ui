import { Info } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { PriceLock } from '../../types/stay';
import { Tooltip } from '../ui/InfoTooltip';

export function StayAccommodationDiscountSummary({
  priceLock,
  variant = 'summary',
}: {
  priceLock: PriceLock;
  variant?: 'summary' | 'badge';
}) {
  const t = useTranslations();
  const format = useFormatter();
  const discount = priceLock.accommodationDiscount;
  if (!discount || !(discount.combinedFraction > 0)) return null;

  const percent = (fraction: number) =>
    format.number(fraction * 100, { maximumFractionDigits: 2 });

  const hasDuration = discount.duration.fraction > 0;
  const hasPassport = discount.passport.fraction > 0;

  const breakdown = (
    <>
      {hasDuration && (
        <span>
          {t('stay_accommodation_discount_duration', {
            percent: percent(discount.duration.fraction),
          })}
        </span>
      )}
      {hasPassport && (
        <span>
          {t('stay_accommodation_discount_passport', {
            percent: percent(discount.passport.fraction),
          })}
        </span>
      )}
      {hasDuration && hasPassport && (
        <span className="font-semibold">
          {t('stay_accommodation_discount_combined', {
            percent: percent(discount.combinedFraction),
          })}
        </span>
      )}
    </>
  );

  if (variant === 'badge') {
    return (
      <Tooltip
        content={
          <span className="flex flex-col gap-1">
            {breakdown}
            <span className="mt-1">
              {t('stay_accommodation_discount_included')}
            </span>
          </span>
        }
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-light/70 px-2.5 py-1 text-xs font-medium text-accent-dark transition-colors hover:bg-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t('stay_accommodation_discount_applied', {
            percent: percent(discount.combinedFraction),
          })}
          <Info size={14} aria-hidden="true" />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="text-xs text-accent flex flex-wrap justify-end gap-x-2">
      {breakdown}
    </div>
  );
}
