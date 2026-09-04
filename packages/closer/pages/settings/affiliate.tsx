import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import StatsCard from '../../components/Affiliate';
import TimeFrameSelector from '../../components/Dashboard/TimeFrameSelector';
import LinkBuilderTool from '../../components/LinkBuilderTool';
import PercentageBar from '../../components/PercentageBar';
import VillageCard from '../../components/VillageCard';
import { Card, Heading, LinkButton, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_REVENUE_SHARE_PERCENT } from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import { User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { AffiliateConfig, GeneralConfig } from '../../types/api';
import { Village } from '../../types/village';
import {
  AffiliateRevenueType,
  calculateAffiliateRevenue,
  getCommissionPercent,
  isFederationHub,
} from '../../utils/affiliate.utils';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { logMetric } from '../../utils/metrics';
import { getStartAndEndDate } from '../../utils/performance.utils';
import {
  fetchUserVillageConnections,
  isVillageDeployed,
} from '../../utils/village.utils';
import PageNotAllowed from '../401';
import PageNotFound from '../not-found';

const sectionTitle =
  'text-xs font-bold uppercase tracking-[0.18em] text-foreground/60';

const AffiliatePage = () => {
  const t = useTranslations();
  const affiliateConfig = getCachedConfig('affiliate') as AffiliateConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const defaultConfig = useConfig() || {};
  const teamEmail = generalConfig?.teamEmail || defaultConfig.TEAM_EMAIL || '';
  const promoMaterialsUrl = affiliateConfig?.promoMaterialsUrl || '';
  // On the closer.earth hub an affiliate is an Ambassador: a flat share of
  // Closer's revenue from the villages they maintain, whatever the charge type.
  const isHub = isFederationHub();

  const formatEurAmount = (amount: number) =>
    formatIsoFiatAmount(amount || 0, 'EUR');

  const { platform }: any = usePlatform() || {};
  const { user } = useAuth() || {};
  const router = useRouter();
  const { time_frame } = router.query;

  const [timeFrame, setTimeFrame] = useState<string>(
    time_frame?.toString() || 'allTime',
  );
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [villages, setVillages] = useState<Village[]>([]);

  const handleTimeFrameChange = (
    value: string | ((prevState: string) => string),
  ) => {
    const newTimeFrame = typeof value === 'function' ? value(timeFrame) : value;
    setTimeFrame(newTimeFrame);

    // Only update URL for non-custom timeframes
    if (newTimeFrame !== 'custom') {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, time_frame: newTimeFrame },
        },
        undefined,
        { shallow: true },
      );
    }
  };

  const { startDate, endDate } = useMemo(
    () => getStartAndEndDate(timeFrame, fromDate, toDate),
    [timeFrame, fromDate, toDate],
  );

  const filters = useMemo(
    () => ({
      referralsFilter: {
        where: {
          referredBy: user?._id,
          ...(timeFrame !== 'allTime' && {
            created: {
              $gte: startDate,
              $lte: endDate,
            },
          }),
        },
      },
      referralChargesFilter: {
        where: {
          referredBy: user?._id,
          ...(timeFrame !== 'allTime' && {
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          }),
        },
        limit: 1000,
      },
      payoutsFilter: {
        where: {
          type: 'affiliatePayout',
        },
      },
      trafficFilter: {
        where: {
          event: 'referral-view',
          value: user?._id,
          ...(timeFrame !== 'allTime' && {
            created: {
              $gte: startDate,
              $lte: endDate,
            },
          }),
        },
      },
    }),
    [user?._id, timeFrame, startDate, endDate],
  );

  // Initial data loading
  useEffect(() => {
    if (user && platform) {
      loadData();
    }
  }, [user, platform]);

  // Handle timeframe changes
  useEffect(() => {
    if (dataLoaded && user && platform) {
      loadData();
    }
  }, [filters, dataLoaded]);

  // The villages an Ambassador maintains — attribution lives on the village,
  // not on the charges, so it is a separate read from the earnings above.
  useEffect(() => {
    if (!isHub || !user?._id) return;
    let cancelled = false;
    fetchUserVillageConnections(user._id)
      .then((connections) => {
        if (cancelled) return;
        setVillages(
          connections
            .filter(
              (connection) =>
                connection.roles.includes('ambassador') ||
                connection.roles.includes('referrer'),
            )
            .map((connection) => connection.village),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isHub, user?._id]);

  const referralsCount =
    platform?.user?.findCount?.(filters.referralsFilter) || 0;
  const referrals =
    platform?.user?.find?.(filters.referralsFilter)?.toJS?.() || [];
  const referralCharges =
    platform?.charge?.find?.(filters.referralChargesFilter)?.toJS?.() || [];

  const payoutCharges =
    platform?.charge?.find?.(filters.payoutsFilter)?.toJS?.() || [];
  const userPayoutCharges =
    payoutCharges?.filter(
      (charge: any) => charge?.meta?.affiliateId === user?._id,
    ) || [];

  const trafficCount = platform?.metric?.findCount?.(filters.trafficFilter) || 0;

  const totalPayoutCharges =
    userPayoutCharges?.reduce(
      (acc: number, charge: any) => acc + (charge?.amount?.total?.val || 0),
      0,
    ) || 0;

  const activeSubscriptionsCount =
    referrals?.filter(
      (user: User) =>
        user?.subscription && JSON.stringify(user?.subscription) !== '{}',
    )?.length || 0;

  const {
    totalRevenue = 0,
    subscriptionsRevenue = 0,
    staysRevenue = 0,
    eventsRevenue = 0,
    tokenSaleRevenue = 0,
    financedTokenRevenue = 0,
    villagePlatformFeesRevenue = 0,
  } = calculateAffiliateRevenue(referralCharges) || {};

  const liveVillages = villages.filter(isVillageDeployed).length;

  const breakdown = (
    [
      // The villages' platform fees are what an Ambassador is here for, so
      // they lead the list. They only exist on the hub.
      ...(isHub
        ? [
            {
              type: 'villagePlatformFees',
              label: t('earnings_breakdown_village_platform_fees'),
              amount: villagePlatformFeesRevenue,
            },
          ]
        : []),
      {
        type: 'subscriptions',
        label: t('earnings_breakdown_subscriptions'),
        amount: subscriptionsRevenue,
      },
      { type: 'stays', label: t('earnings_breakdown_stays'), amount: staysRevenue },
      {
        type: 'events',
        label: t('earnings_breakdown_events'),
        amount: eventsRevenue,
      },
      {
        type: 'tokenSales',
        label: t('earnings_breakdown_token_sales'),
        amount: tokenSaleRevenue,
      },
      {
        type: 'financedTokenSales',
        label: t('earnings_breakdown_financed_token_sales'),
        amount: financedTokenRevenue,
      },
    ] as { type: AffiliateRevenueType; label: string; amount: number }[]
  )
    .map((row) => ({
      ...row,
      percent: getCommissionPercent(row.type, affiliateConfig, isHub),
      share: totalRevenue ? (row.amount / totalRevenue) * 100 : 0,
    }))
    // A community lists every rate it pays; the hub's rate is the same for all
    // types, so there it only lists what actually earned something.
    .filter((row) => row.amount > 0 || (!isHub && row.percent > 0));

  const loadData = async () => {
    if (!platform) return;

    setIsLoading(true);
    try {
      await Promise.all([
        platform.user?.getCount?.(filters.referralsFilter),
        platform.user?.get?.(filters.referralsFilter),
        platform.charge?.get?.(filters.referralChargesFilter),
        platform.charge?.get?.(filters.payoutsFilter),
        platform.metric?.getCount?.(filters.trafficFilter),
      ]);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_AFFILIATE !== 'true') {
    return <PageNotFound />;
  }

  if (!user || !user?.affiliate) {
    return <PageNotAllowed />;
  }

  // Only show loading on initial render, not during data refreshes
  if (!platform || (!dataLoaded && isLoading)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${t('affiliate_dashboard')}`}</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-10">
        {/* HEADER */}
        <section className="flex gap-6 justify-between items-start lg:items-end flex-col lg:flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {isHub
                ? t('affiliate_dashboard_eyebrow_hub')
                : t('affiliate_dashboard_eyebrow')}
            </span>
            <Heading level={1} className="text-3xl md:text-4xl">
              {t('affiliate_dashboard')}
            </Heading>
            <p className="text-foreground/70 max-w-xl">
              {isHub
                ? t('affiliate_dashboard_intro_hub', {
                    percent: AMBASSADOR_REVENUE_SHARE_PERCENT,
                  })
                : t('affiliate_dashboard_intro')}
            </p>
          </div>
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={handleTimeFrameChange}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </section>

        {/* STATS */}
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title={t('stats_total_earnings')}
              value={formatEurAmount(totalRevenue)}
              isAccent={true}
              subtext={t('stats_earnings_subtext')}
            />
            <StatsCard
              title={t('stats_unpaid_earnings')}
              value={formatEurAmount(totalRevenue - totalPayoutCharges)}
              subtext={t('stats_unpaid_earnings_subtext')}
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title={t('stats_total_referrals')}
              value={referralsCount}
              subtext={t('stats_referrals_subtext')}
            />
            <StatsCard
              title={t('affiliate_dashboard_link_clicks')}
              value={trafficCount}
              subtext={t('affiliate_dashboard_link_clicks_subtext')}
            />
            <StatsCard
              title={t('stats_active_subscriptions')}
              value={activeSubscriptionsCount}
              subtext={t('stats_subscriptions_subtext')}
            />
            {isHub ? (
              <StatsCard
                title={t('stats_villages_maintained')}
                value={villages.length}
                subtext={t('stats_villages_maintained_subtext', {
                  live: liveVillages,
                })}
              />
            ) : (
              <StatsCard
                title={t('stats_token_sales')}
                value={formatEurAmount(tokenSaleRevenue + financedTokenRevenue)}
                subtext={t('stats_tokens_subtext')}
              />
            )}
          </div>
        </section>

        {/* BREAKDOWN + PROGRAM */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2 rounded-2xl shadow-none border border-line/40 bg-background p-6 md:p-8 gap-6">
            <div>
              <p className={sectionTitle}>{t('earnings_breakdown')}</p>
              <p className="text-sm text-foreground/70 mt-1">
                {isHub
                  ? t('affiliate_breakdown_intro_hub', {
                      percent: AMBASSADOR_REVENUE_SHARE_PERCENT,
                    })
                  : t('affiliate_breakdown_intro')}
              </p>
            </div>
            {breakdown.length === 0 ? (
              <p className="text-sm text-foreground/60 border border-dashed border-line/60 rounded-xl px-4 py-8 text-center">
                {t('affiliate_breakdown_empty')}
              </p>
            ) : (
              <ul className="flex flex-col gap-5">
                {breakdown.map((row) => (
                  <li key={row.type} className="flex flex-col gap-2">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-xs text-foreground/60">
                          {isHub
                            ? t('affiliate_breakdown_rate_hub', {
                                percent: row.percent,
                              })
                            : t('affiliate_breakdown_rate', {
                                percent: row.percent,
                              })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatEurAmount(row.amount)}</p>
                        <p className="text-xs text-foreground/60">
                          {t('affiliate_breakdown_share_of_total', {
                            percent: Math.round(row.share),
                          })}
                        </p>
                      </div>
                    </div>
                    <PercentageBar percentage={row.share} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex flex-col gap-6">
            {isHub ? (
              <Card className="rounded-2xl shadow-none border border-accent/30 bg-accent-light/40 p-6 md:p-8 gap-4">
                <p className={sectionTitle}>{t('affiliate_hub_share_eyebrow')}</p>
                <div>
                  <p className="text-5xl font-bold text-accent leading-none">
                    {AMBASSADOR_REVENUE_SHARE_PERCENT}%
                  </p>
                  <p className="text-sm text-foreground/70 mt-2">
                    {t('affiliate_hub_share_body')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {t('affiliate_hub_duties_title')}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm text-foreground/70">
                    <li className="flex gap-2">
                      <span className="text-accent font-bold">→</span>
                      {t('affiliate_hub_duty_chat')}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent font-bold">→</span>
                      {t('affiliate_hub_duty_bugs')}
                    </li>
                  </ul>
                </div>
                <Link
                  href="/ambassadors"
                  className="text-sm font-semibold text-accent underline underline-offset-[3px]"
                >
                  {t('affiliate_hub_program_link')} →
                </Link>
              </Card>
            ) : (
              <Card className="rounded-2xl shadow-none border border-line/40 bg-background p-6 md:p-8 gap-4">
                <p className={sectionTitle}>
                  {t('affiliate_dashboard_program_title')}
                </p>
                <p className="text-sm text-foreground/70">
                  {t('affiliate_dashboard_program_body')}
                </p>
                <div className="flex flex-col gap-2">
                  <LinkButton className="px-4 w-fit" href="/affiliate">
                    📋 {t('affiliate_dashboard_program_rules_faq')}
                  </LinkButton>
                  {promoMaterialsUrl && (
                    <LinkButton
                      target="_blank"
                      className="px-4 w-fit"
                      href={promoMaterialsUrl}
                    >
                      🎨 {t('dashboard_affiliate_promo_materials')}
                    </LinkButton>
                  )}
                </div>
              </Card>
            )}

            <Card className="rounded-2xl shadow-none border border-line/40 bg-background p-6 md:p-8 gap-3">
              <p className={sectionTitle}>
                💬 {t('affiliate_dashboard_support_contact')}
              </p>
              <p className="text-sm text-foreground/70">
                {t('affiliate_dashboard_support_intro')}
              </p>
              {teamEmail && (
                <a
                  href={`mailto:${teamEmail}`}
                  className="text-sm font-semibold text-accent underline underline-offset-[3px] w-fit"
                >
                  {teamEmail}
                </a>
              )}
              <p className="text-xs text-foreground/50">
                {t('affiliate_dashboard_support_response_time')}
              </p>
            </Card>
          </div>
        </section>

        {/* VILLAGES (hub only) */}
        {isHub && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <p className={sectionTitle}>{t('affiliate_hub_villages_title')}</p>
              <LinkButton className="px-4 w-fit" href="/villages/create">
                {t('affiliate_hub_villages_add')}
              </LinkButton>
            </div>
            {villages.length === 0 ? (
              <p className="text-sm text-foreground/60 border border-dashed border-line/60 rounded-xl px-4 py-8 text-center">
                {t('affiliate_hub_villages_empty')}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {villages.map((village) => (
                  <VillageCard key={village._id} village={village} showStatus />
                ))}
              </div>
            )}
          </section>
        )}

        {/* LINKS */}
        <section className="flex flex-col gap-4">
          <p className={sectionTitle}>{t('affiliate_links')}</p>
          <LinkBuilderTool
            userId={user?._id || ''}
            onLinkGenerated={() => {
              void logMetric({
                event: 'affiliate-link-generated',
                category: 'affiliate',
                value: 'link-generated',
                number: 1,
              });
            }}
          />
        </section>

        {/* PAYOUTS */}
        {userPayoutCharges?.length > 0 && (
          <section className="flex flex-col gap-4">
            <p className={sectionTitle}>{t('affiliate_dashboard_payouts')}</p>
            <Card className="rounded-2xl shadow-none border border-line/40 bg-background p-6 md:p-8 gap-0">
              <div className="grid grid-cols-2 gap-2 border-b border-line/40 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/60">
                <p>{t('affiliate_dashboard_date')}</p>
                <p className="text-right">{t('affiliate_dashboard_amount')}</p>
              </div>
              {[...userPayoutCharges].reverse().map((payout: any) => (
                <div
                  key={payout._id}
                  className="grid grid-cols-2 gap-2 py-2.5 border-b border-line/20 last:border-0 text-sm"
                >
                  <p>{payout.created?.slice(0, 10) || ''}</p>
                  <p className="text-right font-medium">
                    {formatEurAmount(payout.amount?.total?.val || 0)}
                  </p>
                </div>
              ))}
            </Card>
          </section>
        )}
      </div>
    </>
  );
};

export default AffiliatePage;
