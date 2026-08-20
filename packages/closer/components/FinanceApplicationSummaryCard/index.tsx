import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { FinanceApplication } from '../../types/subscriptions';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { getNextPaymentDueDateForFinance } from '../../utils/financeApplicationScheduleHelpers';
import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
} from '../../utils/orderStatusBadge';
import { Card } from '../ui';
import { Badge } from '../ui/badge';

interface Props {
  application: FinanceApplication;
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FinanceApplicationSummaryCard = ({ application }: Props) => {
  const t = useTranslations();

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="card-feature">
          {t('token_sales_dashboard_financed_application_id')}
        </p>
        <p className="text-xs font-mono">{application._id}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="card-feature">{t('token_sales_dashboard_status')}</p>
        <Badge
          variant={financeApplicationStatusBadgeVariant(application.status)}
        >
          {t(financeApplicationStatusLabelKey(application.status))}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="card-feature">
          {t('token_sales_dashboard_financed_total_contract_tokens')}
        </p>
        <p className="text-sm">{application.tokensToFinance || 0}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="card-feature">
          {t('token_sales_dashboard_financed_total_contract_eur')}
        </p>
        <p className="text-sm font-semibold">
          {formatIsoFiatAmount(application.totalToPayInFiat || 0, 'EUR')}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="card-feature">
          {t('token_sales_dashboard_financed_next_payment_date')}
        </p>
        <p className="text-sm">
          {formatDate(getNextPaymentDueDateForFinance(application))}
        </p>
      </div>
      <Link
        href={`/token/financed/${encodeURIComponent(application._id)}`}
        className="text-sm text-accent underline"
      >
        {t('token_financed_view_contract')}
      </Link>
    </Card>
  );
};

export default FinanceApplicationSummaryCard;
