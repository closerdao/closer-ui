import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import TimeFrameSelector from '../../components/Dashboard/TimeFrameSelector';
import StatsCard from './components/Affiliate';
import { Card, Heading } from 'closer/components/ui';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { FaCoins } from '@react-icons/all-files/fa/FaCoins';
import { FaEuroSign } from '@react-icons/all-files/fa/FaEuroSign';
import { FaUsers } from '@react-icons/all-files/fa/FaUsers';
import { AffiliateConfig, api, usePlatform } from 'closer';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { User } from '../../contexts/auth/types';
import { useConfig } from '../../hooks/useConfig';
import { DateRange } from '../../types/affiliate';
import { calculateAffiliateRevenue } from '../../utils/affiliate.utils';
import { loadLocaleData } from '../../utils/locale.helpers';
import { getStartAndEndDate } from '../../utils/performance.utils';

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last 365 days' },
  { value: 'all', label: 'All time' },
] as const;

const AffiliateDashboard = ({
  affiliateConfig,
}: {
  affiliateConfig: AffiliateConfig;
}) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const config = useConfig();
  const { SEMANTIC_URL } = config || {};

  const [dateRange, setDateRange] = useState<DateRange>(
    DATE_RANGES.find((range) => range.value === 'all') || DATE_RANGES[0],
  );
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { time_frame } = router.query;

  const [timeFrame, setTimeFrame] = useState<string>(
    time_frame?.toString() || 'month',
  );
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

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
    }),
    [user?._id, timeFrame, startDate, endDate],
  );

  // Load data only when filters change
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [filters, user]);

  const referralLink = `${SEMANTIC_URL}/signup/?referral=${user?._id}`;

  const tokenFlowLink = `${SEMANTIC_URL}/token?referral=${user?._id}`;

  const subscriptionsFlowLink = `${SEMANTIC_URL}/subscriptions?referral=${user?._id}`;

  const staysFlowLink = `${SEMANTIC_URL}/stay?referral=${user?._id}`;

  const referralsCount = platform.user.findCount(filters.referralsFilter);
  const referrals = platform.user.find(filters.referralsFilter)?.toJS();
  const referralCharges = platform.charge
    .find(filters.referralChargesFilter)
    ?.toJS();
  const activeSubscriptionsCount = referrals?.filter(
    (user: User) =>
      user.subscription && JSON.stringify(user.subscription) !== '{}',
  ).length;

  const {
    totalRevenue,
    subscriptionsRevenue,
    staysRevenue,
    eventsRevenue,
    tokenSaleRevenue,
    financedTokenRevenue,
  } = calculateAffiliateRevenue(referralCharges, affiliateConfig);

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
      (err) => {
        console.log('failed to copy', err.mesage);
      },
    );
  };

  const loadData = async () => {
    await Promise.all([
      platform.user.getCount(filters.referralsFilter),
      platform.user.get(filters.referralsFilter),
      platform.charge.get(filters.referralChargesFilter),
    ]);
  };

  if (!user) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${t('affiliate_dashboard')}`}</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <section className="flex gap-4 justify-between items-start sm:items-center flex-col sm:flex-row">
          <Heading level={1}>🤝 {t('affiliate_dashboard')}</Heading>
          fromDate={fromDate} / toDate={toDate} / timeFrame={timeFrame}
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
          <div className="flex gap-4 flex-col sm:flex-row items-start sm:items-center">
            <Heading level={2} className="text-lg font-normal flex-none">
              {t('affiliate_link')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {referralLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(referralLink)}>
                  <Image
                    src="/images/icon-copy.svg"
                    alt="Copy"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
            </Card>
          </div>
          <div className="flex gap-4 flex-col sm:flex-row items-start sm:items-center">
            <Heading level={2} className="text-lg font-normal flex-none">
              {t('affiliate_token_flow')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {tokenFlowLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(tokenFlowLink)}>
                  <Image
                    src="/images/icon-copy.svg"
                    alt="Copy"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
            </Card>
          </div>
          <div className="flex gap-4 flex-col sm:flex-row items-start sm:items-center">
            <Heading level={2} className="text-lg font-normal flex-none">
              {t('affiliate_subscriptions_flow')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {subscriptionsFlowLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(subscriptionsFlowLink)}>
                  <Image
                    src="/images/icon-copy.svg"
                    alt="Copy"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
            </Card>
          </div>
          <div className="flex gap-4 flex-col sm:flex-row items-start sm:items-center">
            <Heading level={2} className="text-lg font-normal flex-none">
              {t('affiliate_stays_flow')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {staysFlowLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(staysFlowLink)}>
                  <Image
                    src="/images/icon-copy.svg"
                    alt="Copy"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatsCard
            title={t('stats_total_earnings')}
            value={`€${totalRevenue}`}
            icon={<FaEuroSign className="fill-accent text-2xl" />}
            subtext={t('stats_earnings_subtext')}
          />
          <StatsCard
            title={t('stats_total_referrals')}
            value={referralsCount}
            icon={<FaUsers className="fill-accent text-2xl" />}
            subtext={t('stats_referrals_subtext')}
          />
          <StatsCard
            title={t('stats_active_subscriptions')}
            value={activeSubscriptionsCount?.toString()}
            icon={<FaCalendarAlt className="fill-accent text-2xl" />}
            subtext={t('stats_subscriptions_subtext')}
          />
          <StatsCard
            title={t('stats_token_sales')}
            value={`€${tokenSaleRevenue + financedTokenRevenue}`}
            icon={<FaCoins className="fill-accent text-2xl" />}
            subtext={t('stats_tokens_subtext')}
          />
        </section>

        <Card>
          <Heading level={2} className="text-lg font-normal">
            {t('earnings_breakdown')}
          </Heading>
          <div>
            <p>
              {t('earnings_breakdown_stays')} (
              {affiliateConfig?.staysCommissionPercent}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{staysRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p>
              {t('earnings_breakdown_events')} (
              {affiliateConfig?.eventsCommissionPercent}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{eventsRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p>
              {t('earnings_breakdown_subscriptions')} (
              {affiliateConfig?.subscriptionCommissionPercent}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{subscriptionsRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p>
              {t('earnings_breakdown_token_sales')} (
              {affiliateConfig?.tokenSaleCommissionPercent}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{tokenSaleRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p>
              {t('earnings_breakdown_financed_token_sales')} (
              {affiliateConfig?.financedTokenSaleCommissionPercent}%{' '}
              {t('affiliate_commission')})
            </p>
            <p className="font-bold">€{financedTokenRevenue.toFixed(2)}</p>
          </div>
        </Card>
      </div>
    </>
  );
};

AffiliateDashboard.getInitialProps = async (context: NextPageContext) => {
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
    return {
      affiliateConfig: null,
      messages: null,
    };
  }
};

export default AffiliateDashboard;
