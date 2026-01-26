import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import { Heading } from '../../../components/ui';
import StaysFunnel from './components/StaysFunnel';
import TokenSalesFunnel from './components/TokenSalesFunnel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import PageNotAllowed from '../../../pages/401';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import SubscriptionsFunnel from './components/SubscriptionsFunnel';
import CitizenshipFunnel from './components/CitizenshipFunnel';
import { BookingConfig } from '../../../types/api';

const PerformancePage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
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
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="min-h-screen bg-gray-50">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <Heading level={1} className="text-2xl font-bold text-gray-900">
                    {t('dashboard_performance_title')}
                  </Heading>
                  <p className="mt-1 text-sm text-gray-500">
                    Track user engagement and conversion metrics across all platforms
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <TimeFrameSelector
                    timeFrame={timeFrame}
                    setTimeFrame={handleTimeFrameChange}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
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
          </div>
        </div>
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
