const get = jest.fn();

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => get(...args) },
}));

import { DashboardFeatures } from '../../components/Dashboard/dashboardFeatures';
import {
  StatRange,
  fetchStatValue,
  formatStatDelta,
  formatStatValue,
  getDashboardStatSpecs,
  getPreviousRange,
  getStatDelta,
  parseStatResponse,
  statQueryToPath,
  sumMetricValues,
} from '../dashboardStats.helpers';

const noFeatures: DashboardFeatures = {
  isBookingEnabled: false,
  isSubscriptionsEnabled: false,
  isEventsEnabled: false,
  isVolunteeringEnabled: false,
  isCitizenshipEnabled: false,
  isTokenSaleEnabled: false,
  isWeb3Enabled: false,
  isAffiliateEnabled: false,
  isGovernanceEnabled: false,
  isApplicationsEnabled: false,
  isFundraiserEnabled: false,
  isLearningHubEnabled: false,
  isPaymentEnabled: false,
};

const range: StatRange = {
  start: new Date('2026-03-01T00:00:00.000Z'),
  end: new Date('2026-03-31T23:59:59.000Z'),
  isAllTime: false,
};
const allTime: StatRange = { ...range, isAllTime: true };

const specById = (features: Partial<DashboardFeatures>, id: string) =>
  getDashboardStatSpecs(
    { ...noFeatures, ...features },
    { subscriptionPlanSlugs: ['wanderer'] },
  ).find((spec) => spec.id === id);

describe('getDashboardStatSpecs', () => {
  it('always includes accounts, and nothing feature-specific by default', () => {
    const ids = getDashboardStatSpecs(noFeatures).map((spec) => spec.id);
    expect(ids).toEqual(['accounts']);
  });

  it('adds a tile per enabled feature', () => {
    const ids = getDashboardStatSpecs(
      {
        ...noFeatures,
        isBookingEnabled: true,
        isEventsEnabled: true,
        isWeb3Enabled: true,
      },
      {},
    ).map((spec) => spec.id);

    expect(ids).toEqual([
      'accounts',
      'wallets',
      'bookings',
      'nights',
      'guests',
      'eventGuests',
    ]);
  });

  it('omits the subscribers tile when no plans are configured', () => {
    const ids = getDashboardStatSpecs(
      { ...noFeatures, isSubscriptionsEnabled: true },
      { subscriptionPlanSlugs: [] },
    ).map((spec) => spec.id);

    expect(ids).not.toContain('subscribers');
  });

  it('scopes accounts to the period, and drops the clause for all time', () => {
    const spec = specById({}, 'accounts')!;

    expect(spec.buildQuery(range)).toEqual({
      kind: 'count',
      model: 'user',
      where: {
        created: {
          $gte: '2026-03-01T00:00:00.000Z',
          $lte: '2026-03-31T23:59:59.000Z',
        },
      },
    });
    expect(spec.buildQuery(allTime)).toEqual({
      kind: 'count',
      model: 'user',
      where: {},
    });
  });

  it('counts bookings that overlap the period, not only those starting in it', () => {
    const query = specById({ isBookingEnabled: true }, 'bookings')!.buildQuery(
      range,
    ) as any;

    expect(query.where.$and).toEqual([
      { start: { $lte: '2026-03-31T23:59:59.000Z' } },
      { end: { $gte: '2026-03-01T00:00:00.000Z' } },
    ]);
  });

  it('sums nights from the booking duration field', () => {
    expect(
      specById({ isBookingEnabled: true }, 'nights')!.buildQuery(allTime),
    ).toMatchObject({ kind: 'sum', model: 'booking', field: 'duration' });
  });

  it('counts volunteers on confirmed stays, since they never reach a paid status', () => {
    const query = specById(
      { isVolunteeringEnabled: true },
      'volunteers',
    )!.buildQuery(allTime) as any;

    expect(query.where.status.$in).toContain('confirmed');
    expect(query.where.volunteerId).toEqual({ $exists: true });
  });

  it('does not count guests on merely confirmed stays', () => {
    const query = specById({ isBookingEnabled: true }, 'guests')!.buildQuery(
      allTime,
    ) as any;

    expect(query.where.status.$in).not.toContain('confirmed');
  });

  it('marks current-total tiles as stock so they are not compared over time', () => {
    expect(
      specById({ isCitizenshipEnabled: true }, 'citizens')!.mode,
    ).toBe('stock');
    expect(
      specById({ isSubscriptionsEnabled: true }, 'subscribers')!.mode,
    ).toBe('stock');
    expect(specById({}, 'accounts')!.mode).toBe('flow');
  });
});

describe('statQueryToPath', () => {
  it('builds count, sum and metric paths', () => {
    expect(
      statQueryToPath({ kind: 'count', model: 'user', where: {} }),
    ).toBe('/count/user');
    expect(
      statQueryToPath({
        kind: 'sum',
        model: 'booking',
        field: 'duration',
        where: {},
      }),
    ).toBe('/sum/booking/duration');
    expect(
      statQueryToPath({ kind: 'metricSum', where: {}, limit: 10 }),
    ).toBe('/metric');
  });
});

describe('parseStatResponse', () => {
  it('reads the results key the API actually returns', () => {
    expect(parseStatResponse({ results: 42 })).toBe(42);
    expect(parseStatResponse({ results: 0 })).toBe(0);
  });

  it('falls back to other shapes and to zero', () => {
    expect(parseStatResponse({ count: 7 })).toBe(7);
    expect(parseStatResponse({ sum: 7 })).toBe(7);
    expect(parseStatResponse({ results: [1, 2, 3] })).toBe(3);
    expect(parseStatResponse({})).toBe(0);
    expect(parseStatResponse(null)).toBe(0);
    expect(parseStatResponse({ results: 'nope' })).toBe(0);
  });
});

describe('sumMetricValues', () => {
  it('coerces the string-typed metric value', () => {
    expect(
      sumMetricValues({ results: [{ value: '2' }, { value: '5' }] }),
    ).toBe(7);
  });

  it('skips rows that are not numeric', () => {
    expect(
      sumMetricValues({ results: [{ value: 'great' }, { value: '3' }, {}] }),
    ).toBe(3);
    expect(sumMetricValues({})).toBe(0);
  });
});

describe('fetchStatValue', () => {
  beforeEach(() => get.mockReset());

  it('sends the where clause and returns the scalar', async () => {
    get.mockResolvedValue({ data: { results: 12 } });

    const value = await fetchStatValue({
      kind: 'count',
      model: 'user',
      where: { roles: { $in: ['member'] } },
    });

    expect(value).toBe(12);
    expect(get).toHaveBeenCalledWith('/count/user', {
      params: { where: { roles: { $in: ['member'] } } },
    });
  });

  it('passes a limit for metric sums', async () => {
    get.mockResolvedValue({ data: { results: [{ value: '4' }] } });

    const value = await fetchStatValue({
      kind: 'metricSum',
      where: { event: 'token-sale' },
      limit: 500,
    });

    expect(value).toBe(4);
    expect(get).toHaveBeenCalledWith('/metric', {
      params: { where: { event: 'token-sale' }, limit: 500 },
    });
  });

  it('degrades to zero when a request fails', async () => {
    get.mockRejectedValue(new Error('boom'));

    await expect(
      fetchStatValue({ kind: 'count', model: 'user', where: {} }),
    ).resolves.toBe(0);
  });
});

describe('getPreviousRange', () => {
  it('returns the preceding window of equal length', () => {
    const previous = getPreviousRange({
      start: new Date('2026-03-11T00:00:00.000Z'),
      end: new Date('2026-03-21T00:00:00.000Z'),
      isAllTime: false,
    });

    expect(previous?.start.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(previous?.end.toISOString()).toBe('2026-03-11T00:00:00.000Z');
  });

  it('has nothing to compare for all time', () => {
    expect(getPreviousRange(allTime)).toBeNull();
  });
});

describe('getStatDelta', () => {
  it('computes the fractional change', () => {
    expect(getStatDelta(150, 100)).toEqual({ ratio: 0.5, direction: 'up' });
    expect(getStatDelta(50, 100)).toEqual({ ratio: -0.5, direction: 'down' });
    expect(getStatDelta(100, 100)).toEqual({ ratio: 0, direction: 'flat' });
  });

  it('reports growth without a percentage when the baseline is zero', () => {
    expect(getStatDelta(5, 0)).toEqual({ ratio: null, direction: 'up' });
    expect(getStatDelta(0, 0)).toEqual({ ratio: null, direction: 'flat' });
  });

  it('has no delta without a baseline', () => {
    expect(getStatDelta(5, undefined)).toEqual({
      ratio: null,
      direction: 'flat',
    });
  });
});

describe('formatting', () => {
  it('formats whole and fractional values', () => {
    expect(formatStatValue(1500)).toBe('1,500');
    expect(formatStatValue(12.345)).toBe('12.35');
    expect(formatStatValue(Number.NaN)).toBe('0');
  });

  it('formats deltas with a sign, and nothing without a ratio', () => {
    expect(formatStatDelta({ ratio: 0.25, direction: 'up' })).toBe('+25%');
    expect(formatStatDelta({ ratio: -0.25, direction: 'down' })).toBe('-25%');
    expect(formatStatDelta({ ratio: null, direction: 'up' })).toBeNull();
  });
});
