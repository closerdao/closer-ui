import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { FinanceApplication } from '../types/subscriptions';
import { getFinanceMenuHighlight } from '../utils/financeApplicationScheduleHelpers';
import { financeApplicationListFromGetAction } from '../utils/platformFinanceApplication';

const OPEN_FINANCE_STATUSES: FinanceApplication['status'][] = [
  'pending-payment',
  'paid',
  'pending',
  'up-to-date',
  'delinquent',
];

const FinancedTokenMenuWidget = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform();
  const [application, setApplication] = useState<FinanceApplication | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) {
      setApplication(null);
      setIsLoading(false);
      return;
    }
    if (!platform?.financeapplication) {
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const params = {
          where: {
            userId: user._id,
            status: { $in: OPEN_FINANCE_STATUSES },
          },
          limit: 1,
          sort_by: '-created' as const,
        };
        const action = await platform.financeapplication.get(params);
        const rows = financeApplicationListFromGetAction(action);
        const first = (rows[0] || null) as FinanceApplication | null;
        if (!cancelled) {
          setApplication(first);
        }
      } catch {
        if (!cancelled) {
          setApplication(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id, platform?.financeapplication]);

  if (
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true' ||
    isLoading ||
    !application
  ) {
    return null;
  }

  const highlight = getFinanceMenuHighlight(application);
  const tokensAccrued = application.tokensAccrued ?? 0;

  const formatMenuDate = (d: Date) =>
    d.toLocaleDateString(router.locale || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="p-3 bg-gradient-to-br from-accent/5 to-accent-light/5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
            $
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {t('member_menu_financed_widget_title')}
          </span>
        </div>
        {highlight.kind === 'deposit' ? (
          <p className="text-xs text-amber-800 font-medium">
            {t('member_menu_financed_status_deposit')}
          </p>
        ) : null}
        {highlight.kind === 'overdue' ? (
          <p className="text-xs text-red-800 font-medium">
            {t('member_menu_financed_status_overdue', {
              date: formatMenuDate(highlight.dueDate),
            })}
          </p>
        ) : null}
        {highlight.kind === 'next' ? (
          <p className="text-xs text-gray-700">
            {t('member_menu_financed_status_next', {
              date: formatMenuDate(highlight.date),
            })}
          </p>
        ) : null}
        <div className="flex items-baseline justify-between gap-2 pt-0.5 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {t('member_menu_financed_tokens_accrued')}
          </span>
          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {tokensAccrued.toLocaleString(router.locale || 'en')}
          </span>
        </div>
        <Link
          href={`/token/financed/${encodeURIComponent(application._id)}`}
          className="block w-full py-2 px-3 bg-accent hover:bg-accent-dark text-white text-center text-sm font-medium rounded-full uppercase tracking-wide transition-colors"
        >
          {t('member_menu_financed_view')}
        </Link>
      </div>
    </div>
  );
};

export default FinancedTokenMenuWidget;
