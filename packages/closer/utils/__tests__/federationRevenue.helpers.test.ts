import {
  FederationVillage,
  buildVillageEarningsRows,
  getBilledVillageIds,
  getVillageNameFromChargeDescription,
  parseFederationCharges,
  parseFederationVillages,
  sumFederationCharges,
  sumFederationRefunds,
} from '../federationRevenue.helpers';

const platformFeeCharge = (overrides: Record<string, unknown> = {}) => ({
  _id: 'charge-1',
  type: 'villagePlatformFee',
  status: 'paid',
  method: 'billing',
  date: '2026-03-04T00:00:00.000Z',
  amount: { total: { val: 12.5, cur: 'eur' } },
  linkedObjectType: 'Village',
  linkedObjectId: 'village-a',
  description: 'Platform fees · Traditional Dream Factory · 2026-03-03 – 2026-03-04',
  meta: { chargeCount: 8, refundCount: 1, villageId: 'village-a' },
  ...overrides,
});

const subscriptionCharge = (overrides: Record<string, unknown> = {}) => ({
  _id: 'sub-1',
  type: 'subscription',
  status: 'paid',
  method: 'stripe',
  date: '2026-03-01T00:00:00.000Z',
  amount: { total: { val: 49, cur: 'EUR' } },
  createdBy: 'founder-a',
  meta: { subscriptionPlan: 'basic' },
  ...overrides,
});

const villages: FederationVillage[] = [
  {
    _id: 'village-a',
    name: 'Traditional Dream Factory',
    createdBy: 'founder-a',
    onboardingStatus: 'live',
  },
  {
    _id: 'village-b',
    name: 'Amagi',
    createdBy: 'founder-b',
    onboardingStatus: 'live',
  },
];

describe('parseFederationCharges', () => {
  it('reads the fields the hub dashboard needs off a platform fee charge', () => {
    const [charge] = parseFederationCharges(
      { results: [platformFeeCharge()] },
      'platformFee',
    );

    expect(charge).toMatchObject({
      _id: 'charge-1',
      kind: 'platformFee',
      amount: 12.5,
      currency: 'EUR',
      villageId: 'village-a',
      chargeCount: 8,
      refundCount: 1,
    });
  });

  it('unwraps extended-JSON ids and dates', () => {
    const [charge] = parseFederationCharges(
      {
        results: [
          platformFeeCharge({
            _id: { $oid: 'charge-9' },
            date: { $date: '2026-03-04T00:00:00.000Z' },
            linkedObjectId: { $oid: 'village-z' },
          }),
        ],
      },
      'platformFee',
    );

    expect(charge._id).toBe('charge-9');
    expect(charge.date).toBe('2026-03-04T00:00:00.000Z');
    expect(charge.villageId).toBe('village-z');
  });

  it('falls back to meta.villageId when the link is missing', () => {
    const [charge] = parseFederationCharges(
      { results: [platformFeeCharge({ linkedObjectId: undefined })] },
      'platformFee',
    );
    expect(charge.villageId).toBe('village-a');
  });

  it('never claims a village for a subscription charge', () => {
    const [charge] = parseFederationCharges(
      { results: [subscriptionCharge({ linkedObjectId: 'village-a' })] },
      'subscription',
    );
    expect(charge.villageId).toBeNull();
    expect(charge.createdBy).toBe('founder-a');
  });

  it('degrades to no charges on a shape it does not recognise', () => {
    expect(parseFederationCharges(null, 'platformFee')).toEqual([]);
    expect(parseFederationCharges({}, 'platformFee')).toEqual([]);
    expect(parseFederationCharges({ results: {} }, 'platformFee')).toEqual([]);
  });
});

describe('sums', () => {
  const charges = parseFederationCharges(
    {
      results: [
        platformFeeCharge({ _id: 'a', amount: { total: { val: 10, cur: 'EUR' } } }),
        // A day whose refunds outweighed its payments: the report is negative
        // and still counts against the period.
        platformFeeCharge({ _id: 'b', amount: { total: { val: -4, cur: 'EUR' } } }),
        platformFeeCharge({
          _id: 'c',
          status: 'refunded',
          amount: { total: { val: 3, cur: 'EUR' } },
        }),
      ],
    },
    'platformFee',
  );

  it('earns the signed total of everything not refunded', () => {
    expect(sumFederationCharges(charges)).toBe(6);
  });

  it('counts refunded charges separately', () => {
    expect(sumFederationRefunds(charges)).toBe(3);
  });
});

describe('getBilledVillageIds', () => {
  it('deduplicates and skips charges with no link', () => {
    const charges = parseFederationCharges(
      {
        results: [
          platformFeeCharge({ _id: 'a' }),
          platformFeeCharge({ _id: 'b' }),
          platformFeeCharge({
            _id: 'c',
            linkedObjectId: 'village-b',
            meta: {},
          }),
          platformFeeCharge({ _id: 'd', linkedObjectId: null, meta: {} }),
        ],
      },
      'platformFee',
    );
    expect(getBilledVillageIds(charges)).toEqual(['village-a', 'village-b']);
  });
});

describe('getVillageNameFromChargeDescription', () => {
  it('recovers the name the billing route wrote into the description', () => {
    expect(
      getVillageNameFromChargeDescription(
        'Platform fees · Traditional Dream Factory · 2026-03-03 – 2026-03-04',
      ),
    ).toBe('Traditional Dream Factory');
  });

  it('returns null when the description is not that shape', () => {
    expect(getVillageNameFromChargeDescription('')).toBeNull();
    expect(getVillageNameFromChargeDescription('Platform fees')).toBeNull();
  });
});

describe('buildVillageEarningsRows', () => {
  const fees = parseFederationCharges(
    {
      results: [
        platformFeeCharge({ _id: 'a' }),
        platformFeeCharge({
          _id: 'b',
          amount: { total: { val: 7.5, cur: 'EUR' } },
          meta: { chargeCount: 4, refundCount: 0, villageId: 'village-a' },
        }),
        platformFeeCharge({
          _id: 'c',
          linkedObjectId: 'village-b',
          amount: { total: { val: 100, cur: 'EUR' } },
          description: 'Platform fees · Amagi · 2026-03-03 – 2026-03-04',
          meta: { chargeCount: 20, refundCount: 2, villageId: 'village-b' },
        }),
      ],
    },
    'platformFee',
  );

  it('groups fees per village and totals the reports behind them', () => {
    const rows = buildVillageEarningsRows(fees, [], villages);

    expect(rows.map((row) => row.name)).toEqual([
      'Amagi',
      'Traditional Dream Factory',
    ]);
    expect(rows[1]).toMatchObject({
      villageId: 'village-a',
      platformFee: 20,
      reports: 2,
      chargesBilled: 12,
      refunds: 1,
      onboardingStatus: 'live',
      total: 20,
    });
  });

  it('attributes a subscription to the village its subscriber founded', () => {
    const subscriptions = parseFederationCharges(
      { results: [subscriptionCharge()] },
      'subscription',
    );
    const rows = buildVillageEarningsRows(fees, subscriptions, villages);
    const tdf = rows.find((row) => row.villageId === 'village-a');

    expect(tdf).toMatchObject({ subscriptions: 49, total: 69 });
  });

  it('never spreads one subscription across the villages a hub admin manages', () => {
    // `managedBy` holds hub staff, so it is not an ownership link. Only
    // `createdBy` is, and this subscriber founded nothing.
    const subscriptions = parseFederationCharges(
      { results: [subscriptionCharge({ createdBy: 'hub-admin' })] },
      'subscription',
    );
    const rows = buildVillageEarningsRows(fees, subscriptions, villages);

    expect(rows.every((row) => row.subscriptions === 0 || row.isUnattributed)).toBe(
      true,
    );
    expect(rows[rows.length - 1]).toMatchObject({
      isUnattributed: true,
      subscriptions: 49,
      total: 49,
    });
  });

  it('leaves no unattributed row when every subscription found a village', () => {
    const subscriptions = parseFederationCharges(
      { results: [subscriptionCharge()] },
      'subscription',
    );
    const rows = buildVillageEarningsRows(fees, subscriptions, villages);
    expect(rows.some((row) => row.isUnattributed)).toBe(false);
  });

  it('ignores refunded subscriptions when attributing', () => {
    const subscriptions = parseFederationCharges(
      { results: [subscriptionCharge({ status: 'refunded' })] },
      'subscription',
    );
    const rows = buildVillageEarningsRows(fees, subscriptions, villages);
    expect(rows.every((row) => row.subscriptions === 0)).toBe(true);
  });

  it('names a village from its own charges when the lookup did not return it', () => {
    const rows = buildVillageEarningsRows(fees, [], []);
    expect(rows.map((row) => row.name)).toEqual([
      'Amagi',
      'Traditional Dream Factory',
    ]);
  });
});

describe('parseFederationVillages', () => {
  it('keeps only the fields the earnings table reads', () => {
    expect(
      parseFederationVillages({
        results: [
          {
            _id: { $oid: 'village-a' },
            name: 'TDF',
            createdBy: 'founder-a',
            onboardingStatus: 'live',
            description: 'ignored',
          },
        ],
      }),
    ).toEqual([
      {
        _id: 'village-a',
        name: 'TDF',
        createdBy: 'founder-a',
        onboardingStatus: 'live',
        status: null,
      },
    ]);
  });

  it('degrades to no villages on an unexpected payload', () => {
    expect(parseFederationVillages(undefined)).toEqual([]);
  });
});
