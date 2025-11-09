import Head from 'next/head';

import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import Pagination from '../../../components/Pagination';
import IncomeChargesListing from '../../../components/expense-tracking/IncomeChargesListing';
import Heading from '../../../components/ui/Heading';

import { GeneralConfig } from 'closer/types/api';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { MAX_BOOKINGS_TO_FETCH } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { getDateRange } from '../../../utils/dashboard.helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';

const EXPENSES_PER_PAGE = 50;

const IncomeTrackingDashboardPage = ({
  generalConfig,
  messages,
}: {
  generalConfig: GeneralConfig | null;
  messages: any;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform }: any = usePlatform();
  const { TIME_ZONE } = useConfig();

  const expenseCategories = generalConfig?.expenseCategories?.split(',');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<string>('year');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const chargeFilter = {
    where: {
      type: 'outside-of-platform-income',
    },
    sort_by: '-created',
    limit: MAX_BOOKINGS_TO_FETCH,
  };

  const displayFilter =
    refreshKey > 0 ? { ...chargeFilter, _refresh: refreshKey } : chargeFilter;

  const chargesList = platform.charge.find(displayFilter);
  const allCharges = chargesList ? chargesList.toJS() : [];

  const { start, end } = getDateRange({
    timeFrame,
    fromDate,
    toDate,
    timeZone: TIME_ZONE,
  });

  const filteredCharges = allCharges
    .filter((charge: any) => {
      const chargeDate = new Date(charge.date || charge.created);
      return chargeDate >= start && chargeDate <= end;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.created).getTime();
      const dateB = new Date(b.date || b.created).getTime();
      return dateB - dateA;
    });

  const totalExpenses = filteredCharges.length;
  const startIndex = (currentPage - 1) * EXPENSES_PER_PAGE;
  const endIndex = startIndex + EXPENSES_PER_PAGE;
  const paginatedCharges = filteredCharges.slice(startIndex, endIndex);

  const loadData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      if (forceRefresh) {
        const refreshTimestamp = Date.now();
        const refreshFilter = { ...chargeFilter, _refresh: refreshTimestamp };
        await platform.charge.get(refreshFilter);
        setRefreshKey(refreshTimestamp);
      } else {
        await platform.charge.get(chargeFilter);
      }
    } catch (err) {
      console.error('Error loading income charges:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame, fromDate, toDate]);

  if (!user?.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('income_tracking_dashboard_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={true}>
        <div className="max-w-screen-lg flex flex-col gap-6">
          <div className="flex justify-between flex-col md:flex-row gap-4">
            <Heading level={1}>{t('income_tracking_dashboard_title')}</Heading>
            <TimeFrameSelector
              timeFrame={timeFrame}
              setTimeFrame={setTimeFrame}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>

          <IncomeChargesListing
            charges={paginatedCharges}
            onSuccess={() => loadData(true)}
          />

          {totalExpenses > EXPENSES_PER_PAGE && (
            <Pagination
              loadPage={handlePageChange}
              page={currentPage}
              limit={EXPENSES_PER_PAGE}
              total={totalExpenses}
            />
          )}
        </div>
      </AdminLayout>
    </>
  );
};

IncomeTrackingDashboardPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [generalConfigRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalConfigRes?.data?.results?.value;

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

export default IncomeTrackingDashboardPage;
