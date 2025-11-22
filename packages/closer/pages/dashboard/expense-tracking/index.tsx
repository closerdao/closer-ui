import Head from 'next/head';

import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import Pagination from '../../../components/Pagination';
import {
  ExpenseChargesListing,
  ExpenseDialog,
} from '../../../components/expense-tracking';
import { Button } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { GeneralConfig } from 'closer/types/api';
import { Plus } from 'lucide-react';
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

const ExpenseTrackingDashboardPage = ({
  generalConfig,
  entitiesConfig,
}: {
    generalConfig: GeneralConfig | null;
  entitiesConfig: any;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform }: any = usePlatform();
  const { TIME_ZONE } = useConfig();


  
  const allEntities = entitiesConfig?.elements?.map((entity: any) => entity.entityName) || [];
  const uniqueEntities = [...new Set(allEntities)];

  const defaultEntity = entitiesConfig?.elements?.filter((entity: any) => entity.transactionType === 'expense')[0]?.entityName || '';
  console.log('=====uniqueEntities=', uniqueEntities);
  console.log('=====defaultEntity=', defaultEntity);

  const expenseCategories = generalConfig?.expenseCategories?.split(',');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<string>('month');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const chargeFilter = {
    where: {
      type: 'expense',
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

  const filteredCharges = allCharges.filter((charge: any) => {
    const chargeDate = new Date(charge.date || charge.created);
    return chargeDate >= start && chargeDate <= end;
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
      console.error('Error loading expense charges:', err);
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
        <title>{t('expense_tracking_dashboard_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={true}>
        <div className="max-w-screen-lg flex flex-col gap-6">
          <div className="flex justify-between flex-col md:flex-row gap-4">
            <Heading level={1}>{t('expense_tracking_dashboard_title')}</Heading>
            <TimeFrameSelector
              timeFrame={timeFrame}
              setTimeFrame={setTimeFrame}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>

          <div className="">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 w-fit"
            >
              <Plus className="w-4 h-4" />
              {t('expense_tracking_add_new_expense')}
            </Button>
          </div>

          <ExpenseChargesListing charges={paginatedCharges} />

          {totalExpenses > EXPENSES_PER_PAGE && (
            <Pagination
              loadPage={handlePageChange}
              page={currentPage}
              limit={EXPENSES_PER_PAGE}
              total={totalExpenses}
            />
          )}

          <ExpenseDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            expenseCategories={expenseCategories}
            onSuccess={() => loadData(true)}
            uniqueEntities={uniqueEntities as string[]}
            defaultEntity={defaultEntity}
          />
        </div>
      </AdminLayout>
    </>
  );
};

ExpenseTrackingDashboardPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [generalConfigRes, entitiesConfigRes,messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/accounting-entities').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalConfigRes?.data?.results?.value;
    const entitiesConfig = entitiesConfigRes?.data?.results?.value;

    return {
      generalConfig,
      entitiesConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      entitiesConfig: null,
      generalConfig: null,
      messages: null,
    };
  }
};

export default ExpenseTrackingDashboardPage;
