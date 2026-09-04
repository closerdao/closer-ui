import {
  DEFAULT_CREDIT_PRICE_PER_UNIT,
  clampCreditAmount,
  getBonusCreditsForAmount,
  getCreditPackages,
  getCreditPricePerUnit,
  getCreditPurchaseLimits,
  getCreditPurchasePrice,
  getVolumeDiscountForAmount,
  getVolumeDiscounts,
  isCreditPurchaseEnabled,
  parseCreditAmountFromQuery,
} from '../credits.helpers';

describe('getCreditPricePerUnit', () => {
  it('uses the credit config price once it has been saved', () => {
    expect(
      getCreditPricePerUnit(
        { enabled: true, creditPricePerUnit: 42 },
        { enabled: true, creditPricePerUnit: 30 },
        { creditPricePerUnit: 42 },
      ),
    ).toBe(42);
  });

  it('keeps the legacy fundraiser price while credit config is untouched', () => {
    // The merged config view hands every village the schema default of 30,
    // which must not overwrite a village charging 25 from the old field.
    expect(
      getCreditPricePerUnit(
        { enabled: false, creditPricePerUnit: 30 },
        { enabled: true, creditPricePerUnit: 25 },
        null,
      ),
    ).toBe(25);
  });

  it('prefers a saved credit price of the same value as the default', () => {
    expect(
      getCreditPricePerUnit(
        { enabled: true, creditPricePerUnit: 30 },
        { enabled: true, creditPricePerUnit: 25 },
        { creditPricePerUnit: 30 },
      ),
    ).toBe(30);
  });

  it('falls back to the platform default when nothing is configured', () => {
    expect(getCreditPricePerUnit(null, null, null)).toBe(
      DEFAULT_CREDIT_PRICE_PER_UNIT,
    );
  });

  it('ignores zero and negative prices', () => {
    expect(
      getCreditPricePerUnit(
        { enabled: true, creditPricePerUnit: 0 },
        { enabled: true, creditPricePerUnit: -5 },
        { creditPricePerUnit: 0 },
      ),
    ).toBe(DEFAULT_CREDIT_PRICE_PER_UNIT);
  });
});

describe('isCreditPurchaseEnabled', () => {
  it('needs the build flag on', () => {
    expect(
      isCreditPurchaseEnabled({
        creditConfig: { enabled: true },
        isFeatureEnabled: false,
      }),
    ).toBe(false);
  });

  it('accepts either the credit config or a running fundraiser', () => {
    expect(
      isCreditPurchaseEnabled({
        creditConfig: { enabled: true },
        isFeatureEnabled: true,
      }),
    ).toBe(true);
    expect(
      isCreditPurchaseEnabled({
        creditConfig: { enabled: false },
        fundraisingConfig: { enabled: true },
        isFeatureEnabled: true,
      }),
    ).toBe(true);
  });

  it('is off when neither surface sells credits', () => {
    expect(
      isCreditPurchaseEnabled({
        creditConfig: { enabled: false },
        fundraisingConfig: { enabled: false },
        isFeatureEnabled: true,
      }),
    ).toBe(false);
  });
});

describe('getCreditPurchaseLimits', () => {
  it('defaults when unconfigured', () => {
    expect(getCreditPurchaseLimits(null)).toEqual({ min: 1, max: 100 });
  });

  it('never returns a max below the min', () => {
    expect(
      getCreditPurchaseLimits({
        enabled: true,
        minPurchase: 10,
        maxPurchase: 5,
      }),
    ).toEqual({ min: 10, max: 10 });
  });
});

describe('clampCreditAmount', () => {
  const limits = { min: 2, max: 10 };

  it.each([
    [0, 2],
    [1, 2],
    [5, 5],
    [50, 10],
    [Number.NaN, 2],
  ])('clamps %p to %p', (input, expected) => {
    expect(clampCreditAmount(input, limits)).toBe(expected);
  });

  it('drops fractions rather than charging for part of a night', () => {
    expect(clampCreditAmount(4.9, limits)).toBe(4);
  });
});

describe('parseCreditAmountFromQuery', () => {
  const limits = { min: 1, max: 100 };

  it('reads the amount off the URL', () => {
    expect(parseCreditAmountFromQuery('30', limits)).toBe(30);
  });

  it('takes the first value of a repeated query param', () => {
    expect(parseCreditAmountFromQuery(['7', '9'], limits)).toBe(7);
  });

  it.each([undefined, '', 'abc'])('falls back to the minimum for %p', (raw) => {
    expect(parseCreditAmountFromQuery(raw, limits)).toBe(1);
  });
});

describe('getCreditPackages', () => {
  it('prices the village bundles and adds the bonus on top', () => {
    const packages = getCreditPackages(
      {
        enabled: true,
        packages: [
          { title: 'Week', credits: 7, bonusCredits: 1 },
          { title: 'Broken', credits: 0 },
        ],
      },
      20,
    );

    expect(packages).toEqual([
      {
        title: 'Week',
        description: undefined,
        credits: 7,
        bonusCredits: 1,
        price: 140,
        fullPrice: 140,
        discountPercent: 0,
        totalCredits: 8,
      },
    ]);
  });

  it('offers nothing when the village authored no bundle', () => {
    // No invented ladder: a platform that sells no packages shows the
    // quantity stepper alone.
    expect(getCreditPackages({ enabled: true }, 30)).toEqual([]);
    expect(getCreditPackages(null, 30)).toEqual([]);
  });
});

describe('getBonusCreditsForAmount', () => {
  const packages = getCreditPackages(
    { enabled: true, packages: [{ credits: 7, bonusCredits: 2 }] },
    10,
  );

  it('grants the bonus while the bundle quantity is intact', () => {
    expect(getBonusCreditsForAmount(packages, 7)).toBe(2);
  });

  it('drops the bonus once the buyer changes the quantity', () => {
    expect(getBonusCreditsForAmount(packages, 6)).toBe(0);
  });
});

describe('getVolumeDiscounts', () => {
  it('orders tiers smallest-first', () => {
    expect(
      getVolumeDiscounts({
        enabled: true,
        volumeDiscounts: [
          { minCredits: 30, discountPercent: 15 },
          { minCredits: 10, discountPercent: 5 },
        ],
      }),
    ).toEqual([
      { minCredits: 10, discountPercent: 5 },
      { minCredits: 30, discountPercent: 15 },
    ]);
  });

  it('drops tiers an admin could not have meant', () => {
    // A blank row, a free-credits row and a negative one all price a purchase
    // wrongly; charging full price is the safe reading of a typo.
    expect(
      getVolumeDiscounts({
        enabled: true,
        volumeDiscounts: [
          { minCredits: 0, discountPercent: 10 },
          { minCredits: 10, discountPercent: 0 },
          { minCredits: 10, discountPercent: 100 },
          { minCredits: 10, discountPercent: -5 },
        ],
      }),
    ).toEqual([]);
  });
});

describe('getVolumeDiscountForAmount', () => {
  const tiers = getVolumeDiscounts({
    enabled: true,
    volumeDiscounts: [
      { minCredits: 10, discountPercent: 5 },
      { minCredits: 30, discountPercent: 15 },
    ],
  });

  it('gives nothing below the first tier', () => {
    expect(getVolumeDiscountForAmount(tiers, 9)).toBeNull();
  });

  it('applies the tier the amount reaches', () => {
    expect(getVolumeDiscountForAmount(tiers, 10)?.discountPercent).toBe(5);
  });

  it('takes the best single tier rather than stacking them', () => {
    expect(getVolumeDiscountForAmount(tiers, 40)?.discountPercent).toBe(15);
  });
});

describe('getCreditPurchasePrice', () => {
  const tiers = getVolumeDiscounts({
    enabled: true,
    volumeDiscounts: [{ minCredits: 10, discountPercent: 10 }],
  });

  it('charges full price below the first tier', () => {
    expect(getCreditPurchasePrice(5, 30, tiers)).toEqual({
      subtotal: 150,
      discountPercent: 0,
      discountAmount: 0,
      total: 150,
    });
  });

  it('takes the tier off the subtotal', () => {
    expect(getCreditPurchasePrice(10, 30, tiers)).toEqual({
      subtotal: 300,
      discountPercent: 10,
      discountAmount: 30,
      total: 270,
    });
  });

  it('rounds to whole cents', () => {
    const price = getCreditPurchasePrice(
      3,
      33.33,
      getVolumeDiscounts({
        enabled: true,
        volumeDiscounts: [{ minCredits: 3, discountPercent: 7 }],
      }),
    );
    expect(price).toEqual({
      subtotal: 99.99,
      discountPercent: 7,
      discountAmount: 7,
      total: 92.99,
    });
  });

  it('works with no tiers configured', () => {
    expect(getCreditPurchasePrice(4, 25).total).toBe(100);
  });
});

describe('getCreditPackages with volume discounts', () => {
  const config = {
    enabled: true,
    volumeDiscounts: [{ minCredits: 7, discountPercent: 20 }],
  };

  it('discounts an authored bundle that reaches a tier', () => {
    const packages = getCreditPackages(
      {
        ...config,
        packages: [
          { title: 'Week', credits: 7, bonusCredits: 1 },
          { title: 'Weekend', credits: 2 },
        ],
      },
      30,
    );

    expect(packages[0]).toMatchObject({
      credits: 7,
      price: 168,
      fullPrice: 210,
      discountPercent: 20,
      totalCredits: 8,
    });
    // Below the tier, the bundle is priced at list.
    expect(packages[1]).toMatchObject({
      credits: 2,
      price: 60,
      fullPrice: 60,
      discountPercent: 0,
    });
  });
});
