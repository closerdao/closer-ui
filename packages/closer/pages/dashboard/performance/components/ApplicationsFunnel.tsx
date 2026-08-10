import { useCallback, useEffect, useMemo, useState } from 'react';

import { Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import { generateApplicationFilter } from '../../../../utils/performance.utils';

interface Platform {
  application: {
    findCount: (filter: any) => number;
    getCount: (filter: any) => Promise<any>;
  };
}

interface ApplicationsFunnelProps {
  timeFrame: string;
  fromDate: string;
  toDate: string;
}

/**
 * Applications move open → conversation → approved (or rejected), and a record
 * only carries its current status. So each step counts that status and the ones
 * past it, the way the stays funnel treats booking statuses.
 *
 * There is no page-view step here: nothing logs a `page-view` metric for the
 * application form, so a top-of-funnel row would always read zero.
 */
const ApplicationsFunnel = ({
  timeFrame,
  fromDate,
  toDate,
}: ApplicationsFunnelProps) => {
  const { platform } = usePlatform() as { platform: Platform };
  const t = useTranslations();

  const [, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filters = useMemo(
    () => ({
      allFilter: generateApplicationFilter({ fromDate, toDate, timeFrame }),
      conversationOrBeyondFilter: generateApplicationFilter({
        fromDate,
        toDate,
        timeFrame,
        status: ['conversation', 'approved'],
      }),
      approvedFilter: generateApplicationFilter({
        fromDate,
        toDate,
        timeFrame,
        status: ['approved'],
      }),
      rejectedFilter: generateApplicationFilter({
        fromDate,
        toDate,
        timeFrame,
        status: ['rejected'],
      }),
    }),
    [fromDate, toDate, timeFrame],
  );

  const stats = useMemo(() => {
    const total = platform.application.findCount(filters.allFilter) || 0;
    const conversation =
      platform.application.findCount(filters.conversationOrBeyondFilter) || 0;
    const approved = platform.application.findCount(filters.approvedFilter) || 0;
    const rejected = platform.application.findCount(filters.rejectedFilter) || 0;

    return { total, conversation, approved, rejected };
  }, [platform, filters]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.application.getCount(filters.allFilter),
        platform.application.getCount(filters.conversationOrBeyondFilter),
        platform.application.getCount(filters.approvedFilter),
        platform.application.getCount(filters.rejectedFilter),
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [platform, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    const maxCount = Math.max(stats.total, 1);
    const asStep = (count: number) => ({
      count,
      percentage: Math.round((count / maxCount) * 100),
    });

    return {
      total: asStep(stats.total),
      conversation: asStep(stats.conversation),
      approved: asStep(stats.approved),
      pending: asStep(stats.total - stats.approved - stats.rejected),
      conversionRate: {
        count: `${stats.approved} / ${stats.total}`,
        percentage:
          Number(((stats.approved / maxCount) * 100).toFixed(2)) || 0,
      },
    };
  }, [stats]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard_performance_applications_funnel')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('dashboard_performance_applications_conversion_funnel')}
            </p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">
                  {t('dashboard_performance_awaiting_decision')}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {funnelStats.pending.count}
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">
                  {t('dashboard_performance_acceptance_rate_label')}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {funnelStats.conversionRate.percentage}%
                </span>
              </div>
              <div className="text-gray-600 text-xs mt-1">
                <span>{funnelStats.conversionRate.count}</span>{' '}
                {t('dashboard_performance_applications_approved')}
              </div>
            </div>

            <div className="bg-white/90 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">
                    {t('dashboard_performance_total_applications')}
                  </span>
                  <span className="font-bold">{funnelStats.total.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">
                    {t('dashboard_performance_conversation_plus')}
                  </span>
                  <span className="font-bold">
                    {funnelStats.conversation.count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${funnelStats.conversation.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">
                    {t('dashboard_applications_status_approved')}
                  </span>
                  <span className="font-bold">{funnelStats.approved.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${funnelStats.approved.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-gray-500">
                  <span className="text-sm font-medium">
                    {t('dashboard_applications_status_rejected')}
                  </span>
                  <span className="font-bold">{stats.rejected}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsFunnel;
