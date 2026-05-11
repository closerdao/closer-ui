import { FinanceApplication } from '../types/subscriptions';

export function getFinancedMonthlyAmountDue(
  application: FinanceApplication | null | undefined,
  scheduleMonthCount: number,
): number {
  if (!application) {
    return 0;
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
