import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import {
  PerformanceBlockId,
  getVisiblePerformanceBlockIds,
} from '../../../components/Dashboard/dashboardBlocks';
import { useDashboardFeatures } from '../../../components/Dashboard/useDashboardFeatures';
import { Heading } from '../../../components/ui';
import ApplicationsFunnel from './components/ApplicationsFunnel';
import StaysFunnel from './components/StaysFunnel';
import TokenSalesFunnel from './components/TokenSalesFunnel';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import PageNotAllowed from '../../../pages/401';
import CitizenshipFunnel from './components/CitizenshipFunnel';
import SubscriptionsFunnel from './components/SubscriptionsFunnel';

const PerformancePage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { features } = useDashboardFeatures();
  const router = useRouter();
  const { time_frame } = router.query;

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

  const visibleBlocks = getVisiblePerformanceBlockIds(
    features,
    user?.roles || [],
    hasAccess,
  );
  const isVisible = (id: PerformanceBlockId) => visibleBlocks.includes(id);

  if (!user || !hasAccess('Performance')) {
    return <PageNotAllowed />;
  }

  const funnelProps = { timeFrame, fromDate, toDate };

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

        {visibleBlocks.length === 0 ? (
          <p className="mt-6 text-gray-500">
            {t('dashboard_performance_no_funnels')}
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
            {isVisible('stays') && <StaysFunnel {...funnelProps} />}
            {isVisible('applications') && (
              <ApplicationsFunnel {...funnelProps} />
            )}
            {isVisible('tokenSales') && <TokenSalesFunnel {...funnelProps} />}
            {isVisible('subscriptions') && (
              <SubscriptionsFunnel {...funnelProps} />
            )}
            {isVisible('citizenship') && <CitizenshipFunnel {...funnelProps} />}
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default PerformancePage;
