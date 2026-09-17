import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import DashboardActions from '../../components/Dashboard/DashboardActions';
import DashboardPageHeader from '../../components/Dashboard/DashboardPageHeader';
import DashboardStats from '../../components/Dashboard/DashboardStats';
import RevenueTimeFrameSelector from '../../components/Dashboard/RevenueTimeFrameSelector';
import {
  DashboardBlockId,
  getVisibleDashboardBlockIds,
} from '../../components/Dashboard/dashboardBlocks';
import { useDashboardFeatures } from '../../components/Dashboard/useDashboardFeatures';
import FirstStepsBanner from '../../components/FirstSteps/FirstStepsBanner';
import { Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useFirstStepsStatus } from '../../hooks/useFirstStepsStatus';
import useRBAC from '../../hooks/useRBAC';
import { GeneralConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import PageNotFound from '../not-found';

const DashboardBookings = dynamic(
  () => import('../../components/Dashboard/DashboardBookings'),
  { ssr: false, loading: () => <Spinner /> },
);
const DashboardRevenue = dynamic(
  () => import('../../components/Dashboard/DashboardRevenue'),
  { ssr: false, loading: () => <Spinner /> },
);
const DashboardSubscriptions = dynamic(
  () => import('../../components/Dashboard/DashboardSubscriptions'),
  { ssr: false, loading: () => <Spinner /> },
);

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

  /**
   * Setup handholding for an admin who has not finished it.
   *
   * Only an admin who can reach the wizard pays for these reads, and the
   * automatic redirect fires at most once ever: the flag is written before
   * navigating, so somebody who wants to skip ahead is never sent back. The
   * banner and the nav link stay as the way in afterwards.
   */
  const canSeeFirstSteps = hasAccess('FirstSteps');
  const firstSteps = useFirstStepsStatus(canSeeFirstSteps);
  const isSetupIncomplete =
    canSeeFirstSteps && firstSteps.isLoaded && !firstSteps.progress.isComplete;

  const {
    userState: firstStepsUserState,
    persistUserState: persistFirstSteps,
  } = firstSteps;
  // Writing the flag is asynchronous, so a ref rather than the flag itself
  // stops a second render slipping through and redirecting twice.
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (
      !isSetupIncomplete ||
      firstStepsUserState.hasBeenRedirected ||
      hasRedirectedRef.current
    ) {
      return;
    }
    hasRedirectedRef.current = true;
    persistFirstSteps({ ...firstStepsUserState, hasBeenRedirected: true });
    router.replace('/first-steps');
  }, [isSetupIncomplete, firstStepsUserState, persistFirstSteps, router]);

  const visibleBlocks = getVisibleDashboardBlockIds(
    features,
    user?.roles || [],
    hasAccess,
  );
  const isVisible = (id: DashboardBlockId) => visibleBlocks.includes(id);

  const PLATFORM_NAME = generalConfig?.platformName || config.platformName;

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
        {isSetupIncomplete && !firstSteps.userState.hasDismissedBanner && (
          <FirstStepsBanner
            doneCount={firstSteps.progress.doneCount}
            total={firstSteps.progress.total}
            onDismiss={() =>
              firstSteps.persistUserState({
                ...firstSteps.userState,
                hasDismissedBanner: true,
              })
            }
          />
        )}

        <DashboardPageHeader title={t('dashboard_title')}>
          <RevenueTimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={handleTimeFrameChange}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </DashboardPageHeader>

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
