import { CloserCurrencies } from '../types';
import { Charge, OFF_PLATFORM_CHARGE_METHODS } from '../types/booking';
import { roundToTwoDecimals } from './currencyFormat';
import { priceFormat } from './helpers';

export function formatBookingLedgerChargeDisplay(charge: Charge): string {
  if (charge.status === 'refunded') {
    return priceFormat(
      charge.amount.totalRefunded?.val ?? charge.amount.total?.val,
      charge.amount.totalRefunded?.cur ?? charge.amount.total?.cur,
    );
  }
  if (
    charge.method === 'tokens' &&
    charge.lockedStake != null &&
    Number.isFinite(charge.lockedStake.val)
  ) {
    return priceFormat(charge.lockedStake.val, charge.lockedStake.cur);
  }
  return priceFormat(charge.amount.total?.val, charge.amount.total?.cur);
}

export function mergeBookingLedgerCharges(
  linkedPaidRefunded: Charge[] | undefined,
  embedded: Charge[] | undefined,
): Charge[] {
  const embeddedList = embedded ?? [];
  if (linkedPaidRefunded === undefined) {
    return embeddedList;
  }
  const linkedKeys = new Set(
    linkedPaidRefunded.map((c) => String(c._id ?? c.id ?? '')),
  );
  const pendingExtra = embeddedList.filter(
    (c) =>
      c.status === 'pending-payment' &&
      !linkedKeys.has(String(c._id ?? c.id ?? '')),
  );
  return [...linkedPaidRefunded, ...pendingExtra];
}

export function sumPaidFiatBookingCharges(
  charges: Charge[],
  fiatLedgerCurrency: CloserCurrencies,
): number {
  return charges.reduce((sum, charge) => {
    if (charge.status !== 'paid') return sum;
    if (charge.amount.total.cur !== fiatLedgerCurrency) return sum;
    return sum + (charge.amount.total.val ?? 0);
  }, 0);
}

export function sumRefundedFiatBookingCharges(
  charges: Charge[],
  fiatLedgerCurrency: CloserCurrencies,
): number {
  return charges.reduce((sum, charge) => {
    if (charge.status !== 'refunded') return sum;
    const cur = charge.amount.totalRefunded?.cur ?? charge.amount.total.cur;
    if (cur !== fiatLedgerCurrency) return sum;
    const v = charge.amount.totalRefunded?.val ?? charge.amount.total.val ?? 0;
    return sum + Math.abs(v);
  }, 0);
}

export function fiatBookingAmountDueFromSubtotal(
  subtotalVal: number,
  charges: Charge[],
  fiatLedgerCurrency: CloserCurrencies,
): number {
  const paid = sumPaidFiatBookingCharges(charges, fiatLedgerCurrency);
  const refunded = sumRefundedFiatBookingCharges(charges, fiatLedgerCurrency);
  return Math.max(0, roundToTwoDecimals(subtotalVal - paid + refunded));
}

export type OffPlatformRevenue = { cash: number; 'bank transfer': number };

/** Net cash and bank-transfer revenue: recorded payments minus their reversals. */
export function offPlatformRevenue(charges: Charge[]): OffPlatformRevenue {
  const sums: OffPlatformRevenue = { cash: 0, 'bank transfer': 0 };
  charges.forEach((charge) => {
    if (
      !(OFF_PLATFORM_CHARGE_METHODS as readonly string[]).includes(
        charge.method,
      )
    ) {
      return;
    }
    const sign =
      charge.status === 'paid' ? 1 : charge.status === 'refunded' ? -1 : 0;
    const key = charge.method === 'cash' ? 'cash' : 'bank transfer';
    sums[key] = roundToTwoDecimals(
      sums[key] + sign * (Number(charge.amount?.total?.val) || 0),
    );
  });
  return sums;
}
