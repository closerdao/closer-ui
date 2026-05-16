import type { BookingSettings } from '../types/api';
import type {
  BookingRate,
  DurationDiscounts,
} from '../types/durationDiscount';
import type { StayMoney } from '../types/stay';

export const getBookingRateFromNights = (nights: number): BookingRate => {
  if (nights >= 28) return 'monthly';
  if (nights >= 7) return 'weekly';
  return 'daily';
};

export const resolveDurationDiscountsFromSettings = (
  settings:
    | Pick<
        BookingSettings,
        'discountsDaily' | 'discountsWeekly' | 'discountsMonthly'
      >
    | {
        discounts?: Partial<DurationDiscounts>;
        discountsDaily?: number;
        discountsWeekly?: number;
        discountsMonthly?: number;
      }
    | null
    | undefined,
): DurationDiscounts => {
  if (!settings) {
    return { daily: 0, weekly: 0, monthly: 0 };
  }
  const nested = (settings as { discounts?: Partial<DurationDiscounts> })
    .discounts;
  const flatDaily = (settings as BookingSettings).discountsDaily;
  const flatWeekly = (settings as BookingSettings).discountsWeekly;
  const flatMonthly = (settings as BookingSettings).discountsMonthly;
  const hasFlat =
    flatDaily != null || flatWeekly != null || flatMonthly != null;
  if (hasFlat) {
    return {
      daily: Number(flatDaily) || 0,
      weekly: Number(flatWeekly) || 0,
      monthly: Number(flatMonthly) || 0,
    };
  }
  return {
    daily: Number(nested?.daily) || 0,
    weekly: Number(nested?.weekly) || 0,
    monthly: Number(nested?.monthly) || 0,
  };
};

export const isDurationDiscountFraction = (discount: number): boolean =>
  Number.isFinite(discount) && discount > 0 && discount < 1;

export const durationDiscountPercent = (discount: number): number =>
  Math.round(discount * 100);

export const computeGrossAccommodationFromDiscounted = (
  rentalFiat: StayMoney | undefined | null,
  discount: number,
): number | null => {
  const val = rentalFiat?.val;
  if (val == null || !Number.isFinite(val) || val <= 0) return null;
  if (!isDurationDiscountFraction(discount)) return null;
  const gross = val / (1 - discount);
  return Number.isFinite(gross) && gross > val ? gross : null;
};
