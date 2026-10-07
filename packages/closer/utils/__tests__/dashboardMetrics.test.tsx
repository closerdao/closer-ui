import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  fetchDashboardStat,
  fetchMetricsDashboard,
  fetchTokenSales,
  findMetricPoints,
  loadMetricCount,
  loadMetricPoints,
  toMetricFilterInput,
} from '../dashboardMetrics';
import { getDashboardStatSpecs } from '../dashboardStats.helpers';
import { readMetricsApiMessage } from '../metricsDashboard.helpers';
import * as builders from '../performance.utils';
import { isTrpcEnabled, trpc } from '../trpc';
import fixture from './metricFilters.json';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../trpc', () => {
  const procedures = [
    'kpi',
    'byCategory',
    'dailyTrends',
    'tokenFunnel',
    'bookingFunnel',
    'subscriptionsFunnel',
    'citizenshipFunnel',
    'coHousingFunnel',
    'signupFunnel',
    'fundraiserFunnel',
    'navigationTop',
    'tokenSales',
    'count',
    'sumPoints',
    'tokenSaleTotal',
  ];
  return {
    ...jest.requireActual('../trpc'),
    isTrpcEnabled: jest.fn(),
    trpc: {
      metricDashboard: Object.fromEntries(
        procedures.map((name) => [name, { query: jest.fn() }]),
      ),
    },
  };
});

const mockedGet = (api as unknown as { get: jest.Mock }).get;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const dashboard = trpc.metricDashboard as unknown as Record<
  string,
  { query: jest.Mock }
>;

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32004,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

const START = '2030-03-01T00:00:00.000Z';
const END = '2030-03-31T23:59:59.999Z';

const PROCEDURES = [
  'kpi',
  'byCategory',
  'dailyTrends',
  'tokenFunnel',
  'bookingFunnel',
  'subscriptionsFunnel',
  'citizenshipFunnel',
  'coHousingFunnel',
  'signupFunnel',
  'fundraiserFunnel',
  'navigationTop',
  'tokenSales',
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedEnabled.mockReturnValue(false);
});

describe('fetchMetricsDashboard', () => {
  it('sends the twelve legacy GETs with tRPC off', async () => {
    mockedGet.mockImplementation((path: string) =>
      Promise.resolve({ data: { results: [path] } }),
    );

    const settled = await fetchMetricsDashboard({
      start: START,
      end: END,
      categories: 'booking,token',
      limit: 25,
    });

    const scoped = {
      params: { start: START, end: END, categories: 'booking,token' },
    };
    const range = { params: { start: START, end: END } };
    expect(mockedGet.mock.calls).toEqual([
      ['/metrics/dashboard/kpi', scoped],
      ['/metrics/dashboard/by-category', scoped],
      ['/metrics/dashboard/daily-trends', scoped],
      ['/metrics/dashboard/token-funnel', range],
      ['/metrics/dashboard/booking-funnel', range],
      ['/metrics/dashboard/subscriptions-funnel', range],
      ['/metrics/dashboard/citizenship-funnel', range],
      ['/metrics/dashboard/co-housing-funnel', range],
      ['/metrics/dashboard/signup-funnel', range],
      ['/metrics/dashboard/fundraiser-funnel', range],
      [
        '/metrics/dashboard/navigation-top',
        { params: { start: START, end: END, limit: 25 } },
      ],
      ['/metrics/token-sales'],
    ]);
    expect(settled[0]).toEqual({
      status: 'fulfilled',
      value: ['/metrics/dashboard/kpi'],
    });
    expect(settled[11]).toEqual({
      status: 'fulfilled',
      value: ['/metrics/token-sales'],
    });
    PROCEDURES.forEach((name) =>
      expect(dashboard[name].query).not.toHaveBeenCalled(),
    );
  });

  it('leaves categories out when every category is selected', async () => {
    mockedGet.mockResolvedValue({ data: { results: [] } });

    await fetchMetricsDashboard({ start: START, end: END, limit: 50 });

    expect(mockedGet).toHaveBeenCalledWith('/metrics/dashboard/kpi', {
      params: { start: START, end: END },
    });
  });

  it('settles a failed legacy read on its own', async () => {
    const unauthorized = Object.assign(new Error('401'), {
      response: { status: 401 },
    });
    mockedGet.mockImplementation((path: string) =>
      path === '/metrics/token-sales'
        ? Promise.reject(unauthorized)
        : Promise.resolve({ data: { results: [] } }),
    );

    const settled = await fetchMetricsDashboard({
      start: START,
      end: END,
      limit: 50,
    });

    expect(settled.slice(0, 11).every((s) => s.status === 'fulfilled')).toBe(
      true,
    );
    expect(settled[11]).toEqual({ status: 'rejected', reason: unauthorized });
  });

  it('calls the twelve procedures with tRPC on', async () => {
    mockedEnabled.mockReturnValue(true);
    PROCEDURES.forEach((name) =>
      dashboard[name].query.mockResolvedValue([name]),
    );

    const settled = await fetchMetricsDashboard({
      start: START,
      end: END,
      categories: 'booking,token',
      limit: 25,
    });

    const scoped = { start: START, end: END, categories: ['booking', 'token'] };
    const range = { start: START, end: END };
    expect(dashboard.kpi.query).toHaveBeenCalledWith(scoped);
    expect(dashboard.byCategory.query).toHaveBeenCalledWith(scoped);
    expect(dashboard.dailyTrends.query).toHaveBeenCalledWith(scoped);
    [
      'tokenFunnel',
      'bookingFunnel',
      'subscriptionsFunnel',
      'citizenshipFunnel',
      'coHousingFunnel',
      'signupFunnel',
      'fundraiserFunnel',
    ].forEach((name) =>
      expect(dashboard[name].query).toHaveBeenCalledWith(range),
    );
    expect(dashboard.navigationTop.query).toHaveBeenCalledWith({
      start: START,
      end: END,
      limit: 25,
    });
    expect(dashboard.tokenSales.query).toHaveBeenCalledWith();
    expect(settled.map((s) => s.status === 'fulfilled' && s.value)).toEqual(
      PROCEDURES.map((name) => [name]),
    );
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('sends no categories over tRPC when none are picked', async () => {
    mockedEnabled.mockReturnValue(true);
    PROCEDURES.forEach((name) => dashboard[name].query.mockResolvedValue([]));

    await fetchMetricsDashboard({ start: START, end: END, limit: 50 });

    expect(dashboard.kpi.query).toHaveBeenCalledWith({
      start: START,
      end: END,
    });
  });

  it.each([
    ['FORBIDDEN', 403],
    ['UNAUTHORIZED', 401],
  ])('rejects %s as legacy 401', async (code, httpStatus) => {
    mockedEnabled.mockReturnValue(true);
    PROCEDURES.forEach((name) =>
      dashboard[name].query.mockRejectedValue(
        trpcError(code, httpStatus, 'Not allowed'),
      ),
    );

    const settled = await fetchMetricsDashboard({
      start: START,
      end: END,
      limit: 50,
    });

    settled.forEach((s) => {
      expect(s.status).toBe('rejected');
      expect((s as PromiseRejectedResult).reason.response).toEqual({
        status: 401,
        data: { error: 'Not allowed' },
      });
    });
  });

  it('keeps a BAD_REQUEST message where the page reads it', async () => {
    mockedEnabled.mockReturnValue(true);
    PROCEDURES.forEach((name) => dashboard[name].query.mockResolvedValue([]));
    dashboard.kpi.query.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'start must be before or equal to end.'),
    );

    const settled = await fetchMetricsDashboard({
      start: END,
      end: START,
      limit: 50,
    });

    expect((settled[0] as PromiseRejectedResult).reason.response).toEqual({
      status: 400,
      data: { error: 'start must be before or equal to end.' },
    });
    expect(
      readMetricsApiMessage((settled[0] as PromiseRejectedResult).reason),
    ).toBe('start must be before or equal to end.');
    expect(settled[1].status).toBe('fulfilled');
  });
});

describe('fetchTokenSales', () => {
  const rows = [{ value: '5', created: START }];

  it('reads GET /metrics/token-sales with tRPC off', async () => {
    mockedGet.mockResolvedValue({ data: { results: rows } });

    await expect(fetchTokenSales()).resolves.toEqual(rows);
    expect(mockedGet.mock.calls).toEqual([['/metrics/token-sales']]);
  });

  it('reads metricDashboard.tokenSales with tRPC on', async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.tokenSales.query.mockResolvedValue(rows);

    await expect(fetchTokenSales()).resolves.toEqual(rows);
    expect(mockedGet).not.toHaveBeenCalled();
  });
});

type FixtureRow = {
  builder: string;
  args: { fromDate: string; toDate: string; timeFrame: string } | null;
  sent: Record<string, any>;
  input: Record<string, unknown>;
};

const rows = fixture.filters as FixtureRow[];
const builderRows = rows.filter((row) => row.args && row.builder in builders);

describe('the eleven metric builders against closer-api-ts fixtures', () => {
  it('covers every builder the API fixture captured', () => {
    expect(new Set(builderRows.map((row) => row.builder)).size).toBe(11);
  });

  it.each(rows.map((row) => [row.builder, row] as const))(
    '%s maps its where onto the matching tRPC filter',
    (_name, row) => {
      expect(toMetricFilterInput(row.sent)).toEqual(row.input);
    },
  );

  // The builders read the date range in local time, so `created` is checked against getStartAndEndDate.
  it.each(builderRows.map((row) => [row.builder, row] as const))(
    '%s still sends the where legacy sent',
    (_name, row) => {
      const args = row.args!;
      const build = (builders as unknown as Record<string, (a: any) => any>)[
        row.builder
      ];
      const { where, limit } = build(args);
      const { created, ...rest } = JSON.parse(JSON.stringify(where));
      const { created: sentCreated, ...sentRest } = row.sent;
      expect(rest).toEqual(sentRest);
      expect(limit).toBeGreaterThan(0);
      if (args.timeFrame === 'allTime') {
        expect(created).toBeUndefined();
        expect(sentCreated).toBeUndefined();
        return;
      }
      const { startDate, endDate } = builders.getStartAndEndDate(
        args.timeFrame,
        args.fromDate,
        args.toDate,
      );
      expect(created).toEqual({
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      });
      expect(toMetricFilterInput(where)).toEqual({
        ...row.input,
        createdAfter: startDate.toISOString(),
        createdBefore: endDate.toISOString(),
      });
    },
  );
});

describe('loadMetricCount', () => {
  const filter = builders.generateTokenSalesFilter({
    fromDate: '',
    toDate: '',
    timeFrame: 'allTime',
    event: ['buy-tokens', 'open-flow'],
  });
  const platform = () => ({
    metric: { getCount: jest.fn(), setCount: jest.fn() },
  });

  it('asks the store for GET /count/metric with tRPC off', async () => {
    const store = platform();

    await loadMetricCount(store, filter);

    expect(store.metric.getCount).toHaveBeenCalledWith(filter);
    expect(dashboard.count.query).not.toHaveBeenCalled();
  });

  it('stores metricDashboard.count under the same filter with tRPC on', async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.count.query.mockResolvedValue(9);
    const store = platform();

    await loadMetricCount(store, filter);

    expect(dashboard.count.query).toHaveBeenCalledWith({
      events: ['buy-tokens', 'open-flow'],
      categoryValuePairs: [
        { category: 'token' },
        { category: 'engagement', value: 'token-sale' },
      ],
    });
    expect(store.metric.setCount).toHaveBeenCalledWith(filter, 9);
    expect(store.metric.getCount).not.toHaveBeenCalled();
  });

  it("sends the affiliate page's single event as a list", async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.count.query.mockResolvedValue(2);
    const store = platform();
    const affiliate = { where: { event: 'affiliate-page-view' } };

    await loadMetricCount(store, affiliate);

    expect(dashboard.count.query).toHaveBeenCalledWith({
      events: ['affiliate-page-view'],
    });
    expect(store.metric.setCount).toHaveBeenCalledWith(affiliate, 2);
  });

  it('leaves the store alone when the count fails', async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.count.query.mockRejectedValue(
      trpcError('FORBIDDEN', 403, 'Not allowed'),
    );
    const store = platform();

    await expect(loadMetricCount(store, filter)).resolves.toBeUndefined();
    expect(store.metric.setCount).not.toHaveBeenCalled();
  });
});

describe('loadMetricPoints and findMetricPoints', () => {
  const basket = builders.generateTokenBasketFilter({
    fromDate: '',
    toDate: '',
    timeFrame: 'allTime',
  });

  it('lists the basket into the store and sums point ?? 1 with tRPC off', async () => {
    const store = {
      metric: {
        get: jest.fn(),
        find: jest.fn(() => ({
          toJS: () => [{ point: 3 }, {}, { point: 4 }],
        })),
      },
    };

    await loadMetricPoints(store, basket);

    expect(store.metric.get).toHaveBeenCalledWith(basket);
    expect(findMetricPoints(store, basket)).toBe(8);
    expect(store.metric.find).toHaveBeenCalledWith(basket);
  });

  it('sums nothing for a store entry that is not a list', () => {
    const store = { metric: { find: () => undefined } };
    expect(findMetricPoints(store, basket)).toBe(0);
  });

  it('stores metricDashboard.sumPoints with tRPC on', async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.sumPoints.query.mockResolvedValue(12);
    const store = {
      metric: { setSum: jest.fn(), findSum: jest.fn(() => 12) },
    };

    await loadMetricPoints(store, basket);

    expect(dashboard.sumPoints.query).toHaveBeenCalledWith({
      events: ['token-sale-success', 'purchase-complete-crypto'],
      categoryValuePairs: [
        { category: 'token', value: 'sale' },
        { category: 'engagement', value: 'token-sale' },
      ],
    });
    expect(store.metric.setSum).toHaveBeenCalledWith(basket, 12);
    expect(findMetricPoints(store, basket)).toBe(12);
    expect(store.metric.findSum).toHaveBeenCalledWith(basket);
  });
});

describe('fetchDashboardStat', () => {
  const tokensQuery = (isAllTime: boolean) => {
    const spec = getDashboardStatSpecs({
      isBookingEnabled: false,
      isSubscriptionsEnabled: false,
      isEventsEnabled: false,
      isVolunteeringEnabled: false,
      isCitizenshipEnabled: false,
      isTokenSaleEnabled: true,
      isWeb3Enabled: false,
      isAffiliateEnabled: false,
      isGovernanceEnabled: false,
      isApplicationsEnabled: false,
      isFundraiserEnabled: false,
      isLearningHubEnabled: false,
      isPaymentEnabled: false,
    }).find((s) => s.id === 'tokens')!;
    return spec.buildQuery({
      start: new Date(START),
      end: new Date(END),
      isAllTime,
    });
  };
  const tokenSaleStat = rows.find((row) => row.builder === 'tokenSaleStat')!;

  it('lists token-sale metrics and sums value with tRPC off', async () => {
    mockedGet.mockResolvedValue({
      data: { results: [{ value: '2' }, { value: '3.5' }] },
    });

    await expect(fetchDashboardStat(tokensQuery(false))).resolves.toBe(5.5);
    expect(mockedGet).toHaveBeenCalledWith('/metric', {
      params: { where: tokenSaleStat.sent, limit: 5000 },
    });
  });

  it('asks metricDashboard.tokenSaleTotal with tRPC on', async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.tokenSaleTotal.query.mockResolvedValue(42);

    await expect(fetchDashboardStat(tokensQuery(false))).resolves.toBe(42);
    expect(dashboard.tokenSaleTotal.query).toHaveBeenCalledWith({
      createdAfter: START,
      createdBefore: END,
    });
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('sends no range for all time and reads 0 on failure', async () => {
    mockedEnabled.mockReturnValue(true);
    dashboard.tokenSaleTotal.query.mockRejectedValue(
      trpcError('FORBIDDEN', 403, 'Not allowed'),
    );

    await expect(fetchDashboardStat(tokensQuery(true))).resolves.toBe(0);
    expect(dashboard.tokenSaleTotal.query).toHaveBeenCalledWith({});
  });

  it('keeps the other stats on the legacy aggregations with tRPC on', async () => {
    mockedEnabled.mockReturnValue(true);
    mockedGet.mockResolvedValue({ data: { results: 4 } });

    await expect(
      fetchDashboardStat({ kind: 'count', model: 'user', where: {} }),
    ).resolves.toBe(4);
    expect(mockedGet).toHaveBeenCalledWith('/count/user', {
      params: { where: {} },
    });
  });
});
