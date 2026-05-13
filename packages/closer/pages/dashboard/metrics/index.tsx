import Head from 'next/head';

import { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import MetricsDashboardDailyChart from '../../../components/Dashboard/MetricsDashboardDailyChart';
import { Button, Heading, Input, Spinner } from '../../../components/ui';

import { userRolesCanAccessMetricsDashboard } from 'closer/constants/metricsDashboardAccess';
import { METRICS_DASHBOARD_CATEGORIES } from 'closer/constants/metricsDashboardCategories';
import type {
  MetricsByCategoryRow,
  MetricsDailyTrendRow,
  MetricsKpiRow,
  MetricsNavigationTopRow,
  MetricsTokenSaleRow,
} from 'closer/types/metricsDashboard';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { useConfig } from '../../../hooks/useConfig';
import api from '../../../utils/api';
import { toEndOfDay, toStartOfDay } from '../../../utils/dashboard.helpers';
import {
  normalizeBookingFunnel,
  normalizeCitizenshipLikeFunnel,
  normalizeFundraiserFunnel,
  normalizeSignupFunnel,
  normalizeSubscriptionsFunnel,
  normalizeTokenFunnel,
  readMetricsApiMessage,
} from '../../../utils/metricsDashboard.helpers';

type DatePreset = 'last7' | 'last30' | 'last90' | 'thisMonth' | 'custom';

type KpiSortKey = 'category' | 'event' | 'events' | 'sumPoint';
type SortDir = 'asc' | 'desc';

function rangeForPreset(
  preset: DatePreset,
  fromDate: string,
  toDate: string,
  timeZone: string,
): { start: Date; end: Date } {
  const end = toEndOfDay(new Date(), timeZone);
  if (preset === 'custom') {
    if (fromDate && toDate) {
      return {
        start: toStartOfDay(fromDate, timeZone),
        end: toEndOfDay(toDate, timeZone),
      };
    }
    return {
      start: toStartOfDay(dayjs().subtract(29, 'day').toDate(), timeZone),
      end,
    };
  }
  if (preset === 'last7') {
    return {
      start: toStartOfDay(dayjs().subtract(6, 'day').toDate(), timeZone),
      end,
    };
  }
  if (preset === 'last30') {
    return {
      start: toStartOfDay(dayjs().subtract(29, 'day').toDate(), timeZone),
      end,
    };
  }
  if (preset === 'last90') {
    return {
      start: toStartOfDay(dayjs().subtract(89, 'day').toDate(), timeZone),
      end,
    };
  }
  if (preset === 'thisMonth') {
    return {
      start: toStartOfDay(dayjs().startOf('month').toDate(), timeZone),
      end,
    };
  }
  return {
    start: toStartOfDay(dayjs().subtract(29, 'day').toDate(), timeZone),
    end,
  };
}

function categoriesQueryParam(
  selected: Set<string>,
): string | undefined {
  const all = METRICS_DASHBOARD_CATEGORIES.length;
  if (selected.size === 0 || selected.size === all) return undefined;
  return [...selected].sort().join(',');
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function kpiToCsv(rows: MetricsKpiRow[]): string {
  const header = ['category', 'event', 'events', 'sumPoint', 'valueVariants'];
  const lines = rows.map((r) =>
    [
      r.category,
      r.event,
      String(r.events),
      String(r.sumPoint),
      (r.valueVariants ?? []).join('|'),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

const MetricsDashboardPage = () => {
  const t = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess } = useRBAC();
  const { TIME_ZONE } = useConfig();

  const [preset, setPreset] = useState<DatePreset>('last30');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set([...METRICS_DASHBOARD_CATEGORIES]),
  );
  const [navLimit, setNavLimit] = useState(50);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiUnauthorized, setApiUnauthorized] = useState(false);
  const [loading, setLoading] = useState(false);

  const [kpi, setKpi] = useState<MetricsKpiRow[]>([]);
  const [byCategory, setByCategory] = useState<MetricsByCategoryRow[]>([]);
  const [dailyTrends, setDailyTrends] = useState<MetricsDailyTrendRow[]>([]);
  const [tokenFunnel, setTokenFunnel] = useState(
    normalizeTokenFunnel(undefined),
  );
  const [bookingFunnel, setBookingFunnel] = useState(
    normalizeBookingFunnel(undefined),
  );
  const [subscriptionsFunnel, setSubscriptionsFunnel] = useState(
    normalizeSubscriptionsFunnel(undefined),
  );
  const [citizenshipFunnel, setCitizenshipFunnel] = useState(
    normalizeCitizenshipLikeFunnel(undefined),
  );
  const [coHousingFunnel, setCoHousingFunnel] = useState(
    normalizeCitizenshipLikeFunnel(undefined),
  );
  const [signupFunnel, setSignupFunnel] = useState(
    normalizeSignupFunnel(undefined),
  );
  const [fundraiserFunnel, setFundraiserFunnel] = useState(
    normalizeFundraiserFunnel(undefined),
  );
  const [navigationTop, setNavigationTop] = useState<MetricsNavigationTopRow[]>(
    [],
  );
  const [tokenSales, setTokenSales] = useState<MetricsTokenSaleRow[]>([]);

  const [kpiSortKey, setKpiSortKey] = useState<KpiSortKey>('events');
  const [kpiSortDir, setKpiSortDir] = useState<SortDir>('desc');

  const { startIso, endIso } = useMemo(() => {
    const { start, end } = rangeForPreset(preset, fromDate, toDate, TIME_ZONE);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }, [TIME_ZONE, preset, fromDate, toDate]);

  const catParam = useMemo(
    () => categoriesQueryParam(selectedCategories),
    [selectedCategories],
  );

  const clampedNavLimit = useMemo(() => {
    const n = Math.floor(Number(navLimit));
    if (!Number.isFinite(n)) return 50;
    return Math.min(200, Math.max(1, n));
  }, [navLimit]);

  const load = useCallback(async () => {
    setLoadError(null);
    setApiUnauthorized(false);
    setLoading(true);
    const base = {
      start: startIso,
      end: endIso,
      ...(catParam ? { categories: catParam } : {}),
    };
    const navParams = {
      start: startIso,
      end: endIso,
      limit: clampedNavLimit,
    };
    const settled = await Promise.allSettled([
      api.get('/metrics/dashboard/kpi', { params: base }),
      api.get('/metrics/dashboard/by-category', { params: base }),
      api.get('/metrics/dashboard/daily-trends', { params: base }),
      api.get('/metrics/dashboard/token-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/booking-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/subscriptions-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/citizenship-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/co-housing-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/signup-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/fundraiser-funnel', {
        params: { start: startIso, end: endIso },
      }),
      api.get('/metrics/dashboard/navigation-top', { params: navParams }),
      api.get('/metrics/token-sales'),
    ]);

    let firstErr: string | null = null;
    let saw401 = false;

    const handleRejected = (reason: unknown) => {
      if (isAxiosError(reason) && reason.response?.status === 401) {
        saw401 = true;
        return;
      }
      if (!firstErr) {
        firstErr =
          readMetricsApiMessage(reason) ?? t('metrics_dashboard_load_error');
      }
    };

    const kpiRes = settled[0];
    if (kpiRes.status === 'fulfilled') {
      const d = kpiRes.value.data;
      setKpi(Array.isArray(d?.results) ? d.results : []);
    } else {
      handleRejected(kpiRes.reason);
      setKpi([]);
    }

    const byCatRes = settled[1];
    if (byCatRes.status === 'fulfilled') {
      const d = byCatRes.value.data;
      setByCategory(Array.isArray(d?.results) ? d.results : []);
    } else {
      handleRejected(byCatRes.reason);
      setByCategory([]);
    }

    const dailyRes = settled[2];
    if (dailyRes.status === 'fulfilled') {
      const d = dailyRes.value.data;
      setDailyTrends(Array.isArray(d?.results) ? d.results : []);
    } else {
      handleRejected(dailyRes.reason);
      setDailyTrends([]);
    }

    const tfRes = settled[3];
    if (tfRes.status === 'fulfilled') {
      setTokenFunnel(normalizeTokenFunnel(tfRes.value.data?.results));
    } else {
      handleRejected(tfRes.reason);
      setTokenFunnel(normalizeTokenFunnel(undefined));
    }

    const bfRes = settled[4];
    if (bfRes.status === 'fulfilled') {
      setBookingFunnel(normalizeBookingFunnel(bfRes.value.data?.results));
    } else {
      handleRejected(bfRes.reason);
      setBookingFunnel(normalizeBookingFunnel(undefined));
    }

    const sfRes = settled[5];
    if (sfRes.status === 'fulfilled') {
      setSubscriptionsFunnel(
        normalizeSubscriptionsFunnel(sfRes.value.data?.results),
      );
    } else {
      handleRejected(sfRes.reason);
      setSubscriptionsFunnel(normalizeSubscriptionsFunnel(undefined));
    }

    const cfRes = settled[6];
    if (cfRes.status === 'fulfilled') {
      setCitizenshipFunnel(
        normalizeCitizenshipLikeFunnel(cfRes.value.data?.results),
      );
    } else {
      handleRejected(cfRes.reason);
      setCitizenshipFunnel(normalizeCitizenshipLikeFunnel(undefined));
    }

    const chfRes = settled[7];
    if (chfRes.status === 'fulfilled') {
      setCoHousingFunnel(
        normalizeCitizenshipLikeFunnel(chfRes.value.data?.results),
      );
    } else {
      handleRejected(chfRes.reason);
      setCoHousingFunnel(normalizeCitizenshipLikeFunnel(undefined));
    }

    const sufRes = settled[8];
    if (sufRes.status === 'fulfilled') {
      setSignupFunnel(normalizeSignupFunnel(sufRes.value.data?.results));
    } else {
      handleRejected(sufRes.reason);
      setSignupFunnel(normalizeSignupFunnel(undefined));
    }

    const ffRes = settled[9];
    if (ffRes.status === 'fulfilled') {
      setFundraiserFunnel(normalizeFundraiserFunnel(ffRes.value.data?.results));
    } else {
      handleRejected(ffRes.reason);
      setFundraiserFunnel(normalizeFundraiserFunnel(undefined));
    }

    const navRes = settled[10];
    if (navRes.status === 'fulfilled') {
      const d = navRes.value.data;
      setNavigationTop(Array.isArray(d?.results) ? d.results : []);
    } else {
      handleRejected(navRes.reason);
      setNavigationTop([]);
    }

    const tsRes = settled[11];
    if (tsRes.status === 'fulfilled') {
      const res = tsRes.value;
      const tsStatus = res.status;
      const tsBody = res.data;
      if (tsStatus === 200 && Array.isArray(tsBody?.results)) {
        setTokenSales(tsBody.results as MetricsTokenSaleRow[]);
      } else if (tsBody && typeof tsBody === 'object' && 'error' in tsBody) {
        const msg = (tsBody as { error?: unknown }).error;
        if (typeof msg === 'string' && !firstErr) {
          firstErr = msg;
        }
        setTokenSales([]);
      } else {
        setTokenSales([]);
      }
    } else {
      handleRejected(tsRes.reason);
      setTokenSales([]);
    }

    if (saw401) {
      setKpi([]);
      setByCategory([]);
      setDailyTrends([]);
      setTokenFunnel(normalizeTokenFunnel(undefined));
      setBookingFunnel(normalizeBookingFunnel(undefined));
      setSubscriptionsFunnel(normalizeSubscriptionsFunnel(undefined));
      setCitizenshipFunnel(normalizeCitizenshipLikeFunnel(undefined));
      setCoHousingFunnel(normalizeCitizenshipLikeFunnel(undefined));
      setSignupFunnel(normalizeSignupFunnel(undefined));
      setFundraiserFunnel(normalizeFundraiserFunnel(undefined));
      setNavigationTop([]);
      setTokenSales([]);
      setApiUnauthorized(true);
      setLoadError(null);
    } else if (firstErr) {
      setLoadError(firstErr);
    }

    setLoading(false);
  }, [startIso, endIso, catParam, clampedNavLimit, t]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !userRolesCanAccessMetricsDashboard(user.roles) ||
      !hasAccess('MetricsDashboard')
    ) {
      return;
    }
    load();
  }, [authLoading, user, hasAccess, load]);

  const sortedKpi = useMemo(() => {
    const rows = [...kpi];
    const mul = kpiSortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (kpiSortKey === 'events' || kpiSortKey === 'sumPoint') {
        return (a[kpiSortKey] - b[kpiSortKey]) * mul;
      }
      return String(a[kpiSortKey]).localeCompare(String(b[kpiSortKey])) * mul;
    });
    return rows;
  }, [kpi, kpiSortDir, kpiSortKey]);

  const toggleKpiSort = (key: KpiSortKey) => {
    if (kpiSortKey === key) {
      setKpiSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setKpiSortKey(key);
      setKpiSortDir(key === 'category' || key === 'event' ? 'asc' : 'desc');
    }
  };

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories(new Set([...METRICS_DASHBOARD_CATEGORIES]));
  };

  const roles = user?.roles ?? [];
  const roleOk = userRolesCanAccessMetricsDashboard(roles);
  const rbacOk = hasAccess('MetricsDashboard');

  if (authLoading) {
    return (
      <>
        <Head>
          <title>{t('metrics_dashboard_title')}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <AdminLayout>
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        </AdminLayout>
      </>
    );
  }

  if (!user || !roleOk || !rbacOk) {
    return <PageNotAllowed />;
  }

  if (apiUnauthorized) {
    return (
      <PageNotAllowed error={t('metrics_dashboard_unauthorized')} />
    );
  }

  const funnelBlock = (title: string, data: Record<string, number>) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-2">
      <Heading level={4}>{title}</Heading>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <span className="text-gray-500 break-all">{k}</span>
            <span className="font-semibold text-gray-900">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>{t('metrics_dashboard_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Heading level={2}>{t('metrics_dashboard_title')}</Heading>
              <p className="text-sm text-gray-600 max-w-2xl">
                {t('metrics_dashboard_description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={() => {
                  setPreset('last7');
                  setFromDate('');
                  setToDate('');
                }}
                className={preset === 'last7' ? '!bg-accent !text-white !border-accent' : ''}
              >
                {t('metrics_dashboard_preset_last7')}
              </Button>
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={() => {
                  setPreset('last30');
                  setFromDate('');
                  setToDate('');
                }}
                className={preset === 'last30' ? '!bg-accent !text-white !border-accent' : ''}
              >
                {t('metrics_dashboard_preset_last30')}
              </Button>
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={() => {
                  setPreset('last90');
                  setFromDate('');
                  setToDate('');
                }}
                className={preset === 'last90' ? '!bg-accent !text-white !border-accent' : ''}
              >
                {t('metrics_dashboard_preset_last90')}
              </Button>
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={() => {
                  setPreset('thisMonth');
                  setFromDate('');
                  setToDate('');
                }}
                className={preset === 'thisMonth' ? '!bg-accent !text-white !border-accent' : ''}
              >
                {t('metrics_dashboard_preset_this_month')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:flex-wrap gap-4 md:items-end">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('metrics_dashboard_date_from')}
              </span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPreset('custom');
                }}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('metrics_dashboard_date_to')}
              </span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPreset('custom');
                }}
              />
            </div>
            <div className="flex flex-col gap-1 w-full max-w-[120px]">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('metrics_dashboard_nav_limit')}
              </span>
              <Input
                type="number"
                min={1}
                max={200}
                value={String(navLimit)}
                onChange={(e) => setNavLimit(Number(e.target.value))}
              />
            </div>
            <Button
              onClick={() => load()}
              isLoading={loading}
              isFullWidth={false}
              variant="primary"
              size="small"
            >
              {t('metrics_dashboard_refresh')}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Heading level={4}>{t('metrics_dashboard_categories_heading')}</Heading>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={selectAllCategories}
              >
                {t('metrics_dashboard_categories_all')}
              </Button>
              {METRICS_DASHBOARD_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedCategories.has(c)
                      ? 'bg-accent text-white border-accent'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loadError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {loadError}
            </div>
          )}

          <section className="flex flex-col gap-3">
            <Heading level={3}>{t('metrics_dashboard_section_summary')}</Heading>
            {byCategory.length === 0 && !loading ? (
              <p className="text-sm text-gray-500">{t('metrics_dashboard_empty')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {byCategory.map((row) => (
                  <div
                    key={row.category}
                    className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-1"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {row.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('metrics_dashboard_rows')}: {row.rows}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('metrics_dashboard_sum_point')}: {row.sumPoint}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('metrics_dashboard_event_count')}: {row.eventCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <Heading level={3}>{t('metrics_dashboard_section_daily')}</Heading>
            {dailyTrends.length === 0 && !loading ? (
              <p className="text-sm text-gray-500">{t('metrics_dashboard_empty')}</p>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <MetricsDashboardDailyChart rows={dailyTrends} />
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <Heading level={3}>{t('metrics_dashboard_section_funnels')}</Heading>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {funnelBlock('Token', tokenFunnel as unknown as Record<string, number>)}
              {funnelBlock('Booking', bookingFunnel as unknown as Record<string, number>)}
              {funnelBlock(
                'Subscriptions',
                subscriptionsFunnel as unknown as Record<string, number>,
              )}
              {funnelBlock('Citizenship', citizenshipFunnel as unknown as Record<string, number>)}
              {funnelBlock('Co-housing', coHousingFunnel as unknown as Record<string, number>)}
              {funnelBlock('Signup', signupFunnel as unknown as Record<string, number>)}
              {funnelBlock('Fundraiser', fundraiserFunnel as unknown as Record<string, number>)}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <Heading level={3}>{t('metrics_dashboard_section_navigation')}</Heading>
            {navigationTop.length === 0 && !loading ? (
              <p className="text-sm text-gray-500">{t('metrics_dashboard_empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        {t('metrics_dashboard_path')}
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        {t('metrics_dashboard_views')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {navigationTop.map((row, i) => (
                      <tr key={`${row.path}-${i}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 break-all text-gray-900">{row.path}</td>
                        <td className="px-3 py-2 text-gray-900">{row.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Heading level={3}>{t('metrics_dashboard_section_kpi')}</Heading>
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={() =>
                  downloadTextFile('metrics-kpi.csv', kpiToCsv(sortedKpi))
                }
              >
                {t('metrics_dashboard_export_csv')}
              </Button>
            </div>
            {sortedKpi.length === 0 && !loading ? (
              <p className="text-sm text-gray-500">{t('metrics_dashboard_empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">
                        <button
                          type="button"
                          className="font-medium text-gray-700 hover:underline"
                          onClick={() => toggleKpiSort('category')}
                        >
                          {t('metrics_dashboard_kpi_col_category')}
                        </button>
                      </th>
                      <th className="px-3 py-2">
                        <button
                          type="button"
                          className="font-medium text-gray-700 hover:underline"
                          onClick={() => toggleKpiSort('event')}
                        >
                          {t('metrics_dashboard_kpi_col_event')}
                        </button>
                      </th>
                      <th className="px-3 py-2">
                        <button
                          type="button"
                          className="font-medium text-gray-700 hover:underline"
                          onClick={() => toggleKpiSort('events')}
                        >
                          {t('metrics_dashboard_kpi_col_events')}
                        </button>
                      </th>
                      <th className="px-3 py-2">
                        <button
                          type="button"
                          className="font-medium text-gray-700 hover:underline"
                          onClick={() => toggleKpiSort('sumPoint')}
                        >
                          {t('metrics_dashboard_kpi_col_sum_point')}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        {t('metrics_dashboard_kpi_col_values')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKpi.map((row, idx) => (
                      <tr
                        key={`${row.category}-${row.event}-${idx}`}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-900">{row.category}</td>
                        <td className="px-3 py-2 break-all text-gray-900">{row.event}</td>
                        <td className="px-3 py-2 text-gray-900">{row.events}</td>
                        <td className="px-3 py-2 text-gray-900">{row.sumPoint}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs max-w-xs">
                          {(row.valueVariants ?? []).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <Heading level={3}>{t('metrics_dashboard_section_token_sales')}</Heading>
            {tokenSales.length === 0 && !loading ? (
              <p className="text-sm text-gray-500">{t('metrics_dashboard_empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white max-h-[480px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        {t('metrics_dashboard_value')}
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-700">
                        {t('metrics_dashboard_created')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokenSales.map((row, idx) => (
                      <tr key={`${row.created}-${idx}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 break-all text-gray-900">
                          {row.value ?? ''}
                        </td>
                        <td className="px-3 py-2 text-gray-900">{row.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </AdminLayout>
    </>
  );
};

export default MetricsDashboardPage;
