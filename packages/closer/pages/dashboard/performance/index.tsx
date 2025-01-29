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
import PageNotAllowed from '../../../pages/401';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import SubscriptionsFunnel from './components/SubscriptionsFunnel';

const PerformancePage = () => {
  const t = useTranslations();
  const { user } = useAuth();
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

  if (!user?.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard_performance_title')}</title>
      </Head>
      <AdminLayout>
        <div className="max-w-screen-lg  px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start md:items-center gap-4 mb-8 w-full flex-col md:flex-row">
            <Heading level={1}>{t('dashboard_performance_title')}</Heading>
            <div className="flex gap-2 flex-col sm:flex-row items-start sm:items-center ">
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

          <section className="flex gap-4 w-full flex-col md:flex-row">
            <StaysFunnel
              timeFrame={timeFrame}
              fromDate={fromDate}
              toDate={toDate}
            />
            <TokenSalesFunnel
              timeFrame={timeFrame}
              fromDate={fromDate}
              toDate={toDate}
            />
            <SubscriptionsFunnel
              timeFrame={timeFrame}
              fromDate={fromDate}
              toDate={toDate}
            />
          </section>
        </div>
      </AdminLayout>
    </>
  );
};

PerformancePage.getInitialProps = async (context: NextPageContext) => {
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

export default PerformancePage;
