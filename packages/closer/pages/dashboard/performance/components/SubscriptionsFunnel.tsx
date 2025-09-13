import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  generateSubscriptionsFilter,
  generateSubscribeButtonClickFilter,
  getStartAndEndDate,
} from '../../../../utils/performance.utils';
import FunnelBar from './FunnelBar';

interface SubscriptionStats {
  pageViewCount: number;
  subscribeButtonClickCount: number;
  tier1ViewCount: number;
  tier2ViewCount: number;
  tier1CheckoutCount: number;
  tier2CheckoutCount: number;
  tier1PaymentCount: number;
  tier2PaymentCount: number;
  activeSubscribersCount: number;
  threeMonthSubscribersCount: number;
}

interface Platform {
  metric: {
    find: (filter: any) => { toJS: () => any[] };
    get: (filter: any) => Promise<any>;
    getCount: (filter: any) => Promise<number>;
    findCount: (filter: any) => number;
  };
  user: {
    findCount: (filter: any) => number;
    getCount: (filter: any) => Promise<number>;
  };
}
const SubscriptionsFunnel = ({
  timeFrame,
  fromDate,
  toDate,
}: {
  timeFrame: string;
  fromDate: string;
  toDate: string;
}) => {
  const { platform } = usePlatform() as { platform: Platform };
  const t = useTranslations();
  const { startDate, endDate } = getStartAndEndDate(
    timeFrame,
    fromDate,
    toDate,
  );

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filters = useMemo(
    () => ({
      subscriptionsPageVisitsFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'page-view',
      }),
      subscribeButtonClickFilter: generateSubscribeButtonClickFilter({
        fromDate,
        toDate,
        timeFrame,
      }),
      tier1ViewFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'tier-1-page-view',
      }),
      tier2ViewFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'tier-2-page-view',
      }),
      tier1CheckoutFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'tier-1-checkout',
      }),
      tier2CheckoutFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'tier-2-checkout',
      }),
      tier1PaymentFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'tier-1-first-payment',
      }),
      tier2PaymentFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'tier-2-first-payment',
      }),
      activeSubscribersCountFilter: {
        where: {
          'subscription.subscribeDate': { $exists: true, $gte: startDate },
        },
        limit: 10000,
      },
      threeMonthCountFilter: {
        where: {
          'subscription.subscribeDate': {
            $exists: true,
            $gte: startDate,
            $lte: threeMonthsAgo,
          },
        },
        limit: 10000,
      },
    }),
    [fromDate, toDate, timeFrame],
  );

  const subscriptionsStats = useMemo<SubscriptionStats>(() => {
    const pageViewCount =
      platform.metric.findCount(filters.subscriptionsPageVisitsFilter) || 0;
    const subscribeButtonClickCount =
      platform.metric.findCount(filters.subscribeButtonClickFilter) || 0;
    const tier1ViewCount =
      platform.metric.findCount(filters.tier1ViewFilter) || 0;
    const tier2ViewCount =
      platform.metric.findCount(filters.tier2ViewFilter) || 0;
    const tier1CheckoutCount =
      platform.metric.findCount(filters.tier1CheckoutFilter) || 0;
    const tier2CheckoutCount =
      platform.metric.findCount(filters.tier2CheckoutFilter) || 0;
    const tier1PaymentCount =
      platform.metric.findCount(filters.tier1PaymentFilter) || 0;
    const tier2PaymentCount =
      platform.metric.findCount(filters.tier2PaymentFilter) || 0;
    const activeSubscribersCount =
      platform.user.findCount(filters.activeSubscribersCountFilter) || 0;
    const threeMonthSubscribersCount =
      platform.user.findCount(filters.threeMonthCountFilter) || 0;

    return {
      pageViewCount,
      subscribeButtonClickCount,
      tier1ViewCount,
      tier2ViewCount,
      tier1CheckoutCount,
      tier2CheckoutCount,
      tier1PaymentCount,
      tier2PaymentCount,
      activeSubscribersCount,
      threeMonthSubscribersCount,
    };
  }, [platform, filters]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      await Promise.all([
        platform.metric.getCount(filters.subscriptionsPageVisitsFilter),
        platform.metric.getCount(filters.tier1ViewFilter),
        platform.metric.getCount(filters.tier2ViewFilter),
        platform.metric.getCount(filters.tier1CheckoutFilter),
        platform.metric.getCount(filters.tier2CheckoutFilter),
        platform.metric.getCount(filters.tier1PaymentFilter),
        platform.metric.getCount(filters.tier2PaymentFilter),
        platform.user.getCount(filters.activeSubscribersCountFilter),
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, timeFrame]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    // Combine tier metrics for simplified display
    const totalViewCount = subscriptionsStats.tier1ViewCount + subscriptionsStats.tier2ViewCount;
    const totalCheckoutCount = subscriptionsStats.tier1CheckoutCount + subscriptionsStats.tier2CheckoutCount;
    const totalPaymentCount = subscriptionsStats.tier1PaymentCount + subscriptionsStats.tier2PaymentCount;

    const maxFunnelCount = Math.max(
      totalViewCount,
      totalCheckoutCount,
      totalPaymentCount,
      subscriptionsStats.activeSubscribersCount,
      1,
    ); // Prevent division by zero

    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / maxFunnelCount) * 100),
    });

    return {
      // Simplified combined metrics
      totalView: calculateStats(totalViewCount),
      totalCheckout: calculateStats(totalCheckoutCount),
      totalPayment: calculateStats(totalPaymentCount),
      activeSubscribers: calculateStats(
        subscriptionsStats.activeSubscribersCount,
      ),
      threeMonthSubscribers: calculateStats(
        subscriptionsStats.threeMonthSubscribersCount,
      ),
      conversionRate: {
        count: `${totalPaymentCount} / ${subscriptionsStats.subscribeButtonClickCount}`,
        percentage: subscriptionsStats.subscribeButtonClickCount
          ? Number(
              (
                (totalPaymentCount / subscriptionsStats.subscribeButtonClickCount) *
                100
              ).toFixed(2) || 0,
            )
          : 0,
      },
    };
  }, [subscriptionsStats]);
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard_performance_subscriptions_funnel')}
            </h3>
            <p className="text-gray-600 text-sm">{t('dashboard_performance_subscription_conversion_funnel')}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Activity Indicator */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">{t('dashboard_performance_page_views')}</span>
                <span className="text-2xl font-bold text-gray-900">
                  {subscriptionsStats.pageViewCount}
                </span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">{t('dashboard_performance_conversion_rate_label')}</span>
                <span className="text-2xl font-bold text-primary">
                  {funnelStats.conversionRate.percentage}%
                </span>
              </div>
              <div className="text-gray-600 text-xs mt-1">
                {funnelStats.conversionRate.count} {t('dashboard_performance_total_subscriptions')}
              </div>
            </div>

            {/* Funnel Steps - Single Card Design */}
            <div className="bg-white/90 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_tier_views')}</span>
                  <span className="font-bold">{funnelStats.totalView.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: '100%' }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_checkout')}</span>
                  <span className="font-bold">{funnelStats.totalCheckout.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.totalCheckout.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_payments')}</span>
                  <span className="font-bold">{funnelStats.totalPayment.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.totalPayment.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_active_subscribers')}</span>
                  <span className="font-bold">{funnelStats.activeSubscribers.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.activeSubscribers.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_3_plus_months')}</span>
                  <span className="font-bold">{funnelStats.threeMonthSubscribers.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.threeMonthSubscribers.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsFunnel;
