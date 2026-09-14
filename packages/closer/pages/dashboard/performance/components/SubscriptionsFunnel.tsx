import { useCallback, useEffect, useMemo, useState } from 'react';

import { Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  generateSubscribeButtonClickFilter,
  generateSubscriptionsFilter,
  getStartAndEndDate,
} from '../../../../utils/performance.utils';

interface SubscriptionStats {
  pageViewCount: number;
  subscribeButtonClickCount: number;
  planViewCount: number;
  checkoutCount: number;
  paymentCount: number;
  activeSubscribersCount: number;
  threeMonthSubscribersCount: number;
}

/**
 * Each step used to be split into `tier-1-*` / `tier-2-*` by whether the plan
 * was titled "Wanderer", so every platform but TDF filed all of its traffic
 * under tier 2 — and the card summed the pair back together anyway. One event
 * per step now, with the plan slug in the metric's `value`. The retired names
 * are still counted so windows reaching back before the change hold up; no
 * checkout is counted twice, because each mount logged exactly one of these.
 */
const PLAN_VIEW_EVENTS = [
  'subscription-plan-view',
  'tier-1-page-view',
  'tier-2-page-view',
];
const CHECKOUT_EVENTS = [
  'subscription-checkout',
  'tier-1-checkout',
  'tier-2-checkout',
];
// `subscription-checkout-started` is deliberately absent: it was logged on the
// same mount as `tier-*-checkout`, so counting it would double every checkout
// in the span where both existed. It is no longer emitted.
const PAYMENT_EVENTS = [
  'subscription-first-payment',
  'tier-1-first-payment',
  'tier-2-first-payment',
];

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
  const { startDate } = getStartAndEndDate(timeFrame, fromDate, toDate);

  const [, setError] = useState<string | null>(null);
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
      planViewFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: PLAN_VIEW_EVENTS,
      }),
      checkoutFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: CHECKOUT_EVENTS,
      }),
      paymentFilter: generateSubscriptionsFilter({
        fromDate,
        toDate,
        timeFrame,
        event: PAYMENT_EVENTS,
      }),
      activeSubscribersCountFilter: {
        where: {
          'subscription.subscribeDate': { $exists: true, $gte: startDate },
        },
        limit: 10000,
      },
      // Subscribers who have been paying for three months or more. Deliberately
      // not bounded by the selected window's start: that would ask for a
      // subscribeDate both after the window opened and over three months old,
      // which is an empty range for every window shorter than three months.
      threeMonthCountFilter: {
        where: {
          'subscription.subscribeDate': {
            $exists: true,
            $lte: threeMonthsAgo,
          },
        },
        limit: 10000,
      },
    }),
    [fromDate, toDate, timeFrame],
  );

  // Read the store on every render rather than memoising on `platform`: the
  // context hands out one object for the life of the app that reads through a
  // ref, so a memo keyed on it would never see the counts arrive and would
  // freeze this funnel at the zeros it read before the first request landed.
  const subscriptionsStats: SubscriptionStats = (() => {
    const pageViewCount =
      platform.metric.findCount(filters.subscriptionsPageVisitsFilter) || 0;
    const subscribeButtonClickCount =
      platform.metric.findCount(filters.subscribeButtonClickFilter) || 0;
    const planViewCount =
      platform.metric.findCount(filters.planViewFilter) || 0;
    const checkoutCount =
      platform.metric.findCount(filters.checkoutFilter) || 0;
    const paymentCount = platform.metric.findCount(filters.paymentFilter) || 0;
    const activeSubscribersCount =
      platform.user.findCount(filters.activeSubscribersCountFilter) || 0;
    const threeMonthSubscribersCount =
      platform.user.findCount(filters.threeMonthCountFilter) || 0;

    return {
      pageViewCount,
      subscribeButtonClickCount,
      planViewCount,
      checkoutCount,
      paymentCount,
      activeSubscribersCount,
      threeMonthSubscribersCount,
    };
  })();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      await Promise.all([
        platform.metric.getCount(filters.subscriptionsPageVisitsFilter),
        platform.metric.getCount(filters.subscribeButtonClickFilter),
        platform.metric.getCount(filters.planViewFilter),
        platform.metric.getCount(filters.checkoutFilter),
        platform.metric.getCount(filters.paymentFilter),
        platform.user.getCount(filters.activeSubscribersCountFilter),
        platform.user.getCount(filters.threeMonthCountFilter),
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

  const funnelStats = (() => {
    const totalViewCount = subscriptionsStats.planViewCount;
    const totalCheckoutCount = subscriptionsStats.checkoutCount;
    const totalPaymentCount = subscriptionsStats.paymentCount;

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
                (totalPaymentCount /
                  subscriptionsStats.subscribeButtonClickCount) *
                100
              ).toFixed(2) || 0,
            )
          : 0,
      },
    };
  })();
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
                  <span className="text-sm font-medium">{t('dashboard_performance_plan_views')}</span>
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
