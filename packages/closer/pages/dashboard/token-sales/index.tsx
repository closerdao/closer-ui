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
  const { platform }: any = usePlatform();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('paid');

  // Platform data with filter - use useMemo to recalculate when page or filter changes
  const filterParams = useMemo(
    () => ({
      page: currentPage,
      limit: SALES_PER_PAGE,
      where: statusFilter === 'all' ? {} : { status: statusFilter },
    }),
    [currentPage, statusFilter],
  );

  const sales = platform?.sale?.find(filterParams);
  const totalSales = platform?.sale?.findCount(filterParams); // Use filtered count for pagination
  const loading = platform?.sale?.areLoading(filterParams);

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
        platform.sale?.getCount(params), // Use filtered count for pagination
      ]);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchSales = async (page: number = currentPage) => {

    await loadData(page, statusFilter);
    console.log('refetchSales completed');
  };

  const handleFilterChange = async (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1); // Reset to page 1 when filter changes
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

  if (!user?.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('token_sales_dashboard_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="max-w-screen-lg flex flex-col gap-6">
          <Heading level={1}>
            {t('token_sales_dashboard_title')}
            {/* {t('dashboard_affiliate_title')} */}
          </Heading>

          <section>
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
        </div>
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
