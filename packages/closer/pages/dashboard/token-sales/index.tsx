import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TokenSalesDashboard from '../../../components/Dashboard/TokenSalesDashboard';
import { Card } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import { Badge } from '../../../components/ui/badge';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import useRBAC from '../../../hooks/useRBAC';
import { BookingConfig } from '../../../types/api';
import { FinanceApplication } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { formatIsoFiatAmount } from '../../../utils/currencyFormat';

const SALES_PER_PAGE = 20;
const FINANCED_PER_PAGE = 20;

const getScheduleEntries = (
  paymentsScheduled: FinanceApplication['paymentsScheduled'],
) => {
  return Object.entries(paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      ...value,
      paymentDate: value.paymentDate ? new Date(value.paymentDate) : null,
    }));
};

const getFinancedCurrentStatus = (application: FinanceApplication) => {
  const schedule = getScheduleEntries(application.paymentsScheduled);
  const now = new Date();
  const hasOverduePending = schedule.some(
    (item) =>
      item.status === 'pending' && item.paymentDate && item.paymentDate < now,
  );
  if (hasOverduePending) {
    return 'delinquent';
  }
  if (
    schedule.length > 0 &&
    schedule.some((item) => item.status === 'pending')
  ) {
    return 'up-to-date';
  }
  return application.status || 'pending';
};

const getNextPaymentDueDate = (application: FinanceApplication) => {
  const schedule = getScheduleEntries(application.paymentsScheduled);
  const now = new Date();
  const pendingSorted = schedule.filter(
    (item) => item.status === 'pending' && item.paymentDate,
  );
  const nextFuture = pendingSorted.find(
    (item) => item.paymentDate && item.paymentDate >= now,
  );
  return nextFuture?.paymentDate || pendingSorted[0]?.paymentDate || null;
};

const formatDate = (date: Date | null) => {
  if (!date) {
    return '-';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FinancedStatusBadge = ({ status }: { status: string }) => {
  const variantMap: Record<string, 'secondary' | 'destructive' | 'default'> = {
    delinquent: 'destructive',
    'up-to-date': 'default',
    paid: 'default',
    completed: 'default',
    cancelled: 'destructive',
    pending: 'secondary',
    'pending-payment': 'secondary',
  };
  return (
    <Badge variant={variantMap[status] || 'secondary'}>
      {status.replace('-', ' ')}
    </Badge>
  );
};

const TokenSalesDashboardPage = ({
  bookingConfig,
}: {
  bookingConfig: BookingConfig;
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform }: any = usePlatform();
  const [activeTab, setActiveTab] = useState<'financed' | 'regular'>(
    'financed',
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [financedPage, setFinancedPage] = useState(1);
  const [, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('paid');
  const [financedStatusFilter, setFinancedStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const saleFilterParams = useMemo(
    () => ({
      page: currentPage,
      limit: SALES_PER_PAGE,
      where: statusFilter === 'all' ? {} : { status: statusFilter },
      ...(refreshKey > 0 ? { _refresh: refreshKey } : {}),
    }),
    [currentPage, statusFilter, refreshKey],
  );
  const financedFilterParams = useMemo(
    () => ({
      page: financedPage,
      limit: FINANCED_PER_PAGE,
      where:
        financedStatusFilter === 'all' ? {} : { status: financedStatusFilter },
      ...(refreshKey > 0 ? { _refresh: refreshKey } : {}),
    }),
    [financedPage, financedStatusFilter, refreshKey],
  );

  const sales = platform?.sale?.find(saleFilterParams);
  const totalSales = platform?.sale?.findCount(saleFilterParams);
  const financeApplications =
    platform?.financeapplication?.find(financedFilterParams);
  const totalFinanceApplications =
    platform?.financeapplication?.findCount(financedFilterParams);

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
        platform.sale?.get(params, { force: true }),
        platform.sale?.getCount(params, { force: true }),
      ]);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFinancedData = async (
    page: number = financedPage,
    filter: string = financedStatusFilter,
  ) => {
    if (!platform) {
      return;
    }
    const params = {
      page,
      limit: FINANCED_PER_PAGE,
      where: filter === 'all' ? {} : { status: filter },
    };
    setIsLoading(true);
    try {
      await Promise.all([
        platform.financeapplication?.get(params, { force: true }),
        platform.financeapplication?.getCount(params, { force: true }),
      ]);
      setFinancedPage(page);
    } catch (error) {
      console.error('Error loading financed applications:', error);
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
  const refetchFinanced = async (page: number = financedPage) => {
    if (!platform) {
      return;
    }
    if (page !== financedPage) {
      setFinancedPage(page);
      setRefreshKey(0);
      return;
    }

    const refreshTimestamp = Date.now();
    const params = {
      page: financedPage,
      limit: FINANCED_PER_PAGE,
      where:
        financedStatusFilter === 'all' ? {} : { status: financedStatusFilter },
      _refresh: refreshTimestamp,
    };
    setIsLoading(true);
    try {
      await Promise.all([
        platform.financeapplication?.get(params),
        platform.financeapplication?.getCount(params),
      ]);
      setRefreshKey(refreshTimestamp);
    } catch (error) {
      console.error('Error loading financed applications:', error);
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
  const handleFinancedFilterChange = async (filter: string) => {
    setFinancedStatusFilter(filter);
    setFinancedPage(1);
    setRefreshKey(0);
    await loadFinancedData(1, filter);
  };

  useEffect(() => {
    if (activeTab === 'regular') {
      loadData();
    }
  }, [saleFilterParams, activeTab]);
  useEffect(() => {
    if (activeTab === 'financed') {
      loadFinancedData();
    }
  }, [financedFilterParams, activeTab]);

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
      <AdminLayout>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('token_sales_dashboard_title')}</Heading>
        </div>

        <section className="mt-6">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('financed')}
              className={`px-4 py-2 rounded-full ${
                activeTab === 'financed'
                  ? 'bg-accent text-background'
                  : 'bg-muted text-foreground'
              }`}
            >
              {t('token_sales_dashboard_tab_financed')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('regular')}
              className={`px-4 py-2 rounded-full ${
                activeTab === 'regular'
                  ? 'bg-accent text-background'
                  : 'bg-muted text-foreground'
              }`}
            >
              {t('token_sales_dashboard_tab_regular')}
            </button>
          </div>

          {activeTab === 'regular' ? (
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
          ) : (
            <Card className="bg-background flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-muted-foreground font-bold">
                  {totalFinanceApplications || 0}{' '}
                  {t('token_sales_dashboard_financed_applications')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {t('token_sales_dashboard_select_status')}
                  </span>
                  <select
                    value={financedStatusFilter}
                    onChange={(event) =>
                      handleFinancedFilterChange(event.target.value)
                    }
                    className="bg-background border border-border rounded-md px-2 py-1"
                  >
                    <option value="all">
                      {t('token_sales_dashboard_all_sales')}
                    </option>
                    <option value="pending">
                      {t('token_sales_dashboard_status_pending')}
                    </option>
                    <option value="pending-payment">
                      {t('token_sales_dashboard_pending_payment')}
                    </option>
                    <option value="paid">
                      {t('token_sales_dashboard_paid')}
                    </option>
                    <option value="completed">
                      {t('token_sales_dashboard_completed')}
                    </option>
                    <option value="cancelled">
                      {t('token_sales_dashboard_cancelled')}
                    </option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3">
                        {t('token_sales_dashboard_financed_application_id')}
                      </th>
                      <th className="text-left p-3">
                        {t('token_sales_dashboard_status')}
                      </th>
                      <th className="text-left p-3">
                        {t('token_sales_dashboard_financed_next_payment_due')}
                      </th>
                      <th className="text-left p-3">
                        {t(
                          'token_sales_dashboard_financed_total_contract_tokens',
                        )}
                      </th>
                      <th className="text-left p-3">
                        {t('token_sales_dashboard_financed_total_contract_eur')}
                      </th>
                      <th className="text-left p-3">
                        {t('token_sales_dashboard_created')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(financeApplications || []).map((item: any) => {
                      const application: FinanceApplication = item?.toJS
                        ? item.toJS()
                        : item;
                      const status = getFinancedCurrentStatus(application);
                      return (
                        <tr
                          key={application._id}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="p-3">
                            <Link
                              href={`/dashboard/token-sales/financed/${application._id}`}
                              className="text-accent underline"
                            >
                              {application._id}
                            </Link>
                          </td>
                          <td className="p-3">
                            <FinancedStatusBadge status={status} />
                          </td>
                          <td className="p-3">
                            {formatDate(getNextPaymentDueDate(application))}
                          </td>
                          <td className="p-3">
                            {application.tokensToFinance || 0}
                          </td>
                          <td className="p-3">
                            {formatIsoFiatAmount(
                              application.totalToPayInFiat || 0,
                              'EUR',
                            )}
                          </td>
                          <td className="p-3">
                            {formatDate(
                              application.created
                                ? new Date(application.created)
                                : null,
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => refetchFinanced(Math.max(1, financedPage - 1))}
                  disabled={financedPage <= 1}
                  className="px-3 py-1 rounded border border-border disabled:opacity-50"
                >
                  {t('buttons_back')}
                </button>
                <span className="text-sm">
                  {t('token_sales_dashboard_showing')} {financedPage}
                </span>
                <button
                  type="button"
                  onClick={() => refetchFinanced(financedPage + 1)}
                  disabled={
                    (totalFinanceApplications || 0) <=
                    financedPage * FINANCED_PER_PAGE
                  }
                  className="px-3 py-1 rounded border border-border disabled:opacity-50"
                >
                  {t('buttons_next')}
                </button>
              </div>
            </Card>
          )}
        </section>
      </AdminLayout>
    </>
  );
};

TokenSalesDashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingConfigRes = await api.get('/config/booking').catch(() => {
        return null;
      })

    const bookingConfig = bookingConfigRes?.data?.results?.value;

    return {
      bookingConfig,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      bookingConfig: null,
      };
  }
};

export default TokenSalesDashboardPage;
