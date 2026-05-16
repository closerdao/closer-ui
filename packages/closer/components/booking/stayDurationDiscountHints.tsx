import { useTranslations } from 'next-intl';

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
  const discounts = resolveDurationDiscountsFromSettings(bookingSettings);
  const weeklyPercent = durationDiscountPercent(discounts.weekly);
  const monthlyPercent = durationDiscountPercent(discounts.monthly);
  const hints: string[] = [];

  if (weeklyPercent > 0) {
    hints.push(
      t('stay_duration_discount_hint_weekly', { percent: weeklyPercent }),
    );
  }
  if (monthlyPercent > 0) {
    hints.push(
      t('stay_duration_discount_hint_monthly', { percent: monthlyPercent }),
    );
  }

  if (hints.length === 0) return null;

  return (
    <ul className="mt-3 text-sm text-gray-600 space-y-1 list-none p-0">
      {hints.map((hint) => (
        <li key={hint}>{hint}</li>
      ))}
    </ul>
  );
};

export default StayDurationDiscountHints;
