import { paidStatuses } from '../constants';
import type { DashboardFeatures } from '../components/Dashboard/dashboardFeatures';
import api from './api';

/**
 * Dashboard headline stats.
 *
 * These used to be derived in the browser from `platform.user.get()` /
 * `platform.booking.get()` list fetches capped at MAX_USERS_TO_FETCH (2000) and
 * MAX_BOOKINGS_TO_FETCH (3000) — so on any platform past those thresholds the
 * numbers were silently truncated. Every stat here is instead resolved by the
 * API's `/count/:model` and `/sum/:model/:field` aggregation endpoints: exact,
 * and a scalar over the wire instead of thousands of documents.
 */

export interface StatRange {
  start: Date;
  end: Date;
  isAllTime: boolean;
}

export type StatQuery =
  | { kind: 'count'; model: string; where: Record<string, unknown> }
  | {
      kind: 'sum';
      model: string;
      field: string;
      where: Record<string, unknown>;
    }
  /**
   * `metric.value` is typed as a String in the API, so Mongo's `$sum` scores it
   * as 0 and `/sum/metric/value` can't be used. Until the aggregation coerces
   * with `$toDouble`, these are summed here over a bounded list fetch.
   */
  | { kind: 'metricSum'; where: Record<string, unknown>; limit: number };

/**
 * `flow` stats answer "how much happened in the selected period" and carry a
 * comparison against the preceding period. `stock` stats answer "how many are
 * there right now" and ignore the period entirely — comparing them period over
 * period would be meaningless.
 */
export type StatMode = 'flow' | 'stock';

export interface DashboardStatSpec {
  id: string;
  labelKey: string;
  mode: StatMode;
  buildQuery: (range: StatRange) => StatQuery;
}

/** Confirmed but unpaid stays still occupy a bed — volunteers, team, comps. */
const attendingStatuses = [...paidStatuses, 'confirmed'];

/** Upper bound on the token-sale metrics fetched for client-side summing. */
const MAX_METRICS_TO_SUM = 5000;

const isoRange = (range: StatRange) => ({
  $gte: range.start.toISOString(),
  $lte: range.end.toISOString(),
});

/** Documents created inside the period (or everything, for all-time). */
const createdIn = (range: StatRange): Record<string, unknown> =>
  range.isAllTime ? {} : { created: isoRange(range) };

/**
 * Bookings that overlap the period at all, not just those starting in it — a
 * stay running across the period boundary still occupies the space.
 */
const bookingsOverlapping = (
  range: StatRange,
  where: Record<string, unknown> = {},
  statuses: string[] = paidStatuses,
): Record<string, unknown> => {
  const base = {
    status: { $in: statuses },
    ...where,
  };
  if (range.isAllTime) return base;
  return {
    ...base,
    $and: [
      { start: { $lte: range.end.toISOString() } },
      { end: { $gte: range.start.toISOString() } },
    ],
  };
};

export const getDashboardStatSpecs = (
  features: DashboardFeatures,
  options: { subscriptionPlanSlugs?: string[] } = {},
): DashboardStatSpec[] => {
  const { subscriptionPlanSlugs = [] } = options;

  const specs: DashboardStatSpec[] = [
    {
      id: 'accounts',
      labelKey: 'dashboard_intro_accounts_created',
      mode: 'flow',
      buildQuery: (range) => ({
        kind: 'count',
        model: 'user',
        where: createdIn(range),
      }),
    },
  ];

  if (features.isWeb3Enabled) {
    specs.push({
      id: 'wallets',
      labelKey: 'dashboard_intro_wallets_connected',
      mode: 'flow',
      buildQuery: (range) => ({
        kind: 'count',
        model: 'user',
        where: range.isAllTime
          ? { 'actions.wallet-connected': { $exists: true } }
          : { 'actions.wallet-connected': isoRange(range) },
      }),
    });
  }

  if (features.isBookingEnabled) {
    specs.push(
      {
        id: 'bookings',
        labelKey: 'dashboard_intro_bookings_made',
        mode: 'flow',
        buildQuery: (range) => ({
          kind: 'count',
          model: 'booking',
          where: bookingsOverlapping(range),
        }),
      },
      {
        id: 'nights',
        labelKey: 'dashboard_intro_nights_spent',
        mode: 'flow',
        buildQuery: (range) => ({
          kind: 'sum',
          model: 'booking',
          field: 'duration',
          where: bookingsOverlapping(range),
        }),
      },
      {
        id: 'guests',
        labelKey: 'dashboard_stats_guests',
        mode: 'flow',
        buildQuery: (range) => ({
          kind: 'sum',
          model: 'booking',
          field: 'adults',
          where: bookingsOverlapping(range),
        }),
      },
    );
  }

  if (features.isEventsEnabled) {
    specs.push({
      id: 'eventGuests',
      labelKey: 'dashboard_intro_event_participants',
      mode: 'flow',
      buildQuery: (range) => ({
        kind: 'sum',
        model: 'booking',
        field: 'adults',
        where: bookingsOverlapping(range, { eventId: { $exists: true } }),
      }),
    });
  }

  if (features.isVolunteeringEnabled) {
    specs.push({
      id: 'volunteers',
      labelKey: 'dashboard_stats_volunteers',
      mode: 'flow',
      buildQuery: (range) => ({
        kind: 'sum',
        model: 'booking',
        field: 'adults',
        // Volunteers don't pay, so their stays never reach a paid status —
        // counting them the way guests are counted returns a flat zero.
        where: bookingsOverlapping(
          range,
          { volunteerId: { $exists: true } },
          attendingStatuses,
        ),
      }),
    });
  }

  if (features.isTokenSaleEnabled) {
    specs.push({
      id: 'tokens',
      labelKey: 'dashboard_intro_tokens_sold',
      mode: 'flow',
      buildQuery: (range) => ({
        kind: 'metricSum',
        where: { event: 'token-sale', ...createdIn(range) },
        limit: MAX_METRICS_TO_SUM,
      }),
    });
  }

  if (features.isSubscriptionsEnabled && subscriptionPlanSlugs.length > 0) {
    specs.push({
      id: 'subscribers',
      labelKey: 'dashboard_stats_subscribers',
      mode: 'stock',
      buildQuery: () => ({
        kind: 'count',
        model: 'user',
        where: { 'subscription.plan': { $in: subscriptionPlanSlugs } },
      }),
    });
  }

  if (features.isCitizenshipEnabled) {
    specs.push({
      id: 'citizens',
      labelKey: 'dashboard_stats_citizens',
      mode: 'stock',
      buildQuery: () => ({
        kind: 'count',
        model: 'user',
        where: { roles: { $in: ['member', 'citizen'] } },
      }),
    });
  }

  return specs;
};

/**
 * The API answers both `/count` and `/sum` as `{ results: <number> }`. Older
 * shapes are tolerated so a mismatched API version degrades to 0 rather than
 * rendering NaN.
 */
export const parseStatResponse = (data: unknown): number => {
  if (!data || typeof data !== 'object') return 0;
  const payload = data as {
    results?: unknown;
    count?: unknown;
    sum?: unknown;
  };
  for (const candidate of [payload.results, payload.count, payload.sum]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (Array.isArray(candidate)) return candidate.length;
  }
  return 0;
};

export const statQueryToPath = (query: StatQuery): string => {
  switch (query.kind) {
    case 'count':
      return `/count/${query.model}`;
    case 'sum':
      return `/sum/${query.model}/${query.field}`;
    case 'metricSum':
      return '/metric';
  }
};

/** Sums the string-valued `value` field of a metric list response. */
export const sumMetricValues = (data: unknown): number => {
  const results = (data as { results?: unknown })?.results;
  if (!Array.isArray(results)) return 0;
  return results.reduce((total: number, row: any) => {
    const value = Number(row?.value);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
};

export const fetchStatValue = async (query: StatQuery): Promise<number> => {
  try {
    const res = await api.get(statQueryToPath(query), {
      params:
        query.kind === 'metricSum'
          ? { where: query.where, limit: query.limit }
          : { where: query.where },
    });
    return query.kind === 'metricSum'
      ? sumMetricValues(res?.data)
      : parseStatResponse(res?.data);
  } catch (err) {
    return 0;
  }
};

/**
 * The period immediately before this one, of equal length, for the delta shown
 * on flow stats. All-time has nothing to compare against.
 */
export const getPreviousRange = (range: StatRange): StatRange | null => {
  if (range.isAllTime) return null;
  const span = range.end.getTime() - range.start.getTime();
  if (!Number.isFinite(span) || span <= 0) return null;
  return {
    start: new Date(range.start.getTime() - span),
    end: new Date(range.start.getTime()),
    isAllTime: false,
  };
};

export interface StatDelta {
  /** Fractional change, e.g. 0.25 for +25%. Null when there is no baseline. */
  ratio: number | null;
  direction: 'up' | 'down' | 'flat';
}

export const getStatDelta = (
  current: number,
  previous: number | undefined,
): StatDelta => {
  if (previous === undefined || !Number.isFinite(previous)) {
    return { ratio: null, direction: 'flat' };
  }
  if (previous === 0) {
    // Going 0 → something is real growth, but the percentage is undefined.
    return {
      ratio: null,
      direction: current > 0 ? 'up' : 'flat',
    };
  }
  const ratio = (current - previous) / previous;
  return {
    ratio,
    direction: ratio > 0.0001 ? 'up' : ratio < -0.0001 ? 'down' : 'flat',
  };
};

export const formatStatValue = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString('en-US')
    : rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const formatStatDelta = (delta: StatDelta): string | null => {
  if (delta.ratio === null) return null;
  const percent = Math.round(delta.ratio * 100);
  if (percent === 0) return '0%';
  return `${percent > 0 ? '+' : ''}${percent}%`;
};
