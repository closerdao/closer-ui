import Head from 'next/head';

import { useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TokenSalesDashboard from '../../../components/Dashboard/TokenSalesDashboard';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { usePlatform } from '../../../contexts/platform';
import { BookingConfig } from '../../../types/api';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

const SALES_PER_PAGE = 20;

const TokenSalesDashboardPage = ({
  bookingConfig,
}: {
  bookingConfig: BookingConfig;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform }: any = usePlatform();
  const [currentPage, setCurrentPage] = useState(1);
  const [, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('paid');
  const [refreshKey, setRefreshKey] = useState(0);

  const filterParams = useMemo(
    () => ({
      page: currentPage,
      limit: SALES_PER_PAGE,
      where: statusFilter === 'all' ? {} : { status: statusFilter },
      ...(refreshKey > 0 ? { _refresh: refreshKey } : {}),
    }),
    [currentPage, statusFilter, refreshKey],
  );

  const sales = platform?.sale?.find(filterParams);
  const totalSales = platform?.sale?.findCount(filterParams);

  const loadData = async (
    page: number = currentPage,
    filter: string = statusFilter,
  ) => {
    if (!platform) {
      return;
    }

    const params = {
      page,
      limit: SALES_PER_PAGE,
      where: filter === 'all' ? {} : { status: filter },
    };

    setIsLoading(true);
    try {
      await Promise.all([
        platform.sale?.get(params),
        platform.sale?.getCount(params),
      ]);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchSales = async (page: number = currentPage) => {
    if (!platform) {
      return;
    }
    if (page !== currentPage) {
      setCurrentPage(page);
      setRefreshKey(0);
      return;
    }

    const refreshTimestamp = Date.now();
    const params = {
      page: currentPage,
      limit: SALES_PER_PAGE,
      where: statusFilter === 'all' ? {} : { status: statusFilter },
      _refresh: refreshTimestamp,
    };
    setIsLoading(true);
    try {
      await Promise.all([
        platform.sale?.get(params),
        platform.sale?.getCount(params),
      ]);
      setRefreshKey(refreshTimestamp);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setRefreshKey(0);
    await loadData(1, filter);
  };

  // Load data on mount and when filterParams change
  useEffect(() => {
    loadData();
  }, [filterParams]);

  const salesWithBuyer = sales?.map((sale: any) => {
    const saleData = sale.toJS ? sale.toJS() : sale;
    return {
      ...saleData,
      buyer: null, // Will be enriched in the TokenSalesDashboard component
    };
  });

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  if (!user || !hasAccess('TokenSales')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('token_sales_dashboard_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('token_sales_dashboard_title')}</Heading>
        </div>

        <section className="mt-6">
          <TokenSalesDashboard
              sales={salesWithBuyer || []}
              onSuccess={() => refetchSales()}
              currentPage={currentPage}
              totalSales={totalSales}
              salesPerPage={SALES_PER_PAGE}
              onPageChange={refetchSales}
              statusFilter={statusFilter}
              onFilterChange={handleFilterChange}
              onRefetch={() => refetchSales()}
            />
        </section>
      </AdminLayout>
    </>
  );
};

TokenSalesDashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [bookingConfigRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const bookingConfig = bookingConfigRes?.data?.results?.value;

    return {
      bookingConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      bookingConfig: null,
      messages: null,
    };
  }
};

export default TokenSalesDashboardPage;
