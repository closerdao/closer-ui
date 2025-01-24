import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  DateRange,
  generateSubscriptionsFilter,
} from '../../../../utils/performance.utils';
import FunnelBar from './FunnelBar';

interface SubscriptionStats {
  pageViewCount: number;
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
const SubscriptionsFunnel = ({ dateRange }: { dateRange: DateRange }) => {
  const { platform } = usePlatform() as { platform: Platform };
  const t = useTranslations();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filters = useMemo(
    () => ({
      subscriptionsPageVisitsFilter: generateSubscriptionsFilter(
        dateRange,
        'page-view',
      ),
      tier1ViewFilter: generateSubscriptionsFilter(
        dateRange,
        'tier-1-page-view',
      ),
      tier2ViewFilter: generateSubscriptionsFilter(
        dateRange,
        'tier-2-page-view',
      ),
      tier1CheckoutFilter: generateSubscriptionsFilter(
        dateRange,
        'tier-1-checkout',
      ),
      tier2CheckoutFilter: generateSubscriptionsFilter(
        dateRange,
        'tier-2-checkout',
      ),
      tier1PaymentFilter: generateSubscriptionsFilter(
        dateRange,
        'tier-1-first-payment',
      ),
      tier2PaymentFilter: generateSubscriptionsFilter(
        dateRange,
        'tier-2-first-payment',
      ),
      activeSubscribersCountFilter: {
        where: {
          'subscription.createdAt': { $exists: true, $ne: null },
        },
        limit: 10000,
      },
      threeMonthCountFilter: {
        where: {
          'subscription.createdAt': {
            $exists: true,
            $ne: null,
            $lte: threeMonthsAgo,
          },
        },
        limit: 10000,
      },
    }),
    [dateRange],
  );

  const subscriptionsStats = useMemo<SubscriptionStats>(() => {
    const pageViewCount =
      platform.metric.findCount(filters.subscriptionsPageVisitsFilter) || 0;
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
        platform.user.getCount(filters.threeMonthCountFilter),
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    const total = Math.max(
      subscriptionsStats.pageViewCount,
      subscriptionsStats.tier1ViewCount,
      subscriptionsStats.tier2ViewCount,
      subscriptionsStats.tier1CheckoutCount,
      subscriptionsStats.tier2CheckoutCount,
      subscriptionsStats.tier1PaymentCount,
      subscriptionsStats.tier2PaymentCount,
      subscriptionsStats.activeSubscribersCount,
      subscriptionsStats.threeMonthSubscribersCount,

      1,
    ); // Prevent division by zero

    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / total) * 100),
    });

    return {
      pageView: calculateStats(subscriptionsStats.pageViewCount),
      tier1View: calculateStats(subscriptionsStats.tier1ViewCount),
      tier2View: calculateStats(subscriptionsStats.tier2ViewCount),
      tier1Checkout: calculateStats(subscriptionsStats.tier1CheckoutCount),
      tier2Checkout: calculateStats(subscriptionsStats.tier2CheckoutCount),
      tier1Payment: calculateStats(subscriptionsStats.tier1PaymentCount),
      tier2Payment: calculateStats(subscriptionsStats.tier2PaymentCount),
      activeSubscribers: calculateStats(
        subscriptionsStats.activeSubscribersCount,
      ),
      threeMonthSubscribers: calculateStats(
        subscriptionsStats.threeMonthSubscribersCount,
      ),
      conversionRate: {
        count:
          subscriptionsStats.tier1PaymentCount +
          subscriptionsStats.tier2PaymentCount,
        percentage: Number(
          (
            ((subscriptionsStats.tier1PaymentCount +
              subscriptionsStats.tier2PaymentCount) /
              subscriptionsStats.pageViewCount) *
            100
          ).toFixed(2),
        ),
      },
    };
  }, [subscriptionsStats]);
  return (
    <section className="w-full md:w-1/3 min-h-fit md:min-h-[600px]">
      <Card className="justify-start">
        <Heading level={2}>
          {t('dashboard_performance_subscriptions_funnel')}
        </Heading>
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="border-2 rounded-lg space-y-4 p-2 pb-4">
              <Heading level={3}>
                {t('dashboard_performance_conversion_rate')}
              </Heading>
              <FunnelBar
                label="First payments / page views"
                stats={funnelStats.conversionRate}
                color="bg-accent-dark"
              />
            </div>
            <FunnelBar
              label="Subscriptions page views"
              stats={funnelStats.pageView}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Tier 1 page views"
              stats={funnelStats.tier1View}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Tier 2 page views"
              stats={funnelStats.tier2View}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Tier 1 checkout"
              stats={funnelStats.tier1Checkout}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Tier 2 checkout"
              stats={funnelStats.tier2Checkout}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Tier 1 payment"
              stats={funnelStats.tier1Payment}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Tier 2 payment"
              stats={funnelStats.tier2Payment}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="Active subscribers"
              stats={funnelStats.activeSubscribers}
              color="bg-accent-dark"
            />
            <FunnelBar
              label="3+ months"
              stats={funnelStats.threeMonthSubscribers}
              color="bg-accent-dark"
            />
          </div>
        )}
      </Card>
    </section>
  );
};

export default SubscriptionsFunnel;
