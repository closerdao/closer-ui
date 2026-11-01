import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import DashboardPageHeader from '../../../components/Dashboard/DashboardPageHeader';
import TimeFrameSelector from '../../../components/Dashboard/TimeFrameSelector';
import Pagination from '../../../components/Pagination';
import {
  ExpenseChargesListing,
  ExpenseDialog,
} from '../../../components/expense-tracking';
import { Button } from '../../../components/ui';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import {
  userRolesCanAccessExpenseDashboard,
  userRolesCanCreateExpense,
} from '../../../constants/expenseTrackingAccess';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { AccountingEntitiesConfig, GeneralConfig } from '../../../types/api';
import { ExpenseTrackingCombinedEntry } from '../../../types/expense';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { formatIsoFiatAmount } from '../../../utils/currencyFormat';
import {
  formatDateForApi,
  getDateRange,
} from '../../../utils/dashboard.helpers';
import {
  ExpenseTrackingDateBy,
  filterCombinedEntriesToExpenseFcToconlineDocuments,
  getExpenseDocumentDate,
  parseExpenseTrackingCombinedEntriesPayload,
  parseExpenseTrackingDateBy,
  sortCombinedExpenseEntriesByDateAddedDesc,
} from '../../../utils/expenseTracking.helpers';

const EXPENSES_PER_PAGE = 50;

const DATE_BY_OPTIONS: { id: ExpenseTrackingDateBy; labelKey: string }[] = [
  { id: 'added', labelKey: 'expense_tracking_date_added' },
  { id: 'document', labelKey: 'expense_tracking_document_date' },
];
const CHARGE_DOWNLOAD_LIMIT = 10000;
// Long enough for the API to start the download; the browser then owns it.
const ZIP_DOWNLOAD_FRAME_TTL_MS = 5 * 60 * 1000;

const ExpenseTrackingDashboardPage = () => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const entitiesConfig = getCachedConfig(
    'accounting-entities',
  ) as AccountingEntitiesConfig | null;
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { TIME_ZONE } = useConfig();

  const allEntities =
    entitiesConfig?.elements?.map((entity: any) => entity.legalName) || [];
  const uniqueEntities = [...new Set(allEntities)];

  const defaultEntity = entitiesConfig?.elements?.[0]?.legalName || '';

  const expenseCategories = generalConfig?.expenseCategories?.split(',');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<string>('month');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const dateBy = parseExpenseTrackingDateBy(router.query.date_by);

  // Pushed rather than replaced so the back button returns to the other date filter.
  const handleDateByChange = (next: ExpenseTrackingDateBy) => {
    if (next === dateBy) return;
    const { date_by: _omit, ...query } = router.query;
    router.push(
      {
        pathname: router.pathname,
        query: next === 'document' ? { ...query, date_by: next } : query,
      },
      undefined,
      { shallow: true },
    );
  };

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
  // Switching filters quickly overlaps requests; only the latest may set state.
  const latestLoadRef = useRef(0);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (!router.isReady) return;
      const loadId = ++latestLoadRef.current;
      try {
        setIsLoading(true);
        const combinedRes = await api.get(
          '/expense-tracking/combined-entries',
          {
            params: {
              from: chargeFromStr,
              to: chargeToStr,
              page: 1,
              limit: CHARGE_DOWNLOAD_LIMIT,
              sort_by: '-date',
              date_by: dateBy,
              toconline_document_type: 'FC',
              ...(forceRefresh && { _refresh: Date.now() }),
            },
          },
        );
        if (loadId !== latestLoadRef.current) return;
        const parsed = parseExpenseTrackingCombinedEntriesPayload(
          combinedRes.data,
        );
        const filtered = filterCombinedEntriesToExpenseFcToconlineDocuments(
          parsed.entries,
        );
        setCombinedEntries(
          dateBy === 'added'
            ? sortCombinedExpenseEntriesByDateAddedDesc(filtered)
            : filtered,
        );
        setTotalCombinedCount(filtered.length);
      } catch (err) {
        if (loadId !== latestLoadRef.current) return;
        setCombinedEntries([]);
        setTotalCombinedCount(0);
      } finally {
        if (loadId === latestLoadRef.current) {
          setIsLoading(false);
        }
      }
    },
    [chargeFromStr, chargeToStr, timeFrame, dateBy, router.isReady],
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

  // Use the same entries as the listing so exports match the selected range
  // and date filter (date added or document date).
  const chargeEntriesInRange = useMemo(
    () =>
      combinedEntries.flatMap((entry) =>
        entry.kind === 'charge' ? [entry] : [],
      ),
    [combinedEntries],
  );
  const chargesInRange = useMemo(
    () => chargeEntriesInRange.map((entry) => entry.charge),
    [chargeEntriesInRange],
  );

  const handleDownloadCSV = async () => {
    try {
      setIsLoading(true);
      const headers = [
        t('expense_tracking_entity'),
        t('expense_tracking_document_date'),
        t('expense_tracking_date_added'),
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

      const rows = chargeEntriesInRange.map(({ charge, toconline }) => {
        const entity = charge.entity || '';
        // Same date the listing shows. Date-only values are kept as they are:
        // parsing them as UTC midnight would shift the day in western time zones.
        const rawDocumentDate =
          getExpenseDocumentDate(charge, toconline) || new Date().toISOString();
        const documentDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDocumentDate)
          ? rawDocumentDate
          : formatDateForApi(new Date(rawDocumentDate), TIME_ZONE);
        const dateAdded = charge.created
          ? formatDateForApi(new Date(charge.created), TIME_ZONE)
          : '';
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
              `${line.description || ''}|${line.tax_percentage || 0}%|${
                line.tax_code || ''
              }|${formatIsoFiatAmount(
                line.unit_price ?? 0,
                currency || 'EUR',
              )}`,
          )
          .join('; ');

        return [
          entity,
          documentDate,
          dateAdded,
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
      const chargesWithDocuments = chargesInRange.filter((charge) =>
        Boolean(charge.meta?.uploadedDocumentUrl),
      );

      if (chargesWithDocuments.length === 0) {
        alert(t('expense_tracking_no_documents_to_download'));
        return;
      }

      // The API streams the ZIP as a regular browser download, so it never has
      // to fit in memory here. A plain link cannot send the auth header, hence
      // the short-lived download token. Issuing it also checks the range, so
      // errors such as "no documents" are reported here.
      const {
        data: { token },
      } = await api.post('/expense-tracking/documents-zip/token', {
        from: chargeFromStr,
        to: chargeToStr,
        date_by: dateBy,
        toconline_document_type: 'FC',
      });

      // A hidden iframe rather than a link, so an error response can never
      // replace the dashboard.
      const frame = document.createElement('iframe');
      frame.style.display = 'none';
      frame.src = api.getUri({
        url: '/expense-tracking/documents-zip',
        params: { token },
      });
      document.body.appendChild(frame);
      setTimeout(() => frame.remove(), ZIP_DOWNLOAD_FRAME_TTL_MS);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
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
  }, [timeFrame, fromDate, toDate, dateBy]);

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
          <DashboardPageHeader title={t('expense_tracking_dashboard_title')}>
            {/* A segmented control, not pills, so it reads as "which date the
                range applies to" rather than as another time frame. */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                id="expense-date-by-label"
                className="text-xs font-medium text-gray-600 whitespace-nowrap"
              >
                {t('expense_tracking_filter_by_date')}
              </span>
              <div
                role="radiogroup"
                aria-labelledby="expense-date-by-label"
                className="inline-flex rounded-md border border-gray-300 bg-gray-100 p-0.5"
              >
                {DATE_BY_OPTIONS.map((option) => {
                  const isActive = option.id === dateBy;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => handleDateByChange(option.id)}
                      className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                        isActive
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t(option.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
            <TimeFrameSelector
              timeFrame={timeFrame}
              setTimeFrame={setTimeFrame}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
            />
          </DashboardPageHeader>
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
            className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${
              !canCreateExpenses ? 'sm:ml-auto' : ''
            }`}
          >
            <Button
              onClick={() => handleDownloadAllDocuments()}
              variant="secondary"
              size="small"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              isEnabled={!isLoading && chargesInRange.length > 0}
            >
              {t('expense_tracking_download_all_documents')}
            </Button>
            <Button
              onClick={() => handleDownloadCSV()}
              variant="secondary"
              size="small"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              isEnabled={!isLoading && chargesInRange.length > 0}
            >
              {t('expense_tracking_download_csv')}
            </Button>
          </div>
        </div>

        <ExpenseChargesListing
          entries={combinedEntriesForListing}
          isLoading={isLoading}
          timeZone={TIME_ZONE}
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

export default ExpenseTrackingDashboardPage;
