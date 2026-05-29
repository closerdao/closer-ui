import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import FinancedApplicationsTable from '../../../components/Dashboard/FinancedApplicationsTable';
import SalesListDashboard from '../../../components/Dashboard/SalesListDashboard';
import Heading from '../../../components/ui/Heading';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import useRBAC from '../../../hooks/useRBAC';
import {
  FinanceApplication,
  Subscriptions,
} from '../../../types/subscriptions';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { getPlatformDefaultCurrency } from '../../../utils/saleCurrency';
import {
  mergeSaleListWhere,
  saleCategoryLabelKey,
  type SaleCategory,
} from '../../../utils/saleCategory';
import {
  SALES_HUB_DEFAULT_TAB,
  SALES_HUB_PRODUCT_TABS,
  isSalesHubTab,
  salesHubTabPath,
  type SalesHubTab,
} from '../../../utils/salesHub';

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

const SalesDashboardPage = () => {
  const router = useRouter();
  const subscriptionsConfig = getCachedConfig('subscriptions') as
    | Subscriptions
    | null;
  const learningHubConfig = getCachedConfig('learningHub') as {
    enabled?: boolean;
  } | null;
  const platformDefaultCurrency = getPlatformDefaultCurrency(subscriptionsConfig);
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform }: { platform?: Record<string, any> } = usePlatform();

  const isLearningHubEnabled = learningHubConfig?.enabled === true;

  const visibleProductTabs = useMemo(
    () =>
      SALES_HUB_PRODUCT_TABS.filter(
        (tab) => tab !== 'lessons' || isLearningHubEnabled,
      ),
    [isLearningHubEnabled],
  );

  const tabParam = typeof router.query.tab === 'string' ? router.query.tab : '';
  const activeTab: SalesHubTab = isSalesHubTab(tabParam)
    ? tabParam
    : SALES_HUB_DEFAULT_TAB;

  const [currentPage, setCurrentPage] = useState(1);
  const [financedPage, setFinancedPage] = useState(1);
  const [, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('paid');
  const [financedStatusFilter, setFinancedStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const isProductTab = activeTab !== 'financed';

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (!isSalesHubTab(tabParam)) {
      router.replace(salesHubTabPath(SALES_HUB_DEFAULT_TAB));
      return;
    }
    if (tabParam === 'lessons' && !isLearningHubEnabled) {
      router.replace(salesHubTabPath(SALES_HUB_DEFAULT_TAB));
    }
  }, [router.isReady, tabParam, isLearningHubEnabled, router]);

  useEffect(() => {
    setCurrentPage(1);
    setFinancedPage(1);
    setRefreshKey(0);
    if (activeTab !== 'financed') {
      setStatusFilter('paid');
    }
  }, [activeTab]);

  const saleFilterParams = useMemo(() => {
    if (!isProductTab) {
      return null;
    }
    return {
      page: currentPage,
      limit: SALES_PER_PAGE,
      where: mergeSaleListWhere(activeTab, statusFilter),
      ...(refreshKey > 0 ? { _refresh: refreshKey } : {}),
    };
  }, [activeTab, currentPage, statusFilter, refreshKey, isProductTab]);

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

  const sales = saleFilterParams ? platform?.sale?.find(saleFilterParams) : [];
  const totalSales = saleFilterParams
    ? platform?.sale?.findCount(saleFilterParams)
    : 0;
  const financeApplications =
    platform?.financeapplication?.find(financedFilterParams);
  const totalFinanceApplications =
    platform?.financeapplication?.findCount(financedFilterParams);

  const loadSalesData = async (
    tab: SaleCategory,
    page: number = currentPage,
    filter: string = statusFilter,
  ) => {
    if (!platform?.sale) {
      return;
    }
    const params = {
      page,
      limit: SALES_PER_PAGE,
      where: mergeSaleListWhere(tab, filter),
    };
    setIsLoading(true);
    try {
      await Promise.all([
        platform.sale.get(params, { force: true }),
        platform.sale.getCount(params, { force: true }),
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
    if (!platform?.financeapplication) {
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
        platform.financeapplication.get(params, { force: true }),
        platform.financeapplication.getCount(params, { force: true }),
      ]);
      setFinancedPage(page);
    } catch (error) {
      console.error('Error loading financed applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchSales = async (page: number = currentPage) => {
    if (!platform?.sale || !isProductTab) {
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
      where: mergeSaleListWhere(activeTab, statusFilter),
      _refresh: refreshTimestamp,
    };
    setIsLoading(true);
    try {
      await Promise.all([
        platform.sale.get(params),
        platform.sale.getCount(params),
      ]);
      setRefreshKey(refreshTimestamp);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchFinanced = async (page: number = financedPage) => {
    if (!platform?.financeapplication) {
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
        platform.financeapplication.get(params),
        platform.financeapplication.getCount(params),
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
    if (isProductTab) {
      await loadSalesData(activeTab, 1, filter);
    }
  };

  const handleFinancedFilterChange = async (filter: string) => {
    setFinancedStatusFilter(filter);
    setFinancedPage(1);
    setRefreshKey(0);
    await loadFinancedData(1, filter);
  };

  useEffect(() => {
    if (isProductTab && saleFilterParams) {
      loadSalesData(activeTab);
    }
  }, [saleFilterParams, isProductTab, activeTab]);

  useEffect(() => {
    if (activeTab === 'financed') {
      loadFinancedData();
    }
  }, [financedFilterParams, activeTab]);

  const salesWithBuyer = (sales || []).map((sale: { toJS?: () => unknown }) => {
    const saleData = sale.toJS ? sale.toJS() : sale;
    return {
      ...(saleData as object),
      buyer: null,
    };
  });

  const financedApplicationsList = (financeApplications || []).map(
    (item: { toJS?: () => FinanceApplication }) =>
      item?.toJS ? item.toJS() : item,
  ) as FinanceApplication[];

  if (!user || !hasAccess('TokenSales')) {
    return <PageNotAllowed />;
  }

  const hubTabs: { id: SalesHubTab; label: string }[] = [
    { id: 'financed', label: t('token_sales_dashboard_tab_financed') },
    ...visibleProductTabs.map((tab) => ({
      id: tab,
      label: t(saleCategoryLabelKey(tab)),
    })),
  ];

  return (
    <>
      <Head>
        <title>{t('sales_dashboard_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('sales_dashboard_title')}</Heading>
        </div>

        <section className="mt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {hubTabs.map((tab) => (
              <Link
                key={tab.id}
                href={salesHubTabPath(tab.id)}
                className={`px-4 py-2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-accent text-background'
                    : 'bg-muted text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {isProductTab ? (
            <SalesListDashboard
              sales={salesWithBuyer}
              saleCategory={activeTab}
              platformDefaultCurrency={platformDefaultCurrency}
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
            <FinancedApplicationsTable
              applications={financedApplicationsList}
              totalCount={totalFinanceApplications || 0}
              page={financedPage}
              perPage={FINANCED_PER_PAGE}
              statusFilter={financedStatusFilter}
              onStatusFilterChange={handleFinancedFilterChange}
              onPageChange={refetchFinanced}
              getCurrentStatus={getFinancedCurrentStatus}
              getNextPaymentDueDate={getNextPaymentDueDate}
              subscriptionsConfig={subscriptionsConfig}
            />
          )}
        </section>
      </AdminLayout>
    </>
  );
};

export default SalesDashboardPage;
