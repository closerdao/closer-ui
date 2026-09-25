import type { AccountingEntityProductSlug } from '../constants/accountingEntities.constants';
import type { PriceLock, StayMoney } from '../types/stay';

type StayPriceLineKey = 'accommodation' | 'utility' | 'food' | 'event';

export type StayVatLineKey = StayPriceLineKey | 'adjustment';

export type StayVatLine = {
  key: StayVatLineKey;
  /** VAT rate as a fraction (0.23 = 23%). */
  rate: number;
  /** VAT included in the line's gross amount. */
  amount: StayMoney;
};

/**
 * Stored rates mix conventions — `payment.vatRate` is a fraction (0.23) while
 * `vatByProductType` holds percentages (17, 21) — so anything above 1 is read
 * as a percentage. Same rule as AccountingEntitiesVatFields' hint formatter.
 */
export function normalizeVatRate(
  rate: number | undefined | null,
): number | null {
  if (rate == null) return null;
  const n = Number(rate);
  if (Number.isNaN(n) || n < 0) return null;
  return n > 1 ? n / 100 : n;
}

const LINE_PRODUCT: Record<StayPriceLineKey, AccountingEntityProductSlug> = {
  accommodation: 'accommodations',
  // Utility is part of the stay cost, so it follows the accommodation rate.
  utility: 'accommodations',
  food: 'food',
  event: 'events',
};

const LINE_KEYS: StayPriceLineKey[] = [
  'accommodation',
  'utility',
  'food',
  'event',
];

/**
 * Included VAT per price-lock line, using the per-product rates from the
 * accounting-entities config and falling back to the payment default rate.
 * Amounts are the VAT portion of the (VAT-inclusive) line values.
 */
export function computeStayVatBreakdown(
  priceLock: Pick<PriceLock, 'lines'>,
  vatByProductType: Partial<Record<string, number>> | undefined,
  defaultVatRate: number | undefined,
): StayVatLine[] {
  const fallback = normalizeVatRate(defaultVatRate) ?? 0;
  const rateOf = (key: StayPriceLineKey) =>
    normalizeVatRate(vatByProductType?.[LINE_PRODUCT[key]]) ?? fallback;
  const row = (key: StayVatLineKey, line: StayMoney, rate: number) => ({
    key,
    rate,
    amount: {
      val: Math.round(((line.val * rate) / (1 + rate)) * 100) / 100,
      cur: line.cur,
    },
  });
  const rows: StayVatLine[] = [];
  for (const key of LINE_KEYS) {
    const line = priceLock.lines?.[key];
    if ((line?.val ?? 0) <= 0) continue;
    rows.push(row(key, line, rateOf(key)));
  }
  // A host waiver carries negative VAT at its own line's rate, like closer-api's priceLock.
  const adjustment = priceLock.lines?.adjustment;
  if (adjustment?.val) {
    const vatLine = (adjustment.vatLine ?? 'accommodation') as StayPriceLineKey;
    rows.push(row('adjustment', adjustment, rateOf(vatLine)));
  }
  return rows;
}

/** ≥2 lines taxed at ≥2 distinct rates — the only case worth itemizing. */
export function hasMultipleVatRates(rows: StayVatLine[]): boolean {
  return rows.length >= 2 && new Set(rows.map((r) => r.rate)).size >= 2;
}

/** 0.17 → "17", 0.065 → "6.5" */
export function formatVatRatePercent(rate: number): string {
  return String(Math.round(rate * 10000) / 100);
}
