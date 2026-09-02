import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import DashboardPageHeader from '../../../components/Dashboard/DashboardPageHeader';
import {
  CitizenFunnelApplicationRow,
  CitizenFunnelCitizenRow,
  CitizenFunnelConfigPanel,
  CitizenFunnelRecommendedRow,
  CitizenFunnelStrip,
} from '../../../components/Dashboard/CitizenFunnel/CitizenFunnelRows';
import Pagination from '../../../components/Pagination';
import { Spinner } from '../../../components/ui';

import { MAX_USERS_TO_FETCH } from '../../../constants';
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
} from '../../../types/citizenFunnel';
import { FinanceApplication } from '../../../types/subscriptions';
import api, { formatSearch } from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import {
  buildApplicationsWhere,
  buildCitizensWhere,
  buildRecommendedWhere,
  buildWindowBookingsWhere,
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
  sumNightsByUser,
} from '../../../utils/citizenFunnel.helpers';
import PageNotFound from '../../not-found';

const QUALIFYING_FINANCE_STATUSES: FinanceApplication['status'][] = [
  'paid',
  'up-to-date',
  'completed',
];

/** `/booking` caps a page at 300 server-side; page until a short page arrives. */
const BOOKING_PAGE_LIMIT = 300;
const MAX_BOOKING_PAGES = 10;
/** Keeps the `$in` clause (and therefore the query string) to a sane size. */
const USER_IDS_PER_BOOKING_QUERY = 200;

type EnrichedCitizenRow = {
  signals: CitizenFunnelUserSignals;
  evaluation: ReturnType<typeof evaluateCitizenAtRisk>;
};

type RecommendedRow = {
  signals: CitizenFunnelUserSignals;
  recommendation: CitizenRecommendedScore;
};

const toPlainUser = (row: any) => (row?.toJS ? row.toJS() : row);

/**
 * A failed `platform.<model>.get` never rejects: its catch dispatches an error
 * action and resolves with `undefined`. Reading `results` off that silently
 * turns an unauthorised or broken read into an empty funnel, so treat a missing
 * action (or one carrying an error) as the failure it is.
 */
const assertLoaded = (action: any) => {
  if (!action || action.error) {
    throw new Error(String(action?.error || 'Request failed'));
  }
  return action;
};

const resultsOrThrow = (action: any): any[] => {
  const loaded = assertLoaded(action);
  const rows = loaded.results?.toJS?.() ?? loaded.results ?? [];
  return Array.isArray(rows) ? rows : [];
};

const countOrThrow = (action: any): number => {
  const count = Number(assertLoaded(action).results);
  return Number.isFinite(count) ? count : 0;
};

const CitizensFunnelPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const { hasAccess } = useRBAC();

  const defaultConfig = useConfig();
  /**
   * `getCachedConfig` rebuilds the merged config object on every call, so
   * reading it straight into render hands every `useMemo`/`useCallback` below a
   * fresh dependency each pass — which had `load()` re-running (and re-fetching)
   * on every render. The config is a build-time snapshot; read it once.
   */
  const generalConfig = useMemo(
    () => getCachedConfig('general') as GeneralConfig | null,
    [],
  );
  const citizenshipConfig = useMemo(
    () => getCachedConfig('citizenship') as CitizenshipConfig | null,
    [],
  );

  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  const isCitizenshipEnabled =
    (defaultConfig?.citizenship?.enabled === true ||
      citizenshipConfig?.enabled === true) &&
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';

  const tab = resolveCitizenFunnelTab(router.query.tab);
  const [stageFilter, setStageFilter] =
    useState<CitizenApplicationStage | null>(null);
  const [healthFilter, setHealthFilter] = useState<CitizenHealthFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [applicationRows, setApplicationRows] = useState<
    CitizenFunnelUserSignals[]
  >([]);
  const [citizenRows, setCitizenRows] = useState<EnrichedCitizenRow[]>([]);
  const [recommendedRows, setRecommendedRows] = useState<RecommendedRow[]>([]);
  const [citizenTotal, setCitizenTotal] = useState(0);
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

  const hasAccessToFunnel = hasAccess('CitizenFunnel') && isCitizenshipEnabled;
  const isAdmin = Boolean(user?.roles?.includes('admin'));

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
      const list = resultsOrThrow(action) as FinanceApplication[] | any[];
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

  /**
   * Nights in the maintenance window for every citizen in a handful of
   * requests. This used to be one `/sum/booking/duration` per citizen — up to
   * `MAX_USERS_TO_FETCH` requests per page load — with a `/stays/nights`
   * fallback that silently answered with the *lifetime* total, because that
   * endpoint takes no date range.
   *
   * Returns `null` when no booking is visible at all: a caller without
   * space-host rights only ever sees their own stays, and reporting everyone as
   * zero nights would flag the whole village as at risk.
   */
  const loadNightsByUser = useCallback(
    async (
      userIds: string[],
      windowYears: number,
    ): Promise<Record<string, number> | null> => {
      if (userIds.length === 0) return {};
      const now = new Date();
      const windowStart = dayjs(now).subtract(windowYears, 'year').toDate();
      const bookings: Array<{ createdBy?: unknown; duration?: unknown }> = [];

      try {
        for (
          let i = 0;
          i < userIds.length;
          i += USER_IDS_PER_BOOKING_QUERY
        ) {
          const ids = userIds.slice(i, i + USER_IDS_PER_BOOKING_QUERY);
          const where = buildWindowBookingsWhere(ids, windowStart, now);
          for (let bookingPage = 1; bookingPage <= MAX_BOOKING_PAGES; bookingPage++) {
            const res = await api.get('/booking', {
              params: {
                where: formatSearch(where),
                limit: BOOKING_PAGE_LIMIT,
                page: bookingPage,
                sort_by: '-end',
              },
            });
            const rows = res?.data?.results;
            if (!Array.isArray(rows)) break;
            bookings.push(...rows);
            if (rows.length < BOOKING_PAGE_LIMIT) break;
          }
        }
      } catch {
        return null;
      }

      if (bookings.length === 0) return null;
      return sumNightsByUser(bookings, userIds);
    },
    [],
  );

  const load = useCallback(async () => {
    if (!platform?.user?.get) return;
    const generation = ++loadGenerationRef.current;
    const isCurrent = () => generation === loadGenerationRef.current;

    setLoading(true);
    setHasError(false);
    /**
     * The strip and the tab list are two reads, and only the second one can
     * fail per-tab. Clearing everything on any failure meant a broken
     * Recommended query blanked the application counts the strip had already
     * loaded, so remember how far we got.
     */
    let stripLoaded = false;
    try {
      /**
       * The stage strip sits above every tab, so the applications list and the
       * citizen headcount behind it load whichever tab is open.
       *
       * Applications in progress are a bounded set, so they come back in one
       * page and are filtered client-side. Paging them server-side made the
       * strip count only the visible page and the stage filter hide rows the
       * pager still counted.
       */
      const [applicationsAction, citizenCountAction, finance] =
        await Promise.all([
          platform.user.get(
            {
              where: buildApplicationsWhere(),
              limit: MAX_USERS_TO_FETCH,
              page: 1,
              sort_by: '-citizenship.appliedAt',
            },
            { force: true },
          ),
          platform.user.getCount({ where: buildCitizensWhere() }),
          loadFinanceByUser(),
        ]);
      if (!isCurrent()) return;
      const citizenCount = countOrThrow(citizenCountAction);
      setCitizenTotal(citizenCount);
      setApplicationRows(
        resultsOrThrow(applicationsAction)
          .map(toPlainUser)
          .map((u) =>
            mapUserToFunnelSignals(u, {
              financedTokens: finance.financedByUser[String(u._id)] || 0,
              hasDelinquentFinancePlan: finance.delinquentUsers.has(
                String(u._id),
              ),
              minVouchesNeeded: computeMinVouches(citizenCount),
            }),
          ),
      );
      stripLoaded = true;

      if (tab === 'applications' || tab === 'config') {
        setCitizenRows([]);
        setRecommendedRows([]);
        return;
      }

      if (tab === 'citizens') {
        const [listAction, proposals] = await Promise.all([
          platform.user.get(
            {
              where: buildCitizensWhere(),
              limit: MAX_USERS_TO_FETCH,
              page: 1,
              sort_by: '-lastactive',
            },
            { force: true },
          ),
          loadProposals(),
        ]);
        if (!isCurrent()) return;
        const list = resultsOrThrow(listAction).map(toPlainUser);
        const userIds = list.map((u) => String(u._id)).filter(Boolean);
        const nightsByUser = await loadNightsByUser(
          userIds,
          baseFunnelConfig.maintenanceNightsWindowYears,
        );
        if (!isCurrent()) return;

        const enriched: EnrichedCitizenRow[] = list.map((u) => {
          const userId = String(u._id);
          const signals = mapUserToFunnelSignals(u, {
            financedTokens: finance.financedByUser[userId] || 0,
            hasDelinquentFinancePlan: finance.delinquentUsers.has(userId),
            nightsInMaintenanceWindow: nightsByUser
              ? nightsByUser[userId] ?? 0
              : null,
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
        });

        setCitizenRows(enriched);
        setRecommendedRows([]);
        return;
      }

      const where = buildRecommendedWhere(
        baseFunnelConfig.funnelRecommendedMinNights,
      );
      const listAction = await platform.user.get(
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
      );
      if (!isCurrent()) return;
      const list = resultsOrThrow(listAction).map(toPlainUser);
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
      ).slice(0, baseFunnelConfig.funnelRecommendedLimit);
      setRecommendedRows(
        scored.map(({ signals, recommendation }) => ({
          signals,
          recommendation,
        })),
      );
      setCitizenRows([]);
    } catch {
      if (!isCurrent()) return;
      setHasError(true);
      if (!stripLoaded) {
        setApplicationRows([]);
        setCitizenTotal(0);
      }
      setCitizenRows([]);
      setRecommendedRows([]);
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
  }, [
    baseFunnelConfig,
    loadFinanceByUser,
    loadNightsByUser,
    loadProposals,
    platform?.user,
    tab,
  ]);

  useEffect(() => {
    if (hasAccessToFunnel) load();
  }, [hasAccessToFunnel, load]);

  const filteredApplications = useMemo(() => {
    if (!stageFilter) return applicationRows;
    return applicationRows.filter(
      (row) => deriveApplicationStage(row, funnelConfig) === stageFilter,
    );
  }, [applicationRows, funnelConfig, stageFilter]);

  const filteredCitizens = useMemo(() => {
    if (healthFilter === 'all') return citizenRows;
    return citizenRows.filter((row) => row.evaluation.isAtRisk);
  }, [citizenRows, healthFilter]);

  /** Only the two paged tabs have a list to page through. */
  const listTotal =
    tab === 'citizens'
      ? filteredCitizens.length
      : tab === 'applications'
      ? filteredApplications.length
      : 0;
  const pageStart = (page - 1) * CITIZEN_FUNNEL_LIST_LIMIT;

  const visibleApplications = useMemo(
    () =>
      filteredApplications.slice(pageStart, pageStart + CITIZEN_FUNNEL_LIST_LIMIT),
    [filteredApplications, pageStart],
  );

  const visibleCitizens = useMemo(
    () => filteredCitizens.slice(pageStart, pageStart + CITIZEN_FUNNEL_LIST_LIMIT),
    [filteredCitizens, pageStart],
  );

  const riskCount = citizenRows.filter((r) => r.evaluation.isAtRisk).length;
  const readyCount = stageCounts.ready || 0;

  const hubTabs: { id: CitizenFunnelTab; label: string; badge?: number }[] = [
    {
      id: 'applications',
      label: t('citizen_funnel_tab_applications'),
      badge: readyCount,
    },
    {
      id: 'citizens',
      label: t('citizen_funnel_tab_citizens'),
      badge: riskCount,
    },
    { id: 'recommended', label: t('citizen_funnel_tab_recommended') },
    { id: 'config', label: t('citizen_funnel_tab_config') },
  ];

  const handleStripPick = (key: CitizenApplicationStage | 'citizen') => {
    if (key === 'citizen') {
      router.push(citizenFunnelTabPath('citizens'));
      setStageFilter(null);
      return;
    }
    if (tab !== 'applications') {
      router.push(citizenFunnelTabPath('applications'));
    }
    setPage(1);
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
        <div className="flex flex-col gap-6 px-4 sm:px-0">
          <DashboardPageHeader
            title={t('citizen_funnel_title')}
            subtitle={t('citizen_funnel_subtitle')}
          />

          <CitizenFunnelStrip
            counts={stageCounts as Record<CitizenApplicationStage, number>}
            active={tab === 'citizens' ? 'citizen' : stageFilter}
            onPick={handleStripPick}
            citizenCount={citizenTotal}
          />

          <nav
            className="flex flex-wrap gap-2"
            aria-label={t('citizen_funnel_tabs_label')}
          >
            {hubTabs.map((item) => {
              const active = tab === item.id;
              return (
                <Link
                  key={item.id}
                  href={citizenFunnelTabPath(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? 'bg-accent text-background'
                      : 'bg-muted text-foreground hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                  {item.badge ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        active
                          ? 'bg-background/25 text-background'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {tab === 'citizens' && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div
                className="flex gap-2 flex-wrap"
                role="group"
                aria-label={t('citizen_funnel_filter_label')}
              >
                {(
                  [
                    [
                      'all',
                      t('citizen_funnel_filter_all_count', {
                        count: citizenRows.length,
                      }),
                    ],
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
                    className={`rounded-full px-4 py-2 text-sm border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      healthFilter === id
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 m-0">
                {t('citizen_funnel_presence_requirement', {
                  nights: funnelConfig.maintenanceMinNights,
                  months: funnelConfig.maintenanceNightsWindowYears * 12,
                })}
              </p>
            </div>
          )}

          {tab === 'recommended' && (
            <div className="px-4 py-3 bg-accent-light rounded-md">
              <p className="text-sm text-accent m-0">
                {t('citizen_funnel_recommended_blurb', {
                  nightsWeight: Math.round(
                    funnelConfig.recommendedNightsWeight * 100,
                  ),
                  tokensWeight: Math.round(
                    funnelConfig.recommendedTokensWeight * 100,
                  ),
                  nights: funnelConfig.funnelRecommendedMinNights,
                })}
              </p>
            </div>
          )}

          {hasError && (
            <p className="text-sm text-red-600" role="alert">
              {t('citizen_funnel_error_load')}
            </p>
          )}

          {tab === 'config' ? (
            <CitizenFunnelConfigPanel config={funnelConfig} isAdmin={isAdmin} />
          ) : loading ? (
            <div className="flex justify-center py-16" aria-busy="true">
              <Spinner />
              <span className="sr-only">{t('citizen_funnel_loading')}</span>
            </div>
          ) : tab === 'applications' ? (
            visibleApplications.length === 0 ? (
              <p className="text-sm text-gray-600 py-8">
                {stageFilter
                  ? t('citizen_funnel_empty_stage')
                  : t('citizen_funnel_empty_applications')}
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
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
              <p className="text-sm text-gray-600 py-8">
                {t('citizen_funnel_empty_citizens')}
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
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
            <p className="text-sm text-gray-600 py-8">
              {t('citizen_funnel_empty_recommended')}
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
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

          {!loading && listTotal > CITIZEN_FUNNEL_LIST_LIMIT && (
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
