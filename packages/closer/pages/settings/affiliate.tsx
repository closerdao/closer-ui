import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import StatsCard from '../../components/Affiliate';
import TimeFrameSelector from '../../components/Dashboard/TimeFrameSelector';
import PercentageBar from '../../components/PercentageBar';
import RevenueIcon from '../../components/icons/RevenueIcon';
import { Card, Heading, LinkButton } from 'closer/components/ui';

import { FaLink } from '@react-icons/all-files/fa/FaLink';
import { AffiliateConfig, PageNotFound, api, usePlatform } from 'closer';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { User } from '../../contexts/auth/types';
import { useConfig } from '../../hooks/useConfig';
import { calculateAffiliateRevenue } from '../../utils/affiliate.utils';
import { loadLocaleData } from '../../utils/locale.helpers';
import { getStartAndEndDate } from '../../utils/performance.utils';

const AffiliatePage = ({
  affiliateConfig,
}: {
  affiliateConfig: AffiliateConfig;
}) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const config = useConfig();
  const { SEMANTIC_URL } = config || {};

  const [copied, setCopied] = useState<null | number>(null);
  const router = useRouter();
  const { time_frame } = router.query;

  const [timeFrame, setTimeFrame] = useState<string>(
    time_frame?.toString() || 'allTime',
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
      payoutsFilter: {
        where: {
          type: 'affiliatePayout',
        },
      },
    }),
    [user?._id, timeFrame, startDate, endDate],
  );

  useEffect(() => {
    if (user && platform) {
      loadData();
    }
  }, [filters, user, platform]);

  const referralLink = `${SEMANTIC_URL}?referral=${user?._id}`;
  const tokenFlowLink = `${SEMANTIC_URL}/token?referral=${user?._id}`;
  const subscriptionsFlowLink = `${SEMANTIC_URL}/subscriptions?referral=${user?._id}`;
  const staysFlowLink = `${SEMANTIC_URL}/stay?referral=${user?._id}`;

  const referralsCount =
    platform?.user?.findCount?.(filters.referralsFilter) || 0;
  const referrals =
    platform?.user?.find?.(filters.referralsFilter)?.toJS?.() || [];
  const referralCharges =
    platform?.charge?.find?.(filters.referralChargesFilter)?.toJS?.() || [];

  const payoutCharges =
    platform?.charge?.find?.(filters.payoutsFilter)?.toJS?.() || [];
  const userPayoutCharges = payoutCharges?.filter(
    (charge: any) => charge.meta.affiliateId === user?._id,
  );

  const totalPayoutCharges = userPayoutCharges?.reduce(
    (acc: number, charge: any) => acc + charge.amount.total.val,
    0,
  );
  const activeSubscriptionsCount =
    referrals?.filter(
      (user: User) =>
        user.subscription && JSON.stringify(user.subscription) !== '{}',
    )?.length || 0;

  const {
    totalRevenue,
    subscriptionsRevenue,
    staysRevenue,
    eventsRevenue,
    tokenSaleRevenue,
    financedTokenRevenue,
  } = calculateAffiliateRevenue(referralCharges);

  const copyToClipboard = (link: string, index:number) => {
    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(index);
        setTimeout(() => {
          setCopied(null);
        }, 2000);
      },
      (err) => {
        console.log('failed to copy', err.mesage);
      },
    );
  };

  const loadData = async () => {
    if (!platform) return;

    await Promise.all([
      platform.user.getCount(filters.referralsFilter),
      platform.user.get(filters.referralsFilter),
      platform.charge.get(filters.referralChargesFilter),
      platform.charge.get(filters.payoutsFilter),
    ]);
  };

  if (process.env.NEXT_PUBLIC_FEATURE_AFFILIATE !== 'true') {
    return <PageNotFound />;
  }

  if (!user || !user?.affiliate) {
    return <PageNotAllowed />;
  }

  // Add loading state check
  if (!platform) {
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
          <div className="flex gap-4 flex-col sm:flex-row items-start sm:items-center">
            <Heading level={3} className="text-sm font-bold uppercase">
              {t('affiliate_link')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {referralLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied === 0 ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(referralLink, 0)}>
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
            <Heading level={3} className="text-sm font-bold uppercase">
              {t('affiliate_token_flow')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {tokenFlowLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied === 1 ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(tokenFlowLink, 1)}>
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
            <Heading level={3} className="text-sm font-bold uppercase">
              {t('affiliate_subscriptions_flow')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {subscriptionsFlowLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied === 2 ? t('referrals_link_copied') : ''}
                </div>
                  <button onClick={() => copyToClipboard(subscriptionsFlowLink, 2)}>
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
            <Heading level={3} className="text-sm font-bold uppercase">
              {t('affiliate_stays_flow')}
            </Heading>
            <Card className=" flex-1 py-1.5">
              <div className="flex justify-between flex-col gap-1 sm:flex-row items-start sm:items-center">
                <div className="w-2/3 sm:w-4/5 break-words select-all text-sm ">
                  {staysFlowLink}
                </div>
                <div className="w-1/5 text-sm ">
                  {copied === 3 ? t('referrals_link_copied') : ''}
                </div>
                <button onClick={() => copyToClipboard(staysFlowLink, 3)}>
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
          <Card className=" rounded-md bg-accent-light">
            <LinkButton
              target="_blank"
              className=" px-4  w-fit"
              href="https://drive.google.com/drive/folders/11i6UBGqEyC8aw0ufJybnbjueSpE3s8f-"
            >
              {t('dashboard_affiliate_promo_materials')}
            </LinkButton>
          </Card>
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
              value={`€${totalRevenue}`}
              isAccent={true}
              subtext={t('stats_earnings_subtext')}
            />
            <StatsCard
              title={t('stats_unpaid_earnings')}
              value={`€${totalRevenue - totalPayoutCharges}`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatsCard
              title={t('stats_total_referrals')}
              value={referralsCount}
              subtext={t('stats_referrals_subtext')}
            />
            <StatsCard
              title={t('stats_active_subscriptions')}
              value={activeSubscriptionsCount?.toString()}
              subtext={t('stats_subscriptions_subtext')}
            />
            <StatsCard
              title={t('stats_token_sales')}
              value={`€${tokenSaleRevenue + financedTokenRevenue}`}
              subtext={t('stats_tokens_subtext')}
            />
          </div>
        </section>

        <Card className="space-y-4">
          <Heading level={2} className="text-lg font-normal">
            {t('earnings_breakdown')}
          </Heading>
          <div className="space-y-1">
            <p>
              {t('earnings_breakdown_stays')} (
              {affiliateConfig?.staysCommissionPercent}%{' '}
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
              {affiliateConfig?.eventsCommissionPercent}%{' '}
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
              {affiliateConfig?.subscriptionCommissionPercent}%{' '}
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
              {affiliateConfig?.tokenSaleCommissionPercent}%{' '}
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
              {affiliateConfig?.financedTokenSaleCommissionPercent}%{' '}
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
                    <p>{payout.created.slice(0, 10)}</p>
                    <p className="text-right">
                      €{payout.amount.total.val.toLocaleString()}
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
    return {
      affiliateConfig: null,
      messages: null,
    };
  }
};

export default AffiliatePage;
