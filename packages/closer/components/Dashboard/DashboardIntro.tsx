import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { Button, Heading, Spinner } from '../ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

const DashboardIntro = ({ timeFrame }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const { APP_NAME, platformName } = useConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    activeListings: 0,
    totalTokensSold: 0,
  });
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const startYear = 2020;
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => (startYear + i).toString(),
  ).reverse();

  const hasAccountingRole = user?.roles?.includes('accounting');

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [usersRes, bookingsRes, listingsRes] = await Promise.all([
        platform.user.get({ where: {}, limit: 1 }),
        platform.booking.get({ where: {}, limit: 1 }),
        platform.listing.get({ where: { availableToBook: true }, limit: 1 }),
      ]);

      const userCount = platform.user.findCount({ where: {} }) || 0;
      const bookingCount = platform.booking.findCount({ where: {} }) || 0;
      const listingCount =
        platform.listing.findCount({ where: { availableToBook: true } }) || 0;

      let tokensSold = 0;
      if (APP_NAME === 'tdf') {
        try {
          const tokenSalesRes = await platform.metrics.getTokenSales({
            where: {},
            limit: 10000,
          });
          const allTokenSales = platform.metrics.findTokenSales('metrics');
          tokensSold = allTokenSales?.reduce(
            (acc: number, sale: any) => acc + Number(sale.get('value') || 0),
            0,
          );
        } catch (e) {
          console.error('Error fetching token sales:', e);
        }
      }

      setStats({
        totalUsers: userCount,
        totalBookings: bookingCount,
        activeListings: listingCount,
        totalTokensSold: tokensSold,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExportTokenTransactions = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(false);

      await api.post(`/accounting/request-token-transactions?year=${selectedYear}`);

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

  return (
    <section className="bg-white rounded-md p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Heading level={3} className="text-lg font-semibold">
            {t('dashboard_intro_welcome', { platform: platformName || APP_NAME })}
          </Heading>
          <p className="text-gray-600 mt-1">{t('dashboard_intro_subtitle')}</p>
        </div>

        {hasAccountingRole && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
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
              <Button
                onClick={handleExportTokenTransactions}
                isEnabled={!isExporting}
                isLoading={isExporting}
                size="small"
              >
                {t('dashboard_intro_export_token_transactions')}
              </Button>
            </div>
            {exportError && (
              <p className="text-red-500 text-sm">{exportError}</p>
            )}
            {exportSuccess && (
              <p className="text-green-600 text-sm">
                {t('dashboard_intro_export_success')}
              </p>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-accent-light/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {t('dashboard_intro_total_users')}
            </div>
          </div>

          <div className="bg-accent-light/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">
              {stats.totalBookings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {t('dashboard_intro_total_bookings')}
            </div>
          </div>

          <div className="bg-accent-light/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">
              {stats.activeListings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {t('dashboard_intro_active_listings')}
            </div>
          </div>

          {APP_NAME === 'tdf' && (
            <div className="bg-accent-light/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-accent">
                {stats.totalTokensSold.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {t('dashboard_intro_tokens_sold')}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default DashboardIntro;
