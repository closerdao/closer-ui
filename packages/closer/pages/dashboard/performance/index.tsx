import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import { Heading } from '../../../components/ui';
import StaysFunnel from './components/StaysFunnel';
import TokenSalesFunnel from './components/TokenSalesFunnel';

import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import PageNotAllowed from '../../../pages/401';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import SubscriptionsFunnel from './components/SubscriptionsFunnel';
import CitizenshipFunnel from './components/CitizenshipFunnel';
import { BookingConfig } from '../../../types/api';

const PerformancePage = () => {
  const bookingConfig = getCachedConfig('booking') as BookingConfig | null;
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const router = useRouter();
  const { time_frame } = router.query;

  const isTokenEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const areSubscriptionsEnabled = process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const isCitizenshipEnabled = process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';

  const isBookingEnabled =
  bookingConfig?.enabled &&
  process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [timeFrame, setTimeFrame] = useState<string>(() =>
    typeof time_frame === 'string' ? time_frame : 'month',
  );
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    const urlTimeFrame = typeof time_frame === 'string' ? time_frame : 'month';
    if (!router.isReady) return;

    if (router.isReady && urlTimeFrame !== timeFrame) {
      setTimeFrame(urlTimeFrame);
    }
  }, [router.isReady, time_frame]);

  const handleTimeFrameChange = (
    value: string | ((prevState: string) => string),
  ) => {
    const newTimeFrame = typeof value === 'function' ? value(timeFrame) : value;
    setTimeFrame(newTimeFrame);

    window.history.replaceState(
      {},
      '',
      `/dashboard/performance?time_frame=${newTimeFrame}`,
    );
  };

  if (!user || !hasAccess('Performance')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard_performance_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('dashboard_performance_title')}</Heading>
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={handleTimeFrameChange}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
          <StaysFunnel
            timeFrame={timeFrame}
            fromDate={fromDate}
            toDate={toDate}
          />
          {isTokenEnabled && (
            <TokenSalesFunnel
              timeFrame={timeFrame}
              fromDate={fromDate}
              toDate={toDate}
            />
          )}
          {areSubscriptionsEnabled && (
            <SubscriptionsFunnel
              timeFrame={timeFrame}
              fromDate={fromDate}
              toDate={toDate}
            />
          )}
          {isCitizenshipEnabled && (
            <CitizenshipFunnel
              timeFrame={timeFrame}
              fromDate={fromDate}
              toDate={toDate}
            />
          )}
        </div>
      </AdminLayout>
    </>
  );
};

export default PerformancePage;
