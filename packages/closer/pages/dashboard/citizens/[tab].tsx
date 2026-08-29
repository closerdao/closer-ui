import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import {
  CitizenFunnelApplicationRow,
  CitizenFunnelCitizenRow,
  CitizenFunnelRecommendedRow,
} from '../../../components/Dashboard/CitizenFunnel/CitizenFunnelRows';
import DashboardPageHeader from '../../../components/Dashboard/DashboardPageHeader';
import Pagination from '../../../components/Pagination';
import { Spinner } from '../../../components/ui';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import useRBAC from '../../../hooks/useRBAC';
import { CitizenshipConfig, GeneralConfig } from '../../../types';
import {
  CitizenFunnelTab,
  CitizenFunnelUserSignals,
  CitizenHealthFilter,
  CitizenRecommendedScore,
} from '../../../types/citizenFunnel';
import { FinanceApplication } from '../../../types/subscriptions';
import api, { formatSearch } from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { paidStatuses } from '../../../constants';
import {
  buildApplicationsWhere,
  buildCitizensWhere,
  buildRecommendedWhere,
  CITIZEN_FUNNEL_LIST_LIMIT,
  citizenFunnelTabPath,
  countVotesForUserInWindow,
  evaluateCitizenAtRisk,
  mapUserToFunnelSignals,
  resolveCitizenshipFunnelConfig,
  resolveCitizenFunnelTab,
  scoreCitizenRecommendation,
  sortRecommendedByScore,
} from '../../../utils/citizenFunnel.helpers';
import PageNotFound from '../../not-found';

const QUALIFYING_FINANCE_STATUSES: FinanceApplication['status'][] = [
  'paid',
  'up-to-date',
  'completed',
];

type EnrichedCitizenRow = {
  signals: CitizenFunnelUserSignals;
  evaluation: ReturnType<typeof evaluateCitizenAtRisk>;
};

type RecommendedRow = {
  signals: CitizenFunnelUserSignals;
  recommendation: CitizenRecommendedScore;
};

const toPlainUser = (row: any) => (row?.toJS ? row.toJS() : row);

const CitizensFunnelPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const { hasAccess } = useRBAC();

  const defaultConfig = useConfig();
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;
  const funnelConfig = useMemo(
    () => resolveCitizenshipFunnelConfig(citizenshipConfig),
    [citizenshipConfig],
  );

  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  const isCitizenshipEnabled =
    (defaultConfig?.citizenship?.enabled === true ||
      citizenshipConfig?.enabled === true) &&
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';

  const tab = resolveCitizenFunnelTab(router.query.tab);
  const [healthFilter, setHealthFilter] =
    useState<CitizenHealthFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationRows, setApplicationRows] = useState<
    CitizenFunnelUserSignals[]
  >([]);
  const [citizenRows, setCitizenRows] = useState<EnrichedCitizenRow[]>([]);
  const [recommendedRows, setRecommendedRows] = useState<RecommendedRow[]>([]);
  const [total, setTotal] = useState(0);

  const hasAccessToFunnel =
    hasAccess('CitizenFunnel') && isCitizenshipEnabled;

  const hubTabs: { id: CitizenFunnelTab; label: string }[] = [
    { id: 'applications', label: t('citizen_funnel_tab_applications') },
    { id: 'citizens', label: t('citizen_funnel_tab_citizens') },
    { id: 'recommended', label: t('citizen_funnel_tab_recommended') },
  ];

  const loadFinanceByUser = useCallback(async () => {
    if (!platform?.financeapplication?.get) {
      return {
        financedByUser: {} as Record<string, number>,
        delinquentUsers: new Set<string>(),
      };
    }
    try {
      const action = await platform.financeapplication.get(
        { limit: 500 },
        { force: true },
      );
      const rows = (action?.results?.toJS?.() ?? action?.results ?? []) as
        | FinanceApplication[]
        | any[];
      const list = Array.isArray(rows) ? rows : [];
      const financedByUser: Record<string, number> = {};
      const delinquentUsers = new Set<string>();
      list.forEach((app) => {
        const userId = String(app.userId || '');
        if (!userId) return;
        if (app.status === 'delinquent') {
          delinquentUsers.add(userId);
        }
        if (QUALIFYING_FINANCE_STATUSES.includes(app.status)) {
          financedByUser[userId] =
            (financedByUser[userId] || 0) + Number(app.tokensToFinance || 0);
        }
      });
      return { financedByUser, delinquentUsers };
    } catch {
      return {
        financedByUser: {} as Record<string, number>,
        delinquentUsers: new Set<string>(),
      };
    }
  }, [platform?.financeapplication]);

  const loadProposals = useCallback(async () => {
    try {
      const res = await api.get('/proposal', {
        params: { limit: 200 },
      });
      const rows = res?.data?.results;
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }, []);

  const fetchNightsInWindow = useCallback(
    async (userId: string, windowYears: number): Promise<number | null> => {
      const end = dayjs().toDate();
      const start = dayjs().subtract(windowYears, 'year').toDate();
      const where = {
        createdBy: userId,
        status: { $in: [...paidStatuses, 'confirmed'] },
        $and: [
          { start: { $lte: end.toISOString() } },
          { end: { $gte: start.toISOString() } },
        ],
      };
      try {
        const res = await api.get('/sum/booking/duration', {
          params: { where: formatSearch(where) },
        });
        const value = Number(res?.data?.results ?? res?.data?.sum);
        if (Number.isFinite(value)) return value;
        return null;
      } catch {
        try {
          const res = await api.get(`/stays/nights/${userId}`, {
            params: {
              from: dayjs(start).format('YYYY-MM-DD'),
              to: dayjs(end).format('YYYY-MM-DD'),
            },
            cache: false,
          } as any);
          const value = Number(
            res?.data?.results?.totalNights ?? res?.data?.totalNights,
          );
          if (Number.isFinite(value)) return value;
          return null;
        } catch {
          return null;
        }
      }
    },
    [],
  );

  const load = useCallback(async () => {
    if (!platform?.user?.get) return;
    setLoading(true);
    setError(null);
    try {
      if (tab === 'applications') {
        const where = buildApplicationsWhere();
        const [listAction, countAction, finance] = await Promise.all([
          platform.user.get(
            {
              where,
              limit: CITIZEN_FUNNEL_LIST_LIMIT,
              page,
              sort_by: '-citizenship.appliedAt',
            },
            { force: true },
          ),
          platform.user.getCount({ where }),
          loadFinanceByUser(),
        ]);
        const rows = (listAction?.results?.toJS?.() ??
          listAction?.results ??
          []) as any[];
        const list = Array.isArray(rows) ? rows.map(toPlainUser) : [];
        setApplicationRows(
          list.map((u) =>
            mapUserToFunnelSignals(u, {
              financedTokens: finance.financedByUser[String(u._id)] || 0,
              hasDelinquentFinancePlan: finance.delinquentUsers.has(
                String(u._id),
              ),
            }),
          ),
        );
        const count = Number(countAction?.results);
        setTotal(Number.isNaN(count) ? list.length : count);
        setCitizenRows([]);
        setRecommendedRows([]);
        return;
      }

      if (tab === 'citizens') {
        const where = buildCitizensWhere();
        const [listAction, countAction, finance, proposals] = await Promise.all(
          [
            platform.user.get(
              {
                where,
                limit: CITIZEN_FUNNEL_LIST_LIMIT,
                page,
                sort_by: '-lastactive',
              },
              { force: true },
            ),
            platform.user.getCount({ where }),
            loadFinanceByUser(),
            loadProposals(),
          ],
        );
        const rows = (listAction?.results?.toJS?.() ??
          listAction?.results ??
          []) as any[];
        const list = Array.isArray(rows) ? rows.map(toPlainUser) : [];

        const enriched: EnrichedCitizenRow[] = [];
        const chunkSize = 10;
        for (let i = 0; i < list.length; i += chunkSize) {
          const chunk = list.slice(i, i + chunkSize);
          const chunkRows = await Promise.all(
            chunk.map(async (u) => {
              const userId = String(u._id);
              const nightsInWindow = await fetchNightsInWindow(
                userId,
                funnelConfig.maintenanceNightsWindowYears,
              );
              const signals = mapUserToFunnelSignals(u, {
                financedTokens: finance.financedByUser[userId] || 0,
                hasDelinquentFinancePlan: finance.delinquentUsers.has(userId),
                nightsInMaintenanceWindow: nightsInWindow,
                votesInPrimaryWindow: countVotesForUserInWindow(
                  proposals,
                  userId,
                  funnelConfig.maintenanceVoteWindowYears,
                ),
                votesInAltWindow: countVotesForUserInWindow(
                  proposals,
                  userId,
                  funnelConfig.maintenanceAltVoteWindowYears,
                ),
              });
              return {
                signals,
                evaluation: evaluateCitizenAtRisk(signals, funnelConfig),
              };
            }),
          );
          enriched.push(...chunkRows);
        }
        setCitizenRows(enriched);
        const count = Number(countAction?.results);
        setTotal(Number.isNaN(count) ? list.length : count);
        setApplicationRows([]);
        setRecommendedRows([]);
        return;
      }

      const where = buildRecommendedWhere(
        funnelConfig.funnelRecommendedMinNights,
      );
      const [listAction, finance] = await Promise.all([
        platform.user.get(
          {
            where,
            limit: Math.max(
              funnelConfig.funnelRecommendedLimit,
              CITIZEN_FUNNEL_LIST_LIMIT,
            ),
            page: 1,
            sort_by: '-stats.all_time.presence',
          },
          { force: true },
        ),
        loadFinanceByUser(),
      ]);
      const rows = (listAction?.results?.toJS?.() ??
        listAction?.results ??
        []) as any[];
      const list = Array.isArray(rows) ? rows.map(toPlainUser) : [];
      const scored = sortRecommendedByScore(
        list.map((u) => {
          const signals = mapUserToFunnelSignals(u, {
            financedTokens: finance.financedByUser[String(u._id)] || 0,
          });
          const tokens = signals.tokenBalance + signals.financedTokens;
          const nights = signals.totalNights ?? 0;
          const recommendation = scoreCitizenRecommendation(
            nights,
            tokens,
            funnelConfig.minStayDuration,
            funnelConfig.tokensRequired,
          );
          return { signals, recommendation, ...recommendation };
        }),
      ).slice(0, funnelConfig.funnelRecommendedLimit);
      setRecommendedRows(
        scored.map(({ signals, recommendation }) => ({
          signals,
          recommendation,
        })),
      );
      setTotal(scored.length);
      setApplicationRows([]);
      setCitizenRows([]);
    } catch {
      setError(t('citizen_funnel_error_load'));
      setApplicationRows([]);
      setCitizenRows([]);
      setRecommendedRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    fetchNightsInWindow,
    funnelConfig,
    loadFinanceByUser,
    loadProposals,
    page,
    platform?.user,
    t,
    tab,
  ]);

  useEffect(() => {
    setPage(1);
    setHealthFilter('all');
  }, [tab]);

  useEffect(() => {
    if (hasAccessToFunnel) {
      load();
    }
  }, [hasAccessToFunnel, load]);

  const visibleCitizens = useMemo(() => {
    if (healthFilter === 'all') return citizenRows;
    if (healthFilter === 'at-risk') {
      return citizenRows.filter((row) => row.evaluation.isAtRisk);
    }
    return citizenRows.filter((row) => !row.evaluation.isAtRisk);
  }, [citizenRows, healthFilter]);

  if (!isCitizenshipEnabled) {
    return <PageNotFound />;
  }

  if (!user || !hasAccessToFunnel) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${t('citizen_funnel_title')} - ${platformName}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-6 max-w-4xl">
          <DashboardPageHeader
            title={t('citizen_funnel_title')}
            subtitle={t('citizen_funnel_subtitle')}
          />

          <div className="flex flex-wrap gap-2" role="tablist">
            {hubTabs.map((item) => {
              const active = tab === item.id;
              return (
                <Link
                  key={item.id}
                  href={citizenFunnelTabPath(item.id)}
                  role="tab"
                  aria-selected={active}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    active
                      ? 'bg-accent text-background'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {tab === 'citizens' && (
            <div className="flex gap-1 p-1 bg-gray-100 rounded-full w-fit">
              {(
                [
                  ['all', 'citizen_funnel_filter_all'],
                  ['at-risk', 'citizen_funnel_filter_at_risk'],
                  ['healthy', 'citizen_funnel_filter_healthy'],
                ] as const
              ).map(([id, labelKey]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={healthFilter === id}
                  onClick={() => setHealthFilter(id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    healthFilter === id
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : tab === 'applications' ? (
            applicationRows.length === 0 ? (
              <p className="text-sm text-gray-600">
                {t('citizen_funnel_empty_applications')}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {applicationRows.map((signals) => (
                  <CitizenFunnelApplicationRow
                    key={signals.userId}
                    signals={signals}
                    nightsRequired={funnelConfig.minStayDuration}
                    tokensRequired={funnelConfig.tokensRequired}
                  />
                ))}
              </div>
            )
          ) : tab === 'citizens' ? (
            visibleCitizens.length === 0 ? (
              <p className="text-sm text-gray-600">
                {t('citizen_funnel_empty_citizens')}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {visibleCitizens.map(({ signals, evaluation }) => (
                  <CitizenFunnelCitizenRow
                    key={signals.userId}
                    signals={signals}
                    evaluation={evaluation}
                    tokensRequired={funnelConfig.tokensRequired}
                    maintenanceMinNights={funnelConfig.maintenanceMinNights}
                  />
                ))}
              </div>
            )
          ) : recommendedRows.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('citizen_funnel_empty_recommended')}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {recommendedRows.map(({ signals, recommendation }) => (
                <CitizenFunnelRecommendedRow
                  key={signals.userId}
                  signals={signals}
                  recommendation={recommendation}
                />
              ))}
            </div>
          )}

          {tab !== 'recommended' && total > CITIZEN_FUNNEL_LIST_LIMIT && (
            <Pagination
              loadPage={(nextPage: number) => setPage(nextPage)}
              page={page}
              limit={CITIZEN_FUNNEL_LIST_LIMIT}
              total={total}
            />
          )}
        </div>
      </AdminLayout>
    </>
  );
};

export default CitizensFunnelPage;
