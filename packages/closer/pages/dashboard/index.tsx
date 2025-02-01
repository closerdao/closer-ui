import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import DashboardBookings from '../../components/Dashboard/DashboardBookings';
import DashboardMetrics from '../../components/Dashboard/DashboardMetrics';
import DashboardRevenue from '../../components/Dashboard/DashboardRevenue';
import DashboardSubscriptions from '../../components/Dashboard/DashboardSubscriptions';
import TimeFrameSelector from '../../components/Dashboard/TimeFrameSelector';
import { Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig;
  error?: string;
}

const DashboardPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const { user } = useAuth();

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const router = useRouter();

  const { time_frame } = router.query;
  const [timeFrame, setTimeFrame] = useState<string>(
    time_frame?.toString() || 'month',
  );

  useEffect(() => {
    router.push({
      pathname: '/dashboard',
      query: { time_frame: timeFrame },
    });
  }, [timeFrame]);

  useEffect(() => {
    if (time_frame) {
      setTimeFrame(time_frame.toString());
    }
  }, [router.query]);

  const isAdmin = user?.roles.includes('admin');

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  if (!user || !isAdmin) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('dashboard_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <AdminLayout>
        <div className="flex justify-between flex-col md:flex-row gap-4">
          <Heading level={2}>{t('dashboard_title')}</Heading>
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </div>

        <DashboardBookings
          timeFrame={timeFrame}
          fromDate={fromDate}
          toDate={toDate}
        />
        <DashboardRevenue
          timeFrame={timeFrame}
          fromDate={fromDate}
          toDate={toDate}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardMetrics
            timeFrame={timeFrame}
            fromDate={fromDate}
            toDate={toDate}
          />

          <DashboardSubscriptions
            timeFrame={timeFrame}
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      </AdminLayout>
    </>
  );
};

DashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      messages: null,
    };
  }
};

export default DashboardPage;
