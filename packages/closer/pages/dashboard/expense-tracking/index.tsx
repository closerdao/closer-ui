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
import Cookies from 'js-cookie';
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


  
  const allEntities = entitiesConfig?.elements?.map((entity: any) => entity.legalName) || [];
  const uniqueEntities = [...new Set(allEntities)];

  const defaultEntity = entitiesConfig?.elements?.filter((entity: any) => entity.transactionType === 'expense')[0]?.entityName || '';

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

  const handleDownloadCSV = (charges: any[]) => {
    const headers = [
      t('expense_tracking_entity'),
      t('expense_tracking_document_date'),
      t('expense_tracking_description'),
      t('expense_tracking_supplier'),
      t('expense_tracking_category'),
      t('expense_tracking_tax_exemption_reason_id'),
      t('expense_tracking_receipt_total'),
      t('expense_tracking_currency'),
      t('expense_tracking_comment'),
      t('expense_tracking_vat_summary'),
    ];

    const rows = charges.map((charge) => {
      const entity = charge.entity || '';
      const documentDate =
        charge.meta?.toconlineData?.document_date || '';
      const description = charge?.description || '';
      const supplier =
        charge.meta?.toconlineData?.supplier_business_name || '';
      const category = charge?.category || '';
      const taxExemptionReasonId =
        charge.meta?.toconlineData?.tax_exemption_reason_id || '';
      const receiptTotal = charge.amount?.total?.val || 0;
      const currency = charge.amount?.total?.cur?.toUpperCase() || '';
      const comment = charge.meta?.comment || '';

      const vatSummaryLines = charge.meta?.toconlineData?.lines || [];
      const vatSummary = vatSummaryLines
        .map(
          (line: any) =>
            `${line.description || ''}|${line.tax_percentage || 0}%|${line.tax_code || ''}|€${(line.unit_price || 0).toFixed(2)}`,
        )
        .join('; ');

      return [
        entity,
        documentDate,
        description,
        supplier,
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
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
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
  };

  const handleDownloadAllDocuments = async (charges: any[]) => {
    try {
      setIsLoading(true);
      const chargesWithDocuments = charges.filter(
        (charge) => charge.meta?.uploadedDocumentUrl,
      );

      if (chargesWithDocuments.length === 0) {
        alert(t('expense_tracking_no_documents_to_download'));
        return;
      }

      const documentUrls = chargesWithDocuments.map((charge, index) => {
        const url = charge.meta.uploadedDocumentUrl;
        const extension = url.includes('.pdf') ? 'pdf' : 'jpg';
        const fileName = `expense_${charge._id || index}.${extension}`;
        return { url, fileName };
      });

      const token = Cookies.get('access_token');
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
    } catch (error: any) {
      console.error('Error downloading documents:', error);
      const errorMessage =
        error.message || t('expense_tracking_download_error');
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame, fromDate, toDate]);

  if (!user?.roles.includes('admin') && !user?.roles.includes('team')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('expense_tracking_dashboard_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout isBookingEnabled={true}>
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 w-full sm:w-fit"
            size="small"
          >
            <Plus className="w-4 h-4" />
            {t('expense_tracking_add_new_expense')}
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => handleDownloadAllDocuments(filteredCharges)}
              variant="secondary"
              size="small"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              isEnabled={!isLoading && filteredCharges.length > 0}
            >
              {t('expense_tracking_download_all_documents')}
            </Button>
            <Button
              onClick={() => handleDownloadCSV(filteredCharges)}
              variant="secondary"
              size="small"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              isEnabled={!isLoading && filteredCharges.length > 0}
            >
              {t('expense_tracking_download_csv')}
            </Button>
          </div>
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
