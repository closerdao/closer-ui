import { useFormatter, useTranslations } from 'next-intl';

import type { PriceLock } from '../../types/stay';

export function StayAccommodationDiscountSummary({
  priceLock,
}: {
  priceLock: PriceLock;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const discount = priceLock.accommodationDiscount;
  if (!discount || discount.combinedFraction <= 0) return null;

  const percent = (fraction: number) =>
    format.number(fraction * 100, { maximumFractionDigits: 2 });

  const hasDuration = discount.duration.fraction > 0;
  const hasPassport = discount.passport.fraction > 0;

  return (
    <div className="text-xs text-accent flex flex-wrap justify-end gap-x-2">
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
    </div>
  );
}
