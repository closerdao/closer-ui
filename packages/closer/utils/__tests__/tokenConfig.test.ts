import { buildMergedConfig } from '../config.utils';
import {
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_FINANCING_DURATION_MONTHS,
  applyPaymentWithCarryover,
  buildFinanceQuote,
  calculateAmortizedMonthlyPayment,
  getDownPaymentPercent,
  getFinancingAprPercent,
  getFinancingDurations,
  getMaxFinancingMonths,
  getMinMonthlyPayment,
  parseFinancingDurations,
} from '../tokenFinancing';

describe('parseFinancingDurations', () => {
  it('parses a comma separated list, tolerating whitespace', () => {
    expect(parseFinancingDurations('12, 24,36')).toEqual([12, 24, 36]);
  });

  it('sorts ascending and drops duplicates', () => {
    expect(parseFinancingDurations('36,12,36,24')).toEqual([12, 24, 36]);
  });

  it('drops entries that are not whole positive months', () => {
    expect(parseFinancingDurations('12,abc,-6,0,1.5,24')).toEqual([12, 24]);
  });

  it('falls back to the default term when nothing usable is configured', () => {
    ['', '   ', 'none', undefined, null].forEach((value) => {
      expect(parseFinancingDurations(value)).toEqual([
        DEFAULT_FINANCING_DURATION_MONTHS,
      ]);
    });
  });
});

describe('getDownPaymentPercent', () => {
  it('reads the configured percentage', () => {
    expect(getDownPaymentPercent({ enabled: true, downPaymentPercent: 25 })).toBe(
      25,
    );
  });

  it('accepts 0 rather than treating it as unset', () => {
    expect(getDownPaymentPercent({ enabled: true, downPaymentPercent: 0 })).toBe(
      0,
    );
  });

  it('falls back to the default when out of range or missing', () => {
    expect(getDownPaymentPercent({ enabled: true, downPaymentPercent: 140 })).toBe(
      DEFAULT_DOWN_PAYMENT_PERCENT,
    );
    expect(getDownPaymentPercent(null)).toBe(DEFAULT_DOWN_PAYMENT_PERCENT);
  });
});

describe('max financing length, APR, and min monthly payment', () => {
  it('reads maxFinancingMonths and falls back to the largest preset', () => {
    expect(
      getMaxFinancingMonths({ enabled: true, maxFinancingMonths: 180 }),
    ).toBe(180);
    expect(
      getMaxFinancingMonths({
        enabled: true,
        financingDurationsMonths: '6,12,24',
      }),
    ).toBe(24);
  });

  it('filters duration presets by the configured max', () => {
    expect(
      getFinancingDurations({
        enabled: true,
        maxFinancingMonths: 12,
        financingDurationsMonths: '6,12,24,36',
      }),
    ).toEqual([6, 12]);
  });

  it('reads APR and minimum monthly payment', () => {
    expect(
      getFinancingAprPercent({ enabled: true, financingAprPercent: 5 }),
    ).toBe(5);
    expect(
      getMinMonthlyPayment({ enabled: true, minMonthlyPayment: 250 }),
    ).toBe(250);
  });
});

describe('amortized monthly payment', () => {
  it('splits principal evenly when APR is zero', () => {
    expect(calculateAmortizedMonthlyPayment(2340, 0, 6)).toBe(390);
  });

  it('reflects a 7% carrying APR in the monthly payment', () => {
    const principal = 2340;
    const withApr = calculateAmortizedMonthlyPayment(principal, 7, 36);
    const withoutApr = calculateAmortizedMonthlyPayment(principal, 0, 36);

    expect(withApr).toBeGreaterThan(withoutApr);
    expect(withApr).toBeCloseTo(72.25, 1);

    const quote = buildFinanceQuote({
      totalToPayInFiat: 2600,
      downPaymentPercent: 10,
      durationInMonths: 36,
      aprPercent: 7,
      minMonthlyPayment: 0,
    });

    expect(quote.monthlyPaymentAmount).toBe(withApr);
    expect(quote.carryingCost).toBeGreaterThan(0);
    expect(quote.totalRepayable).toBeGreaterThan(2600);
  });

  it('quotes a 10-token package against max term and min monthly', () => {
    const quote = buildFinanceQuote({
      totalToPayInFiat: 2600,
      downPaymentPercent: 0,
      durationInMonths: 6,
      aprPercent: 0,
      minMonthlyPayment: 250,
    });

    expect(quote.monthlyPaymentAmount).toBe(433.33);
    expect(quote.meetsMinMonthlyPayment).toBe(true);
    expect(quote.carryingCost).toBe(0);
  });

  it('rejects quotes below the minimum monthly payment', () => {
    const quote = buildFinanceQuote({
      totalToPayInFiat: 500,
      downPaymentPercent: 0,
      durationInMonths: 6,
      aprPercent: 0,
      minMonthlyPayment: 250,
    });

    expect(quote.monthlyPaymentAmount).toBeCloseTo(83.33, 2);
    expect(quote.meetsMinMonthlyPayment).toBe(false);
  });
});

describe('applyPaymentWithCarryover', () => {
  it('flows overpayment into the next month', () => {
    const updated = applyPaymentWithCarryover(
      [
        { amountDue: 250, amountPaid: 0, status: 'pending' },
        { amountDue: 250, amountPaid: 0, status: 'pending' },
        { amountDue: 250, amountPaid: 0, status: 'pending' },
      ],
      400,
    );

    expect(updated[0]).toMatchObject({
      amountPaid: 250,
      status: 'paid',
    });
    expect(updated[1]).toMatchObject({
      amountPaid: 150,
      status: 'pending',
    });
    expect(updated[2]).toMatchObject({
      amountPaid: 0,
      status: 'pending',
    });
  });
});

describe('token config legacy fallback', () => {
  it('inherits a stored web3 document and the old citizenship financing terms', () => {
    const merged = buildMergedConfig([
      { slug: 'web3', value: { enabled: true, maxSupply: 15000 } },
      {
        slug: 'citizenship',
        value: {
          enabled: true,
          downPaymentPercent: 20,
          // Legacy flat markup must not be inherited into financed quotes.
          tokenPriceModifierPercent: 3,
        },
      },
    ]);

    expect(merged.token).toMatchObject({
      enabled: true,
      maxSupply: 15000,
      downPaymentPercent: 20,
    });
    expect(merged.token).not.toHaveProperty('tokenPriceModifierPercent');
    expect(getFinancingDurations(merged.token as any)).toEqual([
      DEFAULT_FINANCING_DURATION_MONTHS,
    ]);
  });

  it('lets a stored token document win over the legacy slugs', () => {
    const merged = buildMergedConfig([
      { slug: 'web3', value: { maxSupply: 15000 } },
      { slug: 'citizenship', value: { downPaymentPercent: 15 } },
      {
        slug: 'token',
        value: {
          maxSupply: 22000,
          financingDurationsMonths: '24,36',
          maxFinancingMonths: 36,
          financingAprPercent: 7,
          minMonthlyPayment: 250,
        },
      },
    ]);

    expect(merged.token).toMatchObject({
      maxSupply: 22000,
      downPaymentPercent: 15,
      maxFinancingMonths: 36,
      financingAprPercent: 7,
      minMonthlyPayment: 250,
    });
    expect(getFinancingDurations(merged.token as any)).toEqual([24, 36]);
    expect(getMaxFinancingMonths(merged.token as any)).toBe(36);
  });

  it('falls back to schema defaults when nothing is stored', () => {
    const merged = buildMergedConfig([]);

    expect(merged.token).toMatchObject({
      downPaymentPercent: 10,
      financingDurationsMonths: '36',
      maxFinancingMonths: 36,
      financingAprPercent: 0,
      minMonthlyPayment: 0,
    });
    expect(merged.token).not.toHaveProperty('tokenPriceModifierPercent');
  });
});
