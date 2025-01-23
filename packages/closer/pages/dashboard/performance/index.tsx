import Head from 'next/head';

import { useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import { Heading } from '../../../components/ui';
import Select from '../../../components/ui/Select/Dropdown';
import StaysFunnel from './components/StaysFunnel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../../contexts/auth';
import PageNotAllowed from '../../../pages/401';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import {
  DateRange,
  DATE_RANGES,
} from '../../../utils/performance.utils';
import TokenSalesFunnel from './components/TokenSalesFunnell';
import SubscriptionsFunnel from './components/SubscriptionsFunnel';

const PerformancePage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  console.log('user=====', user);

  const [dateRange, setDateRange] = useState<DateRange>(
    DATE_RANGES.find((range: DateRange) => range.value === 'all') ||
      DATE_RANGES[0],
  );

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
          <div className="flex justify-between items-center mb-8 w-full">
            <Heading level={1}>{t('dashboard_performance_title')}</Heading>
            <div className="flex gap-2 flex-col sm:flex-row items-start sm:items-center">
            <p className="whitespace-nowrap text-sm">
              {t('dashboard_performance_token_sales_funnel_select_timeframe')}
            </p>
            <Select
              id="dateRangeOptions"
              value={dateRange.value}
              options={DATE_RANGES.map((range) => ({
                value: range.value,
                label: range.label,
              }))}
              className="rounded-full border-black w-[170px] text-sm py-0.5"
              onChange={(value) => {
                const newRange = DATE_RANGES.find((r) => r.value === value);
                if (newRange) setDateRange(newRange);
              }}
              isRequired
            />
          </div>
          </div>

          <section className='flex gap-4'>
            <StaysFunnel dateRange={dateRange} />
            <TokenSalesFunnel dateRange={dateRange} />
            <SubscriptionsFunnel dateRange={dateRange} />
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
