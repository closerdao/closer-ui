import { useFormatter, useTranslations } from 'next-intl';

import type { BookingSettings } from '../../types/api';
import {
  durationDiscountPercent,
  resolveDurationDiscountsFromSettings,
} from '../../utils/durationDiscount';

interface StayDurationDiscountHintsProps {
  bookingSettings: BookingSettings | null;
}

const StayDurationDiscountHints = ({
  bookingSettings,
}: StayDurationDiscountHintsProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const discounts = resolveDurationDiscountsFromSettings(bookingSettings);
  const weeklyPercent = durationDiscountPercent(discounts.weekly);
  const monthlyPercent = durationDiscountPercent(discounts.monthly);
  const displayPercent = (percent: number) =>
    format.number(percent, { maximumFractionDigits: 2 });

  let hint: string | null = null;
  if (weeklyPercent > 0 && monthlyPercent > 0) {
    hint = t('stay_duration_discount_hint_combined', {
      weeklyPercent: displayPercent(weeklyPercent),
      monthlyPercent: displayPercent(monthlyPercent),
    });
  } else if (weeklyPercent > 0) {
    hint = t('stay_duration_discount_hint_weekly_only', {
      percent: displayPercent(weeklyPercent),
    });
  } else if (monthlyPercent > 0) {
    hint = t('stay_duration_discount_hint_monthly_only', {
      percent: displayPercent(monthlyPercent),
    });
  }

  if (!hint) return null;

  return (
    <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
      {hint}
    </p>
  );
};

export default StayDurationDiscountHints;
