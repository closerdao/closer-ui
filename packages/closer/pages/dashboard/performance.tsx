import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../components/Dashboard/TimeFrameSelector';
import { Heading, Card } from '../../components/ui';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import useRBAC from '../../hooks/useRBAC';
import { BookingConfig, GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig;
  bookingConfig: BookingConfig;
  error?: string;
}

const PerformancePage = ({ generalConfig, bookingConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const { user } = useAuth();

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [hasRedirected, setHasRedirected] = useState(false);

  const router = useRouter();

  const { time_frame } = router.query;
  const [timeFrame, setTimeFrame] = useState<string>(
    time_frame?.toString() || 'month',
  );

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  useEffect(() => {
    if (isBookingEnabled) {
      router.push({
        pathname: '/dashboard/performance',
        query: { time_frame: timeFrame },
      });
    }
  }, [timeFrame]);

  useEffect(() => {
    if (time_frame) {
      setTimeFrame(time_frame.toString());
    }
  }, [router.query]);

  useEffect(() => {
    if (!hasRedirected && bookingConfig && !isBookingEnabled) {
      setHasRedirected(true);
      router.push('/admin/manage-users');
    }
  }, [bookingConfig, isBookingEnabled, hasRedirected]);

  const { hasAccess } = useRBAC();
  const hasAccessToPerformance = hasAccess('Performance');

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  if (!user || !hasAccessToPerformance) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('dashboard_performance_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="flex justify-between flex-col md:flex-row gap-4">
          <Heading level={2}>{t('dashboard_performance_title') || 'Performance'}</Heading>
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </div>

        <Card className="p-6">
          <Heading level={3}>Performance Metrics</Heading>
          <p className="mt-4">Performance metrics will be displayed here.</p>
        </Card>
      </AdminLayout>
    </>
  );
};

PerformancePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, bookingRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      generalConfig,
      bookingConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      bookingConfig: null,
      messages: null,
    };
  }
};

export default PerformancePage;
