import Head from 'next/head';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import Pagination from '../../../components/Pagination';
import {
  ExpenseChargesListing,
  ExpenseDialog,
} from '../../../components/expense-tracking';
import { Button } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import {
  userRolesCanAccessExpenseDashboard,
  userRolesCanCreateExpense,
} from 'closer/constants/expenseTrackingAccess';
import { GeneralConfig } from 'closer/types/api';
import {
  ExpenseTrackingChargeRow,
  ExpenseTrackingCombinedEntry,
} from 'closer/types/expense';
import { Plus } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { getAccessToken } from '../../../utils/authStorage';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { parseExpenseTrackingCombinedEntriesPayload } from '../../../utils/expenseTracking.helpers';
import { formatDateForApi, getDateRange } from '../../../utils/dashboard.helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';

const EXPENSES_PER_PAGE = 50;
const CHARGE_DOWNLOAD_LIMIT = 10000;

const normalizePlatformCount = (
  countRes: { results?: unknown } | null | undefined,
): number => {
  const raw = countRes?.results;
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return raw;
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'toJS' in raw &&
    typeof (raw as { toJS: () => unknown }).toJS === 'function'
  ) {
    const v = (raw as { toJS: () => unknown }).toJS();
    return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
};

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

  const allEntities = entitiesConfig?.elements?.map((entity: any) => entity.legalName) || [];
  const uniqueEntities = [...new Set(allEntities)];

  const defaultEntity = entitiesConfig?.elements[0]?.legalName || '';

  const expenseCategories = generalConfig?.expenseCategories?.split(',');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<string>('month');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { start, end } = getDateRange({
    timeFrame,
    fromDate,
    toDate,
    timeZone: TIME_ZONE,
  });

  const chargeFromStr = formatDateForApi(start, TIME_ZONE);
  const chargeToStr = formatDateForApi(end, TIME_ZONE);

  const [combinedEntries, setCombinedEntries] = useState<
    ExpenseTrackingCombinedEntry[]
  >([]);
  const [totalCombinedCount, setTotalCombinedCount] = useState<number>(0);
  const [chargeCountInRange, setChargeCountInRange] = useState<number>(0);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        setIsLoading(true);
        const countFilter = {
          where: {
            type: 'expense',
            date: { $gte: chargeFromStr, $lte: chargeToStr },
          },
        };
        const [combinedRes, countRes] = await Promise.all([
          api.get('/expense-tracking/combined-entries', {
            params: {
              from: chargeFromStr,
              to: chargeToStr,
              page: 1,
              limit: CHARGE_DOWNLOAD_LIMIT,
              sort_by: '-date',
              ...(forceRefresh && { _refresh: Date.now() }),
            },
          }),
          platform.charge.getCount(countFilter),
        ]);
        const parsed = parseExpenseTrackingCombinedEntriesPayload(
          combinedRes.data,
        );
        setCombinedEntries(parsed.entries);
        setTotalCombinedCount(parsed.total);
        setChargeCountInRange(normalizePlatformCount(countRes));
      } catch (err) {
        setCombinedEntries([]);
        setTotalCombinedCount(0);
        setChargeCountInRange(0);
      } finally {
        setIsLoading(false);
      }
    },
    [chargeFromStr, chargeToStr, timeFrame, platform],
  );

  const combinedEntriesForListing = useMemo(() => {
    const start = (currentPage - 1) * EXPENSES_PER_PAGE;
    return combinedEntries.slice(start, start + EXPENSES_PER_PAGE);
  }, [combinedEntries, currentPage]);

  const combinedEntriesPaginationTotal = Math.min(
    totalCombinedCount,
    CHARGE_DOWNLOAD_LIMIT,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchAllChargesForDateRange =
    async (): Promise<ExpenseTrackingChargeRow[]> => {
      const filter = {
        where: {
          type: 'expense',
          date: { $gte: chargeFromStr, $lte: chargeToStr },
        },
        sort_by: '-date',
        limit: CHARGE_DOWNLOAD_LIMIT,
      };
      const res = await platform.charge.get(filter);
      const items = res?.results?.toJS?.() ?? [];
      return Array.isArray(items) ? (items as ExpenseTrackingChargeRow[]) : [];
    };

  const handleDownloadCSV = async () => {
    try {
      setIsLoading(true);
      const allCharges = await fetchAllChargesForDateRange();
      const headers = [
        t('expense_tracking_entity'),
        t('expense_tracking_document_date'),
        t('expense_tracking_description'),
        t('expense_tracking_supplier'),
        t('expense_tracking_supplier_address_detail'),
        t('expense_tracking_supplier_country'),
        t('expense_tracking_category'),
        t('expense_tracking_tax_exemption_reason_id'),
        t('expense_tracking_receipt_total'),
        t('expense_tracking_currency'),
        t('expense_tracking_comment'),
        t('expense_tracking_vat_summary'),
      ];

      const rows = allCharges.map((charge) => {
        const entity = charge.entity || '';
        const documentDate =
          charge.meta?.toconlineData?.document_date || '';
        const description = charge?.description || '';
        const supplier =
          charge.meta?.toconlineData?.supplier_business_name || '';
        const supplierAddressDetail =
          charge.meta?.toconlineData?.supplier_address_detail || '';
        const supplierCountry =
          charge.meta?.toconlineData?.supplier_country || '';
        const category = charge?.category || '';
        const taxExemptionReasonId =
          charge.meta?.toconlineData?.tax_exemption_reason_id || '';
        const receiptTotal = charge.amount?.total?.val || 0;
        const currency = charge.amount?.total?.cur?.toUpperCase() || '';
        const comment = charge.meta?.comment || '';

        const vatSummaryLines = charge.meta?.toconlineData?.lines ?? [];
        const vatSummary = vatSummaryLines
          .map(
            (line) =>
              `${line.description || ''}|${line.tax_percentage || 0}%|${line.tax_code || ''}|€${(line.unit_price ?? 0).toFixed(2)}`,
          )
          .join('; ');

        return [
          entity,
          documentDate,
          description,
          supplier,
          supplierAddressDetail,
          supplierCountry,
          category,
          taxExemptionReasonId,
          receiptTotal.toFixed(2),
          currency,
          comment,
          vatSummary,
        ];
      });

      const escapeCsvCell = (cell: string | number): string => {
        const cellStr = String(cell);
        if (
          cellStr.includes(',') ||
          cellStr.includes('"') ||
          cellStr.includes('\n')
        ) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      };

      const csvContent = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map((row) => row.map(escapeCsvCell).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error: unknown) {
      const errorMessage =
        (error instanceof Error ? error.message : null) ||
        t('expense_tracking_download_error');
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAllDocuments = async () => {
    try {
      setIsLoading(true);
      const allCharges = await fetchAllChargesForDateRange();
      const chargesWithDocuments = allCharges.filter(
        (charge) => Boolean(charge.meta?.uploadedDocumentUrl),
      );

      if (chargesWithDocuments.length === 0) {
        alert(t('expense_tracking_no_documents_to_download'));
        return;
      }

      const documentUrls = chargesWithDocuments.map((charge, index) => {
        const url = charge.meta?.uploadedDocumentUrl ?? '';
        const extension = url.includes('.pdf') ? 'pdf' : 'jpg';
        const fileName = `expense_${charge._id || index}.${extension}`;
        return { url, fileName };
      });

      const token = getAccessToken();
      const response = await fetch('/api/download-expense-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ documentUrls }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error(t('expense_tracking_download_error'));
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `expense_documents_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error: unknown) {
      const errorMessage =
        (error instanceof Error ? error.message : null) ||
        t('expense_tracking_download_error');
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame, fromDate, toDate]);

  const roles = user?.roles ?? [];
  if (!userRolesCanAccessExpenseDashboard(roles)) {
    return <PageNotAllowed />;
  }

  const canCreateExpenses = userRolesCanCreateExpense(roles);

  return (
    <>
      <Head>
        <title>{t('expense_tracking_dashboard_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <Heading level={2}>{t('expense_tracking_dashboard_title')}</Heading>
            <TimeFrameSelector
              timeFrame={timeFrame}
              setTimeFrame={setTimeFrame}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 flex flex-col gap-2">
            <p>{t('expense_tracking_dashboard_info_start_date')}</p>
            <p>{t('expense_tracking_dashboard_info_toconline_sync')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
          {canCreateExpenses ? (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 w-full sm:w-fit"
              size="small"
            >
              <Plus className="w-4 h-4" />
              {t('expense_tracking_add_new_expense')}
            </Button>
          ) : (
            <span className="hidden sm:block sm:min-w-0" aria-hidden />
          )}
          <div
            className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${!canCreateExpenses ? 'sm:ml-auto' : ''}`}
          >
            <Button
              onClick={() => handleDownloadAllDocuments()}
              variant="secondary"
              size="small"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              isEnabled={!isLoading && chargeCountInRange > 0}
            >
              {t('expense_tracking_download_all_documents')}
            </Button>
            <Button
              onClick={() => handleDownloadCSV()}
              variant="secondary"
              size="small"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              isEnabled={!isLoading && chargeCountInRange > 0}
            >
              {t('expense_tracking_download_csv')}
            </Button>
          </div>
        </div>

        <ExpenseChargesListing
          entries={combinedEntriesForListing}
          isLoading={isLoading}
        />

        {combinedEntriesPaginationTotal > EXPENSES_PER_PAGE && (
          <Pagination
            loadPage={handlePageChange}
            page={currentPage}
            limit={EXPENSES_PER_PAGE}
            total={combinedEntriesPaginationTotal}
          />
        )}

        {canCreateExpenses && (
          <ExpenseDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            expenseCategories={expenseCategories}
            onSuccess={() => loadData(true)}
            uniqueEntities={uniqueEntities as string[]}
            defaultEntity={defaultEntity}
          />
        )}
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
