import { FinanceApplication } from '../types/subscriptions';
import {
  getFinancedMonthlyAmountDue,
  getScheduleMonthAmountDue,
} from './financeApplicationMonthlyDue';
import { getFinanceScheduleRows } from './financeApplicationScheduleHelpers';
import { roundFiat } from './tokenFinancing';

/**
 * Everything the contract obliges the member to pay: deposit plus every
 * installment, carrying cost included.
 *
 * Contracts written since the API started amortising carry the figure on
 * `pricingContext.totalRepayable`. Older records predate it, so fall back to
 * the deposit plus the scheduled dues, and finally to the bare contract total
 * for records with no schedule at all.
 */
export function getFinanceTotalRepayable(
  application: FinanceApplication | null | undefined,
): number {
  if (!application) {
    return 0;
  }

  const stamped = Number(application.pricingContext?.totalRepayable);
  if (Number.isFinite(stamped) && stamped > 0) {
    return roundFiat(stamped);
  }

  const rows = getFinanceScheduleRows(application.paymentsScheduled);
  if (rows.length > 0) {
    const monthly = getFinancedMonthlyAmountDue(application, rows.length);
    const scheduled = rows.reduce(
      (total, row) => total + getScheduleMonthAmountDue(row, monthly),
      0,
    );
    const deposit = Number(application.downPaymentAmount) || 0;
    if (scheduled > 0) {
      return roundFiat(deposit + scheduled);
    }
  }

  return roundFiat(Number(application.totalToPayInFiat) || 0);
}

/**
 * Share of the contract already settled, clamped to 0–1 so a contract that
 * has been overpaid does not render a bar past its own track.
 */
export function getFinanceRepaymentProgress(
  totalPaid: number,
  totalRepayable: number,
): number {
  if (!(totalRepayable > 0)) {
    return 0;
  }
  return Math.min(Math.max(totalPaid / totalRepayable, 0), 1);
}
