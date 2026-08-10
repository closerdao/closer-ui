import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import DashboardActions from '../../components/Dashboard/DashboardActions';
import DashboardStats from '../../components/Dashboard/DashboardStats';
import RevenueTimeFrameSelector from '../../components/Dashboard/RevenueTimeFrameSelector';
import {
  DashboardBlockId,
  getVisibleDashboardBlockIds,
} from '../../components/Dashboard/dashboardBlocks';
import { useDashboardFeatures } from '../../components/Dashboard/useDashboardFeatures';
import { Heading, Spinner } from '../../components/ui';

const DashboardBookings = dynamic(
  () => import('../../components/Dashboard/DashboardBookings'),
  { ssr: false, loading: () => <Spinner /> }
);
const DashboardRevenue = dynamic(
  () => import('../../components/Dashboard/DashboardRevenue'),
  { ssr: false, loading: () => <Spinner /> }
);
const DashboardSubscriptions = dynamic(
  () => import('../../components/Dashboard/DashboardSubscriptions'),
  { ssr: false, loading: () => <Spinner /> }
);
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import useRBAC from '../../hooks/useRBAC';
import { GeneralConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import PageNotFound from '../not-found';

const DashboardPage = () => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const { features, config } = useDashboardFeatures();
  const { user } = useAuth();

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const router = useRouter();

  const { time_frame } = router.query;
  const [timeFrame, setTimeFrame] = useState<string>(
    time_frame?.toString() || 'currentMonth',
  );

  const handleTimeFrameChange = (
    value: string | ((prevState: string) => string),
  ) => {
    const newTimeFrame = typeof value === 'function' ? value(timeFrame) : value;
    setTimeFrame(newTimeFrame);

    router.replace(
      {
        pathname: '/dashboard',
        query: { time_frame: newTimeFrame },
      },
      undefined,
      { shallow: true },
    );
  };

  useEffect(() => {
    if (time_frame) {
      setTimeFrame(time_frame.toString());
    }
  }, [router.query]);

  const { hasAccess } = useRBAC();
  const hasAccessToDashboard = hasAccess('Dashboard');

  const visibleBlocks = getVisibleDashboardBlockIds(
    features,
    user?.roles || [],
    hasAccess,
  );
  const isVisible = (id: DashboardBlockId) => visibleBlocks.includes(id);

  const PLATFORM_NAME =
    generalConfig?.platformName || config.platformName;

  if (!user || !hasAccessToDashboard) {
    return <PageNotFound error="User may not access" />;
  }

  const timeFrameProps = { timeFrame, fromDate, toDate };

  return (
    <>
      <Head>
        <title>{`${t('dashboard_title')} - ${PLATFORM_NAME}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('dashboard_title')}</Heading>
          <RevenueTimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={handleTimeFrameChange}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </div>

        {isVisible('stats') && <DashboardStats {...timeFrameProps} />}
        {isVisible('bookings') && <DashboardBookings {...timeFrameProps} />}
        {isVisible('revenue') && <DashboardRevenue {...timeFrameProps} />}
        {isVisible('subscriptions') && (
          <DashboardSubscriptions {...timeFrameProps} />
        )}
        {isVisible('actions') && <DashboardActions />}
      </AdminLayout>
    </>
  );
};

export default DashboardPage;
