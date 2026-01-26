import { useState } from 'react';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { Button } from '../ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const DashboardActions = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { APP_NAME } = useConfig();

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const startYear = 2020;
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => (startYear + i).toString(),
  ).reverse();

  const hasAccountingRole = user?.roles?.includes('accounting');

  const handleExportTokenTransactions = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(false);

      await api.post(
        `/accounting/request-token-transactions?year=${selectedYear}`,
      );

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      setExportError(
        err.response?.data?.error || t('dashboard_intro_export_error'),
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasAccountingRole || APP_NAME !== 'tdf') {
    return null;
  }

  return (
    <section className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">{t('dashboard_actions_title')}:</span>
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-20 h-7 text-xs">
          <SelectValue placeholder={t('dashboard_intro_select_year')} />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={handleExportTokenTransactions}
        disabled={isExporting}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50"
      >
        <Download className="w-3 h-3" />
        {t('dashboard_intro_export_token_transactions')}
      </button>
      {exportError && <p className="text-red-500 text-xs">{exportError}</p>}
      {exportSuccess && (
        <p className="text-green-600 text-xs">
          {t('dashboard_intro_export_success')}
        </p>
      )}
    </section>
  );
};

export default DashboardActions;
