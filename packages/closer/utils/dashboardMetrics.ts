import { TRPCClientError } from '@trpc/client';

import type { MetricsTokenSaleRow } from '../types/metricsDashboard';
import api from './api';
import { type StatQuery, fetchStatValue } from './dashboardStats.helpers';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type Platform = Record<string, any>;

type MetricWhere = {
  event?: string | { $in: string[] };
  $or?: { category: string; value?: string; event?: string }[];
  created?: { $gte?: Date | string; $lte?: Date | string };
};

// The `where` a performance builder, TokenSalesFunnel or the affiliate page sends to `/count/metric` and `/metric`.
export type MetricQuery = { where: MetricWhere; limit?: number };

// Legacy sent an invalid date as JSON null, which closer-api cast to the epoch.
const iso = (date: Date | string) => {
  const parsed = new Date(date);
  return (Number.isNaN(parsed.getTime()) ? new Date(0) : parsed).toISOString();
};

// The tRPC filter that matches what closer-api built from `where`.
export const toMetricFilterInput = (where: MetricWhere) => ({
  ...(where.event !== undefined && {
    events: typeof where.event === 'string' ? [where.event] : where.event.$in,
  }),
  ...(where.$or && { categoryValuePairs: where.$or }),
  ...(where.created?.$gte && { createdAfter: iso(where.created.$gte) }),
  ...(where.created?.$lte && { createdBefore: iso(where.created.$lte) }),
});

// Legacy answered 401 to signed-out and to roles without access alike; the page shows one state for both.
const throwDashboardError = (error: unknown): never => {
  const code = error instanceof TRPCClientError ? error.data?.code : undefined;
  if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
    throw Object.assign(new Error((error as Error).message), {
      response: { status: 401, data: { error: (error as Error).message } },
    });
  }
  return throwApiError(error);
};

// Legacy `GET /metrics/token-sales`: every token-sale metric as `{value, created}`.
export const fetchTokenSales = async (): Promise<MetricsTokenSaleRow[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/metrics/token-sales');
    return res.data?.results;
  }
  const rows = await trpc.metricDashboard.tokenSales
    .query()
    .catch(throwDashboardError);
  return rows as MetricsTokenSaleRow[];
};

export type MetricsDashboardQuery = {
  start: string;
  end: string;
  // Legacy's comma-joined list; none means every dashboard category.
  categories?: string;
  limit: number;
};

// The `/dashboard/metrics` page's twelve reads, each settled on its own with the legacy body's `results`.
export const fetchMetricsDashboard = ({
  start,
  end,
  categories,
  limit,
}: MetricsDashboardQuery): Promise<PromiseSettledResult<unknown>[]> => {
  if (!isTrpcEnabled()) {
    const base = { start, end, ...(categories ? { categories } : {}) };
    const range = { start, end };
    const results = (path: string, params: Record<string, unknown>) =>
      api.get(path, { params }).then((res) => res.data?.results);
    return Promise.allSettled([
      results('/metrics/dashboard/kpi', base),
      results('/metrics/dashboard/by-category', base),
      results('/metrics/dashboard/daily-trends', base),
      results('/metrics/dashboard/token-funnel', range),
      results('/metrics/dashboard/booking-funnel', range),
      results('/metrics/dashboard/subscriptions-funnel', range),
      results('/metrics/dashboard/citizenship-funnel', range),
      results('/metrics/dashboard/co-housing-funnel', range),
      results('/metrics/dashboard/signup-funnel', range),
      results('/metrics/dashboard/fundraiser-funnel', range),
      results('/metrics/dashboard/navigation-top', { start, end, limit }),
      fetchTokenSales(),
    ]);
  }
  const scoped = {
    start,
    end,
    ...(categories && { categories: categories.split(',') }),
  };
  const range = { start, end };
  const dashboard = trpc.metricDashboard;
  return Promise.allSettled(
    [
      dashboard.kpi.query(scoped),
      dashboard.byCategory.query(scoped),
      dashboard.dailyTrends.query(scoped),
      dashboard.tokenFunnel.query(range),
      dashboard.bookingFunnel.query(range),
      dashboard.subscriptionsFunnel.query(range),
      dashboard.citizenshipFunnel.query(range),
      dashboard.coHousingFunnel.query(range),
      dashboard.signupFunnel.query(range),
      dashboard.fundraiserFunnel.query(range),
      dashboard.navigationTop.query({ start, end, limit }),
      dashboard.tokenSales.query(),
    ].map((read: Promise<unknown>) => read.catch(throwDashboardError)),
  );
};

// Legacy `GET /count/metric` into the store, where `findCount` reads it; a failed count leaves the store as it was.
export const loadMetricCount = async (
  platform: Platform,
  filter: MetricQuery,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.metric.getCount(filter);
    return;
  }
  const count = await trpc.metricDashboard.count
    .query(toMetricFilterInput(filter.where))
    .catch(() => null);
  if (count !== null) platform.metric.setCount(filter, count);
};

// One purchase can carry several tokens in `point`; a store entry that is not a list sums to 0.
const sumPoints = (list: { toJS: () => unknown } | undefined): number => {
  const records = typeof list?.toJS === 'function' ? list.toJS() : list;
  if (!Array.isArray(records)) return 0;
  return records.reduce(
    (sum: number, item: { point?: number } | null) => sum + (item?.point ?? 1),
    0,
  );
};

// TokenSalesFunnel's basket total: legacy lists the metrics into the store, tRPC stores the server's sum.
export const loadMetricPoints = async (
  platform: Platform,
  filter: MetricQuery,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.metric.get(filter);
    return;
  }
  const total = await trpc.metricDashboard.sumPoints
    .query(toMetricFilterInput(filter.where))
    .catch(() => null);
  if (total !== null) platform.metric.setSum(filter, total);
};

export const findMetricPoints = (
  platform: Platform,
  filter: MetricQuery,
): number =>
  isTrpcEnabled()
    ? platform.metric.findSum(filter) || 0
    : sumPoints(platform.metric.find(filter));

// Dashboard stats: the tokens tile is the server's `tokenSaleTotal` over tRPC; the rest stay on the legacy aggregations.
export const fetchDashboardStat = async (query: StatQuery): Promise<number> => {
  if (!isTrpcEnabled() || query.kind !== 'metricSum') {
    return fetchStatValue(query);
  }
  const { created } = query.where as MetricWhere;
  // Village-granted RBAC dashboard roles get FORBIDDEN here, so their tile reads 0.
  return trpc.metricDashboard.tokenSaleTotal
    .query({
      ...(created?.$gte && { createdAfter: iso(created.$gte) }),
      ...(created?.$lte && { createdBefore: iso(created.$lte) }),
    })
    .catch(() => 0);
};
