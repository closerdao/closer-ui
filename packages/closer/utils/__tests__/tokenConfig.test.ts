import { buildMergedConfig } from '../config.utils';
import {
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_FINANCING_DURATION_MONTHS,
  getDownPaymentPercent,
  getFinancingDurations,
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

describe('token config legacy fallback', () => {
  it('inherits a stored web3 document and the old citizenship financing terms', () => {
    const merged = buildMergedConfig([
      { slug: 'web3', value: { enabled: true, maxSupply: 15000 } },
      {
        slug: 'citizenship',
        value: {
          enabled: true,
          downPaymentPercent: 20,
          tokenPriceModifierPercent: 3,
        },
      },
    ]);

    expect(merged.token).toMatchObject({
      enabled: true,
      maxSupply: 15000,
      downPaymentPercent: 20,
      tokenPriceModifierPercent: 3,
    });
    expect(getFinancingDurations(merged.token as any)).toEqual([
      DEFAULT_FINANCING_DURATION_MONTHS,
    ]);
  });

  it('lets a stored token document win over the legacy slugs', () => {
    const merged = buildMergedConfig([
      { slug: 'web3', value: { maxSupply: 15000 } },
      { slug: 'citizenship', value: { tokenPriceModifierPercent: 3 } },
      {
        slug: 'token',
        value: {
          maxSupply: 22000,
          tokenPriceModifierPercent: 0,
          financingDurationsMonths: '24,36',
        },
      },
    ]);

    expect(merged.token).toMatchObject({
      maxSupply: 22000,
      tokenPriceModifierPercent: 0,
    });
    expect(getFinancingDurations(merged.token as any)).toEqual([24, 36]);
  });

  it('falls back to schema defaults when nothing is stored', () => {
    const merged = buildMergedConfig([]);

    expect(merged.token).toMatchObject({
      downPaymentPercent: 10,
      tokenPriceModifierPercent: 0,
      financingDurationsMonths: '36',
    });
  });
});
