type BadgeVariantName =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'warning'
  | 'outline';

export function financeApplicationStatusBadgeVariant(
  status: string,
): BadgeVariantName {
  switch (status) {
    case 'pending-payment':
      return 'warning';
    case 'paid':
    case 'up-to-date':
    case 'completed':
      return 'default';
    case 'cancelled':
    case 'delinquent':
      return 'destructive';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function tokenSaleStatusBadgeVariant(status: string): BadgeVariantName {
  switch (status) {
    case 'pending-payment':
      return 'warning';
    case 'paid':
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'matched':
      return 'warning';
    default:
      return 'outline';
  }
}

export function financeApplicationStatusLabelKey(status: string): string {
  const map: Record<string, string> = {
    'pending-payment': 'order_status_pending_payment',
    paid: 'order_status_paid',
    cancelled: 'order_status_cancelled',
    completed: 'order_status_completed',
    pending: 'order_status_pending',
    delinquent: 'order_status_delinquent',
    'up-to-date': 'order_status_up_to_date',
  };
  return map[status] ?? 'order_status_unknown';
}

export function tokenSaleStatusLabelKey(status: string): string {
  const map: Record<string, string> = {
    'pending-payment': 'order_status_pending_payment',
    paid: 'order_status_paid',
    cancelled: 'order_status_cancelled',
    completed: 'order_status_completed',
    matched: 'order_status_matched',
  };
  return map[status] ?? 'order_status_unknown';
}

export function paymentScheduleRowStatusLabelKey(
  status: 'pending' | 'paid',
): string {
  return status === 'paid'
    ? 'payment_schedule_row_paid'
    : 'payment_schedule_row_pending';
}
