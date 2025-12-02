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
import { useConfig } from '../../hooks/useConfig';
import { calculateAffiliateRevenue } from '../../utils/affiliate.utils';
import { loadLocaleData } from '../../utils/locale.helpers';
import { getStartAndEndDate } from '../../utils/performance.utils';

const AmbassadorSettingsPage = ({
  affiliateConfig,
}: {
  affiliateConfig: AffiliateConfig;
}) => {
  const t = useTranslations();
  const { platform }: any = usePlatform() || {};
  const { user } = useAuth() || {};
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  const handleTimeFrameChange = (
    value: string | ((prevState: string) => string),
  ) => {
    const newTimeFrame = typeof value === 'function' ? value(timeFrame) : value;
    setTimeFrame(newTimeFrame);

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

  useEffect(() => {
    if (user && platform) {
      loadData();
    }
  }, [user, platform]);

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

  const copyToClipboard = (link: string, index: number) => {
    if (!navigator?.clipboard) {
      console.error('Clipboard API not available');
      return;
    }

    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(index);
        setTimeout(() => {
          setCopied(null);
        }, 2000);
      },
      (err) => {
        console.error('Failed to copy', err?.message || 'Unknown error');
      },
    );
  };

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
      console.error('Error loading ambassador data:', error);
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

  if (!platform || (!dataLoaded && isLoading)) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Ambassador Dashboard</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <section className="flex gap-8 justify-between items-start sm:items-center flex-col sm:flex-row">
          <Heading level={1}>🤝 Ambassador Dashboard</Heading>
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
            Your ambassador links
          </Heading>
          
          <LinkBuilderTool
            userId={user?._id || ''}
            onLinkGenerated={(link) => {
              api.post('/metric', {
                event: 'ambassador-link-generated',
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
                Ambassador promotional materials
              </LinkButton>

              <LinkButton
                className=" px-4  w-fit"
                href="/ambassador"
              >
                📋 Program Rules & FAQ
              </LinkButton>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <Heading
            level={2}
            className="text-lg flex gap-2 items-center uppercase"
          >
            <RevenueIcon /> Earnings
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              title={'Total Earnings'}
              value={`€${totalRevenue.toFixed(2)}`}
              isAccent={true}
              subtext={'Selected period earnings'}
            />
            <StatsCard
              title={'Unpaid Earnings'}
              value={`€${(totalRevenue - totalPayoutCharges).toFixed(2)}`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title={'Total Referrals'}
              value={referralsCount}
              subtext={'Referred users'}
            />
            <StatsCard
              title={'Link Clicks'}
              value={trafficCount}
              subtext={'Total clicks on your referral links'}
            />
            <StatsCard
              title={'Active subscriptions'}
              value={activeSubscriptionsCount?.toString()}
              subtext={'Monthly recurring'}
            />
            <StatsCard
              title={'Token sales'}
              value={`€${(tokenSaleRevenue + financedTokenRevenue).toFixed(2)}`}
              subtext={'Token sale amount in EUR'}
            />
          </div>
        </section>

        <Card className="space-y-4">
          <Heading level={2} className="text-lg font-normal">
            Earnings breakdown
          </Heading>
          <div className="space-y-1">
            <p>
              Stays earnings ({affiliateConfig?.staysCommissionPercent || 0}% commission)
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
              Events earnings ({affiliateConfig?.eventsCommissionPercent || 0}% commission)
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
              Subscriptions earnings ({affiliateConfig?.subscriptionCommissionPercent || 0}% commission)
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
              Token sales earnings ({affiliateConfig?.tokenSaleCommissionPercent || 0}% commission)
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
              Financed token sales earnings ({affiliateConfig?.financedTokenSaleCommissionPercent || 0}% commission)
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
                Payouts
              </Heading>
              <div>
                <div className="grid grid-cols-2 gap-2 border-b py-1">
                  <p>Date</p>
                  <p className="text-right">
                    Amount
                  </p>
                </div>
                {userPayoutCharges?.map((charge: any) => (
                  <div key={charge?._id} className="grid grid-cols-2 gap-2 py-1">
                    <p>
                      {new Date(charge?.created).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </p>
                    <p className="text-right">€{charge?.amount?.total?.val?.toFixed?.(2)}</p>
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

AmbassadorSettingsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );

    return {
      messages,
      affiliateConfig: {
        staysCommissionPercent: 10,
        eventsCommissionPercent: 10,
        subscriptionCommissionPercent: 30,
        tokenSaleCommissionPercent: 3,
        financedTokenSaleCommissionPercent: 3,
      },
    };
  } catch (err: unknown) {
    return {
      messages: null,
      affiliateConfig: null,
    };
  }
};

export default AmbassadorSettingsPage;


