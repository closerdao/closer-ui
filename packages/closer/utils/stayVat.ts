import type { AccountingEntityProductSlug } from '../constants/accountingEntities.constants';
import type { PriceLock, StayMoney } from '../types/stay';

export type StayVatLineKey = 'accommodation' | 'utility' | 'food' | 'event';

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

const LINE_PRODUCT: Record<StayVatLineKey, AccountingEntityProductSlug> = {
  accommodation: 'accommodations',
  // Utility is part of the stay cost, so it follows the accommodation rate.
  utility: 'accommodations',
  food: 'food',
  event: 'events',
};

const LINE_KEYS: StayVatLineKey[] = [
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
  const rows: StayVatLine[] = [];
  for (const key of LINE_KEYS) {
    const line = priceLock.lines?.[key];
    const val = line?.val ?? 0;
    if (val <= 0) continue;
    const rate =
      normalizeVatRate(vatByProductType?.[LINE_PRODUCT[key]]) ?? fallback;
    const included = (val * rate) / (1 + rate);
    rows.push({
      key,
      rate,
      amount: { val: Math.round(included * 100) / 100, cur: line.cur },
    });
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
