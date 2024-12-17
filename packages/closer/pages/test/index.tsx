import { useState, useEffect } from 'react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Heading, Card } from 'closer/components/ui';
import Tabs from 'closer/components/Tabs';
import { loadLocaleData } from '../../utils/locale.helpers';

import { usePlatform } from '../../contexts/platform';
import { useAuth } from '../../contexts/auth';
import PageNotAllowed from '../401';


const PLATFORM_NAME = "testing";

const StatsCard = ({ title, value, icon, subtext }) => {
  return (
    <Card className="col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          <p className="text-2xl font-semibold mt-1">{subtext}</p>
          {/* {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.value}%</span>
              <span className="ml-1">{trend.label}</span>
            </div>
          )} */}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

const Euro =  <span className="text-2xl">🤝1</span>;
const Users = <span className="text-2xl">🤝2</span>;
const Calendar = <span className="text-2xl">🤝3</span>;
const Coins = <span className="text-2xl">🤝4</span>;

const AffiliateDashboard = () => {
  const t  = useTranslations();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState({
    totalEarnings: 111,
    totalReferrals: 222,
    activeSubscriptions: 333,
    tokensSold: 444,
    conversionRate: 555
  });


  const loadData = async () => {
    console.log("loadData, userFilter", userFilter);
    try {
      await Promise.all([
        platform.user.getCount(userFilter),
      ]);
    } catch (err) {
    } finally {
    }
  };

  const { user, isAuthenticated }: any = useAuth();

  const userFilter = { where: { referredBy: user?.id } };

  useEffect(() => {
    console.log("useEffect, isAuthenticated", isAuthenticated);
    console.log("useEffect, userFilter", userFilter);
    if (userFilter) {
      loadData();
    }
  }, [user, isAuthenticated]);


  const { platform }: any = usePlatform();

  const totalReferrals = platform.booking.findCount(userFilter);

  console.log("******** Total referrals: ", totalReferrals);

  if (!user) {
    return <PageNotAllowed />;
  }

  


  const tabs = [
    { value: 'overview', title: t('Overview'), content: <div>Overview</div> },
    { value: 'revenue', title: t('Revenue Tracking'), content: <div>Revenue</div> },
    { value: 'tokens', title: t('Token Sales'), content: <div>Token Sales</div> },
    { value: 'analytics', title: t('Referral Analytics'), content: <div>Analytics</div> },
  ];

  return (
    <>
      <Head>
        <title>{`${t('Affiliate Dashboard')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        


        <div className="flex justify-between items-center mb-8">
          <Heading level={1}>🤝 {t('Affiliate Dashboard')}</Heading>

          <h1>Total referrals: { JSON.stringify(totalReferrals) } { totalReferrals }</h1>

          <div className="flex gap-4">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border-gray-300"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6" >
            <StatsCard
              title={t('stats_total_earnings')}
              value={`€${metrics.totalEarnings}`}
              icon={Euro}
              subtext={t('stats_earnings_subtext')}
            />
            <StatsCard
              title={t('stats_total_referrals')}
              value={metrics.totalReferrals}
              icon={Users}
              subtext={t('stats_referrals_subtext')}
            />
            <StatsCard
              title={t('stats_active_subscriptions')}
              value={metrics.activeSubscriptions}
              icon={Calendar}
              subtext={t('stats_subscriptions_subtext')}
            />
            <StatsCard
              title={t('stats_token_sales')}
              value={`${metrics.tokensSold} TDF`}
              icon={Coins}
              subtext={t('stats_tokens_subtext')}
            />
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab.value)} />

        Active tab = {JSON.stringify(activeTab)}

        {activeTab === 'overview' && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-lg shadow p-6">
              <Heading level={3}>Revenue Distribution</Heading>
              {/* <Chart 
                type="pie"
                data={{
                  labels: ['Subscriptions', 'Stays', 'Events', 'Tokens'],
                  datasets: [{
                    data: [45, 25, 20, 10]
                  }]
                }}
              /> */}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <Heading level={3}>Monthly Performance</Heading>
              {/* <Chart
                type="line"
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Earnings',
                    data: [30, 45, 35, 50, 40, 60]
                  }]
                }}
              /> */}
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
            <Heading level={3}>Tokens tab</Heading>
              {/* <Table
                columns={[
                  { header: 'Date', accessor: 'date' },
                  { header: 'Tokens Sold', accessor: 'tokens' },
                  { header: 'Sale Value', accessor: 'value' },
                  { header: 'Commission', accessor: 'commission' },
                  { header: 'Status', accessor: 'status' }
                ]}
                data={[]}
              /> */}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

AffiliateDashboard.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default AffiliateDashboard;
