import { FinanceApplication } from '../types/subscriptions';

export type FinanceScheduleRow = {
  month: string;
  status: 'pending' | 'paid';
  paymentDate: Date | null;
};

export function getFinanceScheduleRows(
  paymentsScheduled: FinanceApplication['paymentsScheduled'],
): FinanceScheduleRow[] {
  return Object.entries(paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      status: value.status,
      paymentDate: value.paymentDate ? new Date(value.paymentDate) : null,
    }));
}

export function getNextPaymentDueDateForFinance(
  application: FinanceApplication,
): Date | null {
  const schedule = getFinanceScheduleRows(application.paymentsScheduled);
  const now = new Date();
  const pendingSorted = schedule.filter(
    (item) => item.status === 'pending' && item.paymentDate,
  );
  const nextFuture = pendingSorted.find(
    (item) => item.paymentDate && item.paymentDate >= now,
  );
  return nextFuture?.paymentDate || pendingSorted[0]?.paymentDate || null;
}

export type FinanceMenuHighlight =
  | { kind: 'deposit' }
  | { kind: 'overdue'; dueDate: Date }
  | { kind: 'next'; date: Date }
  | { kind: 'none' };

export function getFinanceMenuHighlight(
  application: FinanceApplication,
): FinanceMenuHighlight {
  if (application.status === 'pending-payment') {
    return { kind: 'deposit' };
  }
  const schedule = getFinanceScheduleRows(application.paymentsScheduled);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const overduePending = schedule.filter(
    (row) =>
      row.status === 'pending' &&
      row.paymentDate &&
      !Number.isNaN(row.paymentDate.getTime()) &&
      row.paymentDate < startOfToday,
  );
  if (overduePending.length > 0) {
    const dueDate = overduePending.reduce((earliest, row) => {
      const d = row.paymentDate!;
      return d < earliest ? d : earliest;
    }, overduePending[0].paymentDate!);
    return { kind: 'overdue', dueDate };
  }
  const next = getNextPaymentDueDateForFinance(application);
  if (next && !Number.isNaN(next.getTime())) {
    return { kind: 'next', date: next };
  }
  return { kind: 'none' };
}
