import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { FinanceApplication } from '../types/subscriptions';
import { financeApplicationListFromGetAction } from '../utils/platformFinanceApplication';

/**
 * Statuses under which a financed token plan is still running — anything
 * not cancelled or fully repaid.
 */
export const OPEN_FINANCE_STATUSES: FinanceApplication['status'][] = [
  'pending-payment',
  'paid',
  'pending',
  'up-to-date',
  'delinquent',
];

/** The current user's in-progress financed token applications, newest first. */
export const useOpenFinanceApplications = () => {
  const { user } = useAuth();
  const { platform }: any = usePlatform();
  const [applications, setApplications] = useState<FinanceApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) {
      setApplications([]);
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
          limit: 50,
          sort_by: '-created' as const,
        };
        const action = await platform.financeapplication.get(params);
        const rows = financeApplicationListFromGetAction(action);
        // The API scopes list queries to the requesting user itself and may
        // ignore the status filter, so re-apply it here.
        const openRows = rows.filter((row) =>
          OPEN_FINANCE_STATUSES.includes(row.status),
        );
        if (!cancelled) {
          setApplications(openRows);
        }
      } catch {
        if (!cancelled) {
          setApplications([]);
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

  return { applications, isLoading };
};
