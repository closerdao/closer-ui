import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { FinanceApplication, Subscriptions } from '../../types/subscriptions';
import api from '../../utils/api';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { getPlatformDefaultCurrency } from '../../utils/saleCurrency';
import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
} from '../../utils/orderStatusBadge';
import EmailDisplay from '../display/emailDisplay';
import { Card } from '../ui';
import { Badge } from '../ui/badge';

type BuyerRecord = {
  _id: string;
  email?: string;
  screenname?: string;
};

interface FinancedApplicationsTableProps {
  applications: FinanceApplication[];
  totalCount: number;
  page: number;
  perPage: number;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  onPageChange: (page: number) => void;
  getCurrentStatus: (application: FinanceApplication) => string;
  getNextPaymentDueDate: (application: FinanceApplication) => Date | null;
  subscriptionsConfig?: Subscriptions | null;
}

const formatDate = (date: Date | null, locale?: string) => {
  if (!date) {
    return '-';
  }
  return date.toLocaleDateString(locale || 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FinancedApplicationsTable = ({
  applications,
  totalCount,
  page,
  perPage,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  getCurrentStatus,
  getNextPaymentDueDate,
  subscriptionsConfig,
}: FinancedApplicationsTableProps) => {
  const t = useTranslations();
  const router = useRouter();
  const intlLocale = router.locale || undefined;
  const platformCurrency = getPlatformDefaultCurrency(subscriptionsConfig);
  const [usersById, setUsersById] = useState<Record<string, BuyerRecord>>({});

  useEffect(() => {
    const userIds = [
      ...new Set(
        applications.map((a) => a.userId).filter(Boolean),
      ),
    ] as string[];
    if (userIds.length === 0) {
      setUsersById({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(
          `/user?where=${encodeURIComponent(
            JSON.stringify({ _id: { $in: userIds } }),
          )}&includePrivate=true`,
        );
        const buyers = (res.data?.results ?? []) as BuyerRecord[];
        if (cancelled) return;
        const map: Record<string, BuyerRecord> = {};
        for (const u of buyers) {
          if (u._id) map[u._id] = u;
        }
        setUsersById(map);
      } catch {
        if (!cancelled) setUsersById({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applications]);

  return (
    <Card className="bg-background flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground font-bold">
          {totalCount || 0}{' '}
          {t('token_sales_dashboard_financed_applications')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {t('token_sales_dashboard_select_status')}
          </span>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
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
            <option value="paid">{t('token_sales_dashboard_paid')}</option>
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
                {t('sales_dashboard_financed_applicant')}
              </th>
              <th className="text-left p-3">
                {t('token_sales_dashboard_status')}
              </th>
              <th className="text-left p-3">
                {t('token_sales_dashboard_financed_next_payment_due')}
              </th>
              <th className="text-left p-3">
                {t('token_sales_dashboard_financed_total_contract_tokens')}
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
            {applications.map((application) => {
              const status = getCurrentStatus(application);
              const applicant = usersById[application.userId];
              return (
                <tr
                  key={application._id}
                  className="border-b border-border hover:bg-muted/50"
                >
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {applicant ? (
                        <>
                          <Link
                            href={`/members/${applicant._id}`}
                            className="font-medium text-accent underline"
                          >
                            {applicant.screenname || applicant._id}
                          </Link>
                          {applicant.email ? (
                            <EmailDisplay
                              email={applicant.email}
                              className="text-xs text-muted-foreground"
                            />
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      <Link
                        href={`/dashboard/sales/financed/${application._id}`}
                        className="text-xs font-mono text-muted-foreground hover:text-accent underline"
                      >
                        {application._id}
                      </Link>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={financeApplicationStatusBadgeVariant(status)}>
                      {t(financeApplicationStatusLabelKey(status))}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {formatDate(getNextPaymentDueDate(application), intlLocale)}
                  </td>
                  <td className="p-3">{application.tokensToFinance || 0}</td>
                  <td className="p-3">
                    {formatIsoFiatAmount(
                      application.totalToPayInFiat || 0,
                      platformCurrency,
                      intlLocale,
                    )}
                  </td>
                  <td className="p-3">
                    {formatDate(
                      application.created
                        ? new Date(application.created)
                        : null,
                      intlLocale,
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
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1 rounded border border-border disabled:opacity-50"
        >
          {t('buttons_back')}
        </button>
        <span className="text-sm">
          {t('token_sales_dashboard_showing')} {page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={(totalCount || 0) <= page * perPage}
          className="px-3 py-1 rounded border border-border disabled:opacity-50"
        >
          {t('buttons_next')}
        </button>
      </div>
    </Card>
  );
};

export default FinancedApplicationsTable;
