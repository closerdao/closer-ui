import {
  computeStayVatBreakdown,
  formatVatRatePercent,
  hasMultipleVatRates,
  normalizeVatRate,
} from '../stayVat';

const lines = (over: Partial<Record<string, number>> = {}) => ({
  lines: {
    accommodation: { val: over.accommodation ?? 100, cur: 'EUR' },
    accommodationGross: { val: 100, cur: 'EUR' },
    utility: { val: over.utility ?? 0, cur: 'EUR' },
    food: { val: over.food ?? 0, cur: 'EUR' },
    event: { val: over.event ?? 0, cur: 'EUR' },
  },
});

describe('normalizeVatRate', () => {
  it('reads values above 1 as percentages and fractions as-is', () => {
    expect(normalizeVatRate(17)).toBeCloseTo(0.17);
    expect(normalizeVatRate(0.23)).toBeCloseTo(0.23);
    expect(normalizeVatRate(0)).toBe(0);
  });

  it('rejects missing or invalid rates', () => {
    expect(normalizeVatRate(undefined)).toBeNull();
    expect(normalizeVatRate(null)).toBeNull();
    expect(normalizeVatRate(-1)).toBeNull();
    expect(normalizeVatRate(NaN)).toBeNull();
  });
});

describe('computeStayVatBreakdown', () => {
  it('applies per-product rates with the payment default as fallback', () => {
    const rows = computeStayVatBreakdown(
      lines({ accommodation: 117, food: 121, event: 123 }),
      { accommodations: 17, food: 21 },
      0.23,
    );
    expect(rows).toEqual([
      { key: 'accommodation', rate: 0.17, amount: { val: 17, cur: 'EUR' } },
      { key: 'food', rate: 0.21, amount: { val: 21, cur: 'EUR' } },
      // events has no per-product rate → default 23%
      { key: 'event', rate: 0.23, amount: { val: 23, cur: 'EUR' } },
    ]);
  });

  it('groups utility under the accommodation rate', () => {
    const rows = computeStayVatBreakdown(
      lines({ accommodation: 117, utility: 11.7 }),
      { accommodations: 17 },
      0.23,
    );
    expect(rows.map((r) => [r.key, r.rate])).toEqual([
      ['accommodation', 0.17],
      ['utility', 0.17],
    ]);
  });

  it('skips zero lines and treats no configured rate as 0%', () => {
    const rows = computeStayVatBreakdown(lines(), undefined, undefined);
    expect(rows).toEqual([
      { key: 'accommodation', rate: 0, amount: { val: 0, cur: 'EUR' } },
    ]);
  });
});

describe('hasMultipleVatRates', () => {
  it('is true only for 2+ lines at 2+ distinct rates', () => {
    const multi = computeStayVatBreakdown(
      lines({ food: 50 }),
      { accommodations: 17, food: 21 },
      0.23,
    );
    expect(hasMultipleVatRates(multi)).toBe(true);

    const sameRate = computeStayVatBreakdown(
      lines({ food: 50 }),
      { accommodations: 23, food: 23 },
      0.23,
    );
    expect(hasMultipleVatRates(sameRate)).toBe(false);

    const single = computeStayVatBreakdown(lines(), { accommodations: 17 }, 0.23);
    expect(hasMultipleVatRates(single)).toBe(false);
  });
});

describe('formatVatRatePercent', () => {
  it('formats fractions as percentages without trailing noise', () => {
    expect(formatVatRatePercent(0.17)).toBe('17');
    expect(formatVatRatePercent(0.065)).toBe('6.5');
    expect(formatVatRatePercent(0)).toBe('0');
  });
});
