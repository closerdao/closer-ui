import { TokenConfig } from '../types/api';

export const DEFAULT_FINANCING_DURATION_MONTHS = 36;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 10;

/**
 * `financingDurationsMonths` is admin-entered free text ("12, 24,36"), so drop
 * anything that is not a positive whole number of months and fall back to the
 * single default term when nothing usable is left — an empty term list would
 * leave the buyer with no way to continue.
 */
export const parseFinancingDurations = (
  value: string | number | null | undefined,
): number[] => {
  const durations = String(value ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((months) => Number.isInteger(months) && months > 0);

  const unique = Array.from(new Set(durations)).sort((a, b) => a - b);

  return unique.length > 0 ? unique : [DEFAULT_FINANCING_DURATION_MONTHS];
};

export const getFinancingDurations = (
  config: TokenConfig | null | undefined,
): number[] => parseFinancingDurations(config?.financingDurationsMonths);

export const getDownPaymentPercent = (
  config: TokenConfig | null | undefined,
): number => {
  const percent = Number(config?.downPaymentPercent);

  return Number.isFinite(percent) && percent >= 0 && percent <= 100
    ? percent
    : DEFAULT_DOWN_PAYMENT_PERCENT;
};
