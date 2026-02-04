import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import StatsCard from '../../components/Affiliate';
import TimeFrameSelector from '../../components/Dashboard/TimeFrameSelector';
import PercentageBar from '../../components/PercentageBar';
import RevenueIcon from '../../components/icons/RevenueIcon';
import LinkBuilderTool from '../../components/LinkBuilderTool';
import { Card, Heading, LinkButton } from 'closer/components/ui';

import { FaLink } from '@react-icons/all-files/fa/FaLink';
import { AffiliateConfig, PageNotFound, api, usePlatform } from 'closer';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { User } from '../../contexts/auth/types';
import { calculateAffiliateRevenue } from '../../utils/affiliate.utils';
import { loadLocaleData } from '../../utils/locale.helpers';
import { getStartAndEndDate } from '../../utils/performance.utils';

const AffiliatePage = ({
  affiliateConfig,
}: {
  affiliateConfig: AffiliateConfig;
}) => {
  const t = useTranslations();
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

  // Handle timeframe changes
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
  } = calculateAffiliateRevenue(referralCharges) || {};

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
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${t('affiliate_dashboard')}`}</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <section className="flex gap-8 justify-between items-start sm:items-center flex-col sm:flex-row">
          <Heading level={1}>🤝 {t('affiliate_dashboard')}</Heading>
          <div className="flex gap-2 flex-col sm:flex-row items-start sm:items-center">
            <TimeFrameSelector
              timeFrame={timeFrame}
              setTimeFrame={handleTimeFrameChange}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Heading
            level={2}
            className="text-lg flex gap-2 items-center uppercase"
          >
            {<FaLink />}
            {t('affiliate_links')}
          </Heading>
          
          <LinkBuilderTool
            userId={user?._id || ''}
            onLinkGenerated={(link) => {
              // Track link generation
              api.post('/metric', {
                event: 'affiliate-link-generated',
                value: user?._id,
                number: 1,
                point: 1,
                category: 'engagement',
              }).catch(error => console.error('Error tracking link generation:', error));
            }}
          />
          <div className="flex flex-col gap-4">
            <Card className=" rounded-md bg-accent-light">
              <LinkButton
                target="_blank"
                className=" px-4  w-fit"
                href="https://drive.google.com/drive/folders/11i6UBGqEyC8aw0ufJybnbjueSpE3s8f-"
              >
                {t('dashboard_affiliate_promo_materials')}
              </LinkButton>

                <LinkButton
                  className=" px-4  w-fit"
                  href="/affiliate"
                >
                  📋 {t('affiliate_dashboard_program_rules_faq')}
                </LinkButton>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <Heading
            level={2}
            className="text-lg flex gap-2 items-center uppercase"
          >
            <RevenueIcon /> {t('affiliate_earnings')}
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              title={t('stats_total_earnings')}
              value={`€${totalRevenue.toFixed(2)}`}
              isAccent={true}
              subtext={t('stats_earnings_subtext')}
            />
            <StatsCard
              title={t('stats_unpaid_earnings')}
              value={`€${(totalRevenue - totalPayoutCharges).toFixed(2)}`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              value={activeSubscriptionsCount?.toString()}
              subtext={t('stats_subscriptions_subtext')}
            />
            <StatsCard
              title={t('stats_token_sales')}
              value={`€${(tokenSaleRevenue + financedTokenRevenue).toFixed(2)}`}
              subtext={t('stats_tokens_subtext')}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <Heading
            level={2}
            className="text-lg flex gap-2 items-center uppercase"
          >
            💬 {t('affiliate_dashboard_support_contact')}
          </Heading>
          <Card className="p-6 bg-gray-50">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {t('affiliate_dashboard_support_intro')}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('affiliate_dashboard_support_email_label')}</span>
                <a 
                  href="mailto:affiliates@traditionaldreamfactory.com"
                  className="text-accent hover:text-accent-dark font-medium"
                >
                  affiliates@traditionaldreamfactory.com
                </a>
              </div>
              <p className="text-xs text-gray-500">
                {t('affiliate_dashboard_support_response_time')}
              </p>
            </div>
          </Card>
        </section>

        <Card className="space-y-4">
          <Heading level={2} className="text-lg font-normal">
            {t('earnings_breakdown')}
          </Heading>
          <div className="space-y-1">
            <p>
              {t('earnings_breakdown_stays')} (
              {affiliateConfig?.staysCommissionPercent || 0}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{staysRevenue.toFixed(2)}</p>
            <PercentageBar
              percentage={
                totalRevenue ? (staysRevenue / totalRevenue) * 100 : 0
              }
            />
          </div>
          <div className="space-y-1">
            <p>
              {t('earnings_breakdown_events')} (
              {affiliateConfig?.eventsCommissionPercent || 0}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{eventsRevenue.toFixed(2)}</p>
            <PercentageBar
              percentage={
                totalRevenue ? (eventsRevenue / totalRevenue) * 100 : 0
              }
            />
          </div>
          <div className="space-y-1">
            <p>
              {t('earnings_breakdown_subscriptions')} (
              {affiliateConfig?.subscriptionCommissionPercent || 0}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{subscriptionsRevenue.toFixed(2)}</p>
            <PercentageBar
              percentage={
                totalRevenue ? (subscriptionsRevenue / totalRevenue) * 100 : 0
              }
            />
          </div>
          <div className="space-y-1">
            <p>
              {t('earnings_breakdown_token_sales')} (
              {affiliateConfig?.tokenSaleCommissionPercent || 0}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{tokenSaleRevenue.toFixed(2)}</p>
            <PercentageBar
              percentage={
                totalRevenue ? (tokenSaleRevenue / totalRevenue) * 100 : 0
              }
            />
          </div>
          <div className="space-y-1">
            <p>
              {t('earnings_breakdown_financed_token_sales')} (
              {affiliateConfig?.financedTokenSaleCommissionPercent || 0}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{financedTokenRevenue.toFixed(2)}</p>
            <PercentageBar
              percentage={
                totalRevenue ? (financedTokenRevenue / totalRevenue) * 100 : 0
              }
            />
          </div>
        </Card>
        {userPayoutCharges?.length > 0 && (
          <Card>
            <div className="flex flex-col gap-2 w-1/2">
              <Heading level={3} className="text-md uppercase">
                {t('affiliate_dashboard_payouts')}
              </Heading>
              <div>
                <div className="grid grid-cols-2 gap-2 border-b py-1">
                  <p>{t('affiliate_dashboard_date')}</p>
                  <p className="text-right">
                    {t('affiliate_dashboard_amount')}
                  </p>
                </div>
                {userPayoutCharges.reverse().map((payout: any) => (
                  <div key={payout._id} className="grid grid-cols-2 gap-2 pt-1">
                    <p>{payout.created?.slice(0, 10) || ''}</p>
                    <p className="text-right">
                      €{payout.amount?.total?.val?.toLocaleString() || '0'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

AffiliatePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [affiliateConfigRes, messages] = await Promise.all([
      api.get('/config/affiliate').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const affiliateConfig = affiliateConfigRes?.data?.results?.value;

    return {
      affiliateConfig,
      messages,
    };
  } catch (err: unknown) {
    console.error('Error in getInitialProps:', err);
    return {
      affiliateConfig: null,
      messages: null,
    };
  }
};

export default AffiliatePage;
