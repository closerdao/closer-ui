import { TokenConfig } from '../types/api';

export const DEFAULT_FINANCING_DURATION_MONTHS = 36;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 10;
export const DEFAULT_FINANCING_APR_PERCENT = 0;
export const DEFAULT_MIN_MONTHLY_PAYMENT = 0;

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

export const getMaxFinancingMonths = (
  config: TokenConfig | null | undefined,
): number => {
  const configured = Number(config?.maxFinancingMonths);
  if (Number.isInteger(configured) && configured > 0) {
    return configured;
  }

  const fromList = parseFinancingDurations(config?.financingDurationsMonths);
  return Math.max(...fromList);
};

export const getFinancingDurations = (
  config: TokenConfig | null | undefined,
): number[] => {
  const maxMonths = getMaxFinancingMonths(config);
  const fromList = parseFinancingDurations(config?.financingDurationsMonths)
    .filter((months) => months <= maxMonths);

  if (fromList.length > 0) {
    return fromList;
  }

  return [maxMonths];
};

export const getDownPaymentPercent = (
  config: TokenConfig | null | undefined,
): number => {
  const percent = Number(config?.downPaymentPercent);

  return Number.isFinite(percent) && percent >= 0 && percent <= 100
    ? percent
    : DEFAULT_DOWN_PAYMENT_PERCENT;
};

export const getFinancingAprPercent = (
  config: TokenConfig | null | undefined,
): number => {
  const percent = Number(config?.financingAprPercent);

  return Number.isFinite(percent) && percent >= 0 ? percent : DEFAULT_FINANCING_APR_PERCENT;
};

export const getMinMonthlyPayment = (
  config: TokenConfig | null | undefined,
): number => {
  const amount = Number(config?.minMonthlyPayment);

  return Number.isFinite(amount) && amount >= 0
    ? amount
    : DEFAULT_MIN_MONTHLY_PAYMENT;
};

export const roundFiat = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Standard amortizing monthly payment for a principal at an annual APR.
 * Zero APR falls back to an equal split of principal over `months`.
 */
export const calculateAmortizedMonthlyPayment = (
  principal: number,
  annualAprPercent: number,
  months: number,
): number => {
  if (!(principal > 0) || !(months > 0) || !Number.isFinite(months)) {
    return 0;
  }

  const apr = Number.isFinite(annualAprPercent) ? annualAprPercent : 0;
  if (apr <= 0) {
    return roundFiat(principal / months);
  }

  const monthlyRate = apr / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  return roundFiat(payment);
};

export const calculateDownPaymentAmount = (
  totalToPayInFiat: number,
  downPaymentPercent: number,
): number => roundFiat(totalToPayInFiat * (downPaymentPercent / 100));

export const calculateFinancedPrincipal = (
  totalToPayInFiat: number,
  downPaymentPercent: number,
): number =>
  roundFiat(
    Math.max(0, totalToPayInFiat - calculateDownPaymentAmount(totalToPayInFiat, downPaymentPercent)),
  );

export type FinanceQuote = {
  totalToPayInFiat: number;
  downPaymentAmount: number;
  principal: number;
  durationInMonths: number;
  monthlyPaymentAmount: number;
  totalRepayable: number;
  carryingCost: number;
  meetsMinMonthlyPayment: boolean;
};

export const buildFinanceQuote = ({
  totalToPayInFiat,
  downPaymentPercent,
  durationInMonths,
  aprPercent,
  minMonthlyPayment,
}: {
  totalToPayInFiat: number;
  downPaymentPercent: number;
  durationInMonths: number;
  aprPercent: number;
  minMonthlyPayment: number;
}): FinanceQuote => {
  const downPaymentAmount = calculateDownPaymentAmount(
    totalToPayInFiat,
    downPaymentPercent,
  );
  const principal = calculateFinancedPrincipal(
    totalToPayInFiat,
    downPaymentPercent,
  );
  const monthlyPaymentAmount = calculateAmortizedMonthlyPayment(
    principal,
    aprPercent,
    durationInMonths,
  );
  const totalRepayable = roundFiat(
    downPaymentAmount + monthlyPaymentAmount * durationInMonths,
  );
  const carryingCost = roundFiat(Math.max(0, totalRepayable - totalToPayInFiat));

  return {
    totalToPayInFiat: roundFiat(totalToPayInFiat),
    downPaymentAmount,
    principal,
    durationInMonths,
    monthlyPaymentAmount,
    totalRepayable,
    carryingCost,
    meetsMinMonthlyPayment: monthlyPaymentAmount + Number.EPSILON >= minMonthlyPayment,
  };
};

/**
 * Equal monthly dues written into the contract schedule at apply time.
 * The final month absorbs any cent rounding difference so the schedule sums
 * to the amortised total (monthly × months), not just the principal.
 */
export const buildWrittenMonthlyPaymentAmounts = (
  monthlyPaymentAmount: number,
  durationInMonths: number,
): number[] => {
  if (!(durationInMonths > 0) || !(monthlyPaymentAmount >= 0)) {
    return [];
  }

  const amounts = Array.from({ length: durationInMonths }, () =>
    roundFiat(monthlyPaymentAmount),
  );
  return amounts;
};

export type FinanceScheduleMonth = {
  amountDue: number;
  amountPaid: number;
  status: 'pending' | 'paid';
};

/**
 * Apply a payment across pending schedule months. Anything above a month's
 * remaining due carries into the next month until the payment is exhausted.
 */
export const applyPaymentWithCarryover = (
  schedule: FinanceScheduleMonth[],
  paymentAmount: number,
): FinanceScheduleMonth[] => {
  let remaining = roundFiat(Math.max(0, paymentAmount));
  return schedule.map((row) => {
    if (remaining <= 0 || row.status === 'paid') {
      return { ...row };
    }

    const stillDue = roundFiat(Math.max(0, row.amountDue - row.amountPaid));
    if (stillDue <= 0) {
      return { ...row, status: 'paid' as const };
    }

    const applied = roundFiat(Math.min(stillDue, remaining));
    const amountPaid = roundFiat(row.amountPaid + applied);
    remaining = roundFiat(remaining - applied);

    return {
      ...row,
      amountPaid,
      status: amountPaid + Number.EPSILON >= row.amountDue ? 'paid' : 'pending',
    };
  });
};
