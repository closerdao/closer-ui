import { FinanceApplication } from '../types/subscriptions';

export function getScheduleMonthAmountDue(
  month:
    | {
        amountDue?: number;
        amountPaid?: number;
      }
    | null
    | undefined,
  fallbackMonthlyDue: number,
): number {
  const written = Number(month?.amountDue);
  if (Number.isFinite(written) && written >= 0) {
    return written;
  }
  return fallbackMonthlyDue;
}

export function getFinancedMonthlyAmountDue(
  application: FinanceApplication | null | undefined,
  scheduleMonthCount: number,
): number {
  if (!application) {
    return 0;
  }

  const locked = Number(application.monthlyPaymentAmount);
  if (Number.isFinite(locked) && locked > 0) {
    return locked;
  }

  const contract = Number(application.totalToPayInFiat ?? 0);
  const deposit = Number(application.downPaymentAmount ?? 0);
  const remainder = Math.max(0, contract - deposit);
  const duration =
    typeof application.durationInMonths === 'number' &&
    application.durationInMonths > 0
      ? application.durationInMonths
      : scheduleMonthCount > 0
        ? scheduleMonthCount
        : 0;
  if (duration <= 0) {
    return 0;
  }
  return remainder / duration;
}
