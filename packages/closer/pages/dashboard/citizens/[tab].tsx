import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import {
  CitizenFunnelApplicationRow,
  CitizenFunnelCitizenRow,
  CitizenFunnelConfigPanel,
  CitizenFunnelRecommendedRow,
  CitizenFunnelStrip,
} from '../../../components/Dashboard/CitizenFunnel/CitizenFunnelRows';
import Pagination from '../../../components/Pagination';
import { Spinner } from '../../../components/ui';

import { MAX_USERS_TO_FETCH, paidStatuses } from '../../../constants';
import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import useRBAC from '../../../hooks/useRBAC';
import { CitizenshipConfig, GeneralConfig } from '../../../types';
import {
  CitizenApplicationStage,
  CitizenFunnelTab,
  CitizenFunnelUserSignals,
  CitizenHealthFilter,
  CitizenRecommendedScore,
  CITIZEN_APPLICATION_STAGES,
} from '../../../types/citizenFunnel';
import { FinanceApplication } from '../../../types/subscriptions';
import api, { formatSearch } from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import {
  buildApplicationsWhere,
  buildCitizensWhere,
  buildRecommendedWhere,
  CITIZEN_FUNNEL_LIST_LIMIT,
  citizenFunnelTabPath,
  computeMinVouches,
  countStages,
  countVotesForUserInWindow,
  deriveApplicationStage,
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

  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  const isCitizenshipEnabled =
    (defaultConfig?.citizenship?.enabled === true ||
      citizenshipConfig?.enabled === true) &&
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';

  const tab = resolveCitizenFunnelTab(router.query.tab);
  const [stageFilter, setStageFilter] =
    useState<CitizenApplicationStage | null>(null);
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
  const [citizenTotal, setCitizenTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const baseFunnelConfig = useMemo(
    () => resolveCitizenshipFunnelConfig(citizenshipConfig),
    [citizenshipConfig],
  );
  const funnelConfig = useMemo(
    () => ({
      ...baseFunnelConfig,
      minVouches: computeMinVouches(citizenTotal),
    }),
    [baseFunnelConfig, citizenTotal],
  );
  const loadGenerationRef = useRef(0);
  const [prevTab, setPrevTab] = useState(tab);
  if (tab !== prevTab) {
    setPrevTab(tab);
    setPage(1);
    setHealthFilter('all');
    if (tab !== 'applications') setStageFilter(null);
  }
  const applicationPage = tab === 'applications' ? page : 1;

  const hasAccessToFunnel =
    hasAccess('CitizenFunnel') && isCitizenshipEnabled;
  const isAdmin = Boolean(user?.roles?.includes('admin'));

  const hubTabs: { id: CitizenFunnelTab; label: string; dot?: number }[] = [
    { id: 'applications', label: t('citizen_funnel_tab_applications') },
    {
      id: 'citizens',
      label: t('citizen_funnel_tab_citizens'),
      dot: citizenRows.filter((r) => r.evaluation.isAtRisk).length,
    },
    { id: 'recommended', label: t('citizen_funnel_tab_recommended') },
    { id: 'config', label: t('citizen_funnel_tab_config') },
  ];

  const stageCounts = useMemo(
    () => countStages(applicationRows, funnelConfig),
    [applicationRows, funnelConfig],
  );

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
        if (app.status === 'delinquent') delinquentUsers.add(userId);
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
      const res = await api.get('/proposal', { params: { limit: 200 } });
      const rows = res?.data?.results;
      return Array.isArray(rows) ? rows : null;
    } catch {
      return null;
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
    const generation = ++loadGenerationRef.current;
    if (tab === 'config') {
      try {
        const citizenCountAction = await platform.user.getCount({
          where: buildCitizensWhere(),
        });
        if (generation !== loadGenerationRef.current) return;
        const cCount = Number(citizenCountAction?.results);
        setCitizenTotal(Number.isNaN(cCount) ? 0 : cCount);
      } catch {
        if (generation !== loadGenerationRef.current) return;
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (tab === 'applications') {
        const where = buildApplicationsWhere();
        const [listAction, countAction, finance, citizenCountAction] =
          await Promise.all([
            platform.user.get(
              {
                where,
                limit: CITIZEN_FUNNEL_LIST_LIMIT,
                page: applicationPage,
                sort_by: '-citizenship.appliedAt',
              },
              { force: true },
            ),
            platform.user.getCount({ where }),
            loadFinanceByUser(),
            platform.user.getCount({ where: buildCitizensWhere() }),
          ]);
        if (generation !== loadGenerationRef.current) return;
        const rows = (listAction?.results?.toJS?.() ??
          listAction?.results ??
          []) as any[];
        const list = Array.isArray(rows) ? rows.map(toPlainUser) : [];
        const count = Number(countAction?.results);
        setTotal(Number.isNaN(count) ? list.length : count);
        const cCount = Number(citizenCountAction?.results);
        const citizenCount = Number.isNaN(cCount) ? 0 : cCount;
        setCitizenTotal(citizenCount);
        setApplicationRows(
          list.map((u) =>
            mapUserToFunnelSignals(u, {
              financedTokens: finance.financedByUser[String(u._id)] || 0,
              hasDelinquentFinancePlan: finance.delinquentUsers.has(
                String(u._id),
              ),
              minVouchesNeeded: computeMinVouches(citizenCount),
            }),
          ),
        );
        setCitizenRows([]);
        setRecommendedRows([]);
        return;
      }

      if (tab === 'citizens') {
        const where = buildCitizensWhere();
        const [listAction, finance, proposals] = await Promise.all([
          platform.user.get(
            {
              where,
              limit: MAX_USERS_TO_FETCH,
              page: 1,
              sort_by: '-lastactive',
            },
            { force: true },
          ),
          loadFinanceByUser(),
          loadProposals(),
        ]);
        if (generation !== loadGenerationRef.current) return;
        const rows = (listAction?.results?.toJS?.() ??
          listAction?.results ??
          []) as any[];
        const list = Array.isArray(rows) ? rows.map(toPlainUser) : [];

        const enriched: EnrichedCitizenRow[] = [];
        const chunkSize = 10;
        for (let i = 0; i < list.length; i += chunkSize) {
          if (generation !== loadGenerationRef.current) return;
          const chunk = list.slice(i, i + chunkSize);
          const chunkRows = await Promise.all(
            chunk.map(async (u) => {
              const userId = String(u._id);
              const nightsInWindow = await fetchNightsInWindow(
                userId,
                baseFunnelConfig.maintenanceNightsWindowYears,
              );
              const signals = mapUserToFunnelSignals(u, {
                financedTokens: finance.financedByUser[userId] || 0,
                hasDelinquentFinancePlan: finance.delinquentUsers.has(userId),
                nightsInMaintenanceWindow: nightsInWindow,
                votesInPrimaryWindow: countVotesForUserInWindow(
                  proposals,
                  userId,
                  baseFunnelConfig.maintenanceVoteWindowYears,
                ),
                votesInAltWindow: countVotesForUserInWindow(
                  proposals,
                  userId,
                  baseFunnelConfig.maintenanceAltVoteWindowYears,
                ),
              });
              return {
                signals,
                evaluation: evaluateCitizenAtRisk(signals, baseFunnelConfig),
              };
            }),
          );
          enriched.push(...chunkRows);
        }
        if (generation !== loadGenerationRef.current) return;
        setCitizenRows(enriched);
        setTotal(enriched.length);
        setCitizenTotal(enriched.length);
        setApplicationRows([]);
        setRecommendedRows([]);
        return;
      }

      const where = buildRecommendedWhere(
        baseFunnelConfig.funnelRecommendedMinNights,
      );
      const [listAction, finance] = await Promise.all([
        platform.user.get(
          {
            where,
            limit: Math.max(
              baseFunnelConfig.funnelRecommendedLimit,
              CITIZEN_FUNNEL_LIST_LIMIT,
            ),
            page: 1,
            sort_by: '-stats.all_time.presence',
          },
          { force: true },
        ),
        loadFinanceByUser(),
      ]);
      if (generation !== loadGenerationRef.current) return;
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
            baseFunnelConfig.minStayDuration,
            baseFunnelConfig.tokensRequired,
            baseFunnelConfig.recommendedNightsWeight,
            baseFunnelConfig.recommendedTokensWeight,
          );
          return { signals, recommendation, ...recommendation };
        }),
      )
        .filter(
          (row) =>
            row.score >= baseFunnelConfig.recommendedReadinessThreshold,
        )
        .slice(0, baseFunnelConfig.funnelRecommendedLimit);
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
      if (generation !== loadGenerationRef.current) return;
      setError(t('citizen_funnel_error_load'));
      setApplicationRows([]);
      setCitizenRows([]);
      setRecommendedRows([]);
      setTotal(0);
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [
    applicationPage,
    baseFunnelConfig,
    fetchNightsInWindow,
    loadFinanceByUser,
    loadProposals,
    platform?.user,
    t,
    tab,
  ]);

  useEffect(() => {
    if (hasAccessToFunnel) load();
  }, [hasAccessToFunnel, load]);

  const visibleApplications = useMemo(() => {
    if (!stageFilter) return applicationRows;
    return applicationRows.filter(
      (row) => deriveApplicationStage(row, funnelConfig) === stageFilter,
    );
  }, [applicationRows, funnelConfig, stageFilter]);

  const filteredCitizens = useMemo(() => {
    if (healthFilter === 'all') return citizenRows;
    return citizenRows.filter((row) => row.evaluation.isAtRisk);
  }, [citizenRows, healthFilter]);

  const visibleCitizens = useMemo(() => {
    const start = (page - 1) * CITIZEN_FUNNEL_LIST_LIMIT;
    return filteredCitizens.slice(start, start + CITIZEN_FUNNEL_LIST_LIMIT);
  }, [filteredCitizens, page]);

  const listTotal = tab === 'citizens' ? filteredCitizens.length : total;

  const riskCount = citizenRows.filter((r) => r.evaluation.isAtRisk).length;

  const handleStripPick = (key: CitizenApplicationStage | 'citizen') => {
    if (key === 'citizen') {
      router.push(citizenFunnelTabPath('citizens'));
      setStageFilter(null);
      return;
    }
    if (tab !== 'applications') {
      router.push(citizenFunnelTabPath('applications'));
    }
    setStageFilter((prev) => (prev === key ? null : key));
  };

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
        <div className="flex flex-col gap-5 w-full max-w-xl mx-auto">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-[34px] font-black leading-tight text-foreground m-0">
              {t('citizen_funnel_title')}
            </h1>
            <p className="text-[14.5px] text-gray-500 leading-relaxed m-0">
              {t('citizen_funnel_subtitle')}
            </p>
          </header>

          {(tab === 'applications' || tab === 'citizens') && (
            <CitizenFunnelStrip
              counts={
                tab === 'applications'
                  ? (stageCounts as Record<CitizenApplicationStage, number>)
                  : CITIZEN_APPLICATION_STAGES.reduce(
                      (acc, stage) => {
                        acc[stage] = 0;
                        return acc;
                      },
                      {} as Record<CitizenApplicationStage, number>,
                    )
              }
              active={
                tab === 'citizens' ? 'citizen' : stageFilter
              }
              onPick={handleStripPick}
              citizenCount={citizenTotal}
            />
          )}

          <nav
            className="flex gap-1 overflow-x-auto -mx-1 px-1 border-b border-gray-200"
            style={{ scrollbarWidth: 'none' }}
            aria-label={t('citizen_funnel_tabs_label')}
          >
            {hubTabs.map((item) => {
              const active = tab === item.id;
              const dot =
                item.id === 'citizens' ? riskCount : item.dot || 0;
              return (
                <Link
                  key={item.id}
                  href={citizenFunnelTabPath(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 px-3.5 py-2.5 text-[13px] font-extrabold uppercase tracking-wide relative -mb-px border-b-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                    active
                      ? 'text-foreground border-accent'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  {item.label}
                  {dot > 0 && (
                    <span className="ml-1.5 rounded-full px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-extrabold">
                      {dot}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {tab === 'citizens' && (
            <div className="flex flex-col gap-3">
              <div
                className="flex gap-2 flex-wrap"
                role="group"
                aria-label={t('citizen_funnel_filter_label')}
              >
                {(
                  [
                    ['all', t('citizen_funnel_filter_all_count', { count: citizenRows.length })],
                    [
                      'at-risk',
                      t('citizen_funnel_filter_at_risk_count', {
                        count: riskCount,
                      }),
                    ],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={healthFilter === id}
                    onClick={() => {
                      setHealthFilter(id);
                      setPage(1);
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wider min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      healthFilter === id
                        ? 'bg-foreground text-background border border-foreground'
                        : 'bg-background text-gray-500 border border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 m-0">
                {t('citizen_funnel_presence_requirement', {
                  nights: funnelConfig.maintenanceMinNights,
                  months: funnelConfig.maintenanceNightsWindowYears * 12,
                })}
              </p>
            </div>
          )}

          {tab === 'recommended' && (
            <div className="px-4 py-3 bg-accent-light rounded-[20px]">
              <p className="text-[13px] text-accent font-semibold leading-relaxed m-0">
                {t('citizen_funnel_recommended_blurb', {
                  nightsWeight: Math.round(
                    funnelConfig.recommendedNightsWeight * 100,
                  ),
                  tokensWeight: Math.round(
                    funnelConfig.recommendedTokensWeight * 100,
                  ),
                  threshold: Math.round(
                    funnelConfig.recommendedReadinessThreshold * 100,
                  ),
                })}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {tab === 'config' ? (
            <CitizenFunnelConfigPanel
              config={funnelConfig}
              isAdmin={isAdmin}
            />
          ) : loading ? (
            <div className="flex justify-center py-16" aria-busy="true">
              <Spinner />
              <span className="sr-only">{t('citizen_funnel_loading')}</span>
            </div>
          ) : tab === 'applications' ? (
            visibleApplications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {stageFilter
                  ? t('citizen_funnel_empty_stage')
                  : t('citizen_funnel_empty_applications')}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleApplications.map((signals) => (
                  <CitizenFunnelApplicationRow
                    key={signals.userId}
                    signals={signals}
                    config={funnelConfig}
                  />
                ))}
              </div>
            )
          ) : tab === 'citizens' ? (
            visibleCitizens.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {t('citizen_funnel_empty_citizens')}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleCitizens.map(({ signals, evaluation }) => (
                  <CitizenFunnelCitizenRow
                    key={signals.userId}
                    signals={signals}
                    evaluation={evaluation}
                    config={funnelConfig}
                  />
                ))}
              </div>
            )
          ) : recommendedRows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {t('citizen_funnel_empty_recommended')}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recommendedRows.map(({ signals, recommendation }, index) => (
                <CitizenFunnelRecommendedRow
                  key={signals.userId}
                  signals={signals}
                  recommendation={recommendation}
                  rank={index + 1}
                />
              ))}
            </div>
          )}

          {tab !== 'recommended' &&
            tab !== 'config' &&
            listTotal > CITIZEN_FUNNEL_LIST_LIMIT && (
              <Pagination
                loadPage={(nextPage: number) => setPage(nextPage)}
                page={page}
                limit={CITIZEN_FUNNEL_LIST_LIMIT}
                total={listTotal}
              />
            )}
        </div>
      </AdminLayout>
    </>
  );
};

export default CitizensFunnelPage;
