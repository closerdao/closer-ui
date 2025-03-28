import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  generateTokenSalesFilter,
  getStartAndEndDate,
} from '../../../../utils/performance.utils';
import FunnelBar from './FunnelBar';

interface TokenSaleStats {
  pageViewCount: number;
  whitepaperDownloadCount: number;
  openFlowCount: number;
  useCalculatorCount: number;
  approveCount: number;
  checkoutCount: number;
  successCount: number;
}

interface Platform {
  metric: {
    find: (filter: any) => { toJS: () => any[] };
    get: (filter: any) => Promise<any>;
    getCount: (filter: any) => Promise<number>;
    findCount: (filter: any) => number;
  };
}
const TokenSalesFunnel = ({
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
  const filters = useMemo(
    () => ({
      tokenSalePageVisitsFilter: generateTokenSalesFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'page-view',
      }),
      downloadWhitepaperFilter: generateTokenSalesFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'download-whitepaper',
      }),
      useCalculatorFilter: generateTokenSalesFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'use-calculator',
      }),
      openFlowFilter: generateTokenSalesFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'open-flow',
      }),
      checkoutFilter: generateTokenSalesFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'checkout',
      }),
      approveFilter: generateTokenSalesFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'approve',
      }),
      successFilter: {
        where: {
          event: { $in: ['token-sale'] },
          ...(timeFrame !== 'allTime' && {
            created: {
              $gte: startDate,
              $lte: endDate,
            },
          }),
        },
        limit: 10000,
      },
    }),
    [fromDate, toDate, timeFrame],
  );

  const tokenSaleStats = useMemo<TokenSaleStats>(() => {
    const pageViewCount =
      platform.metric.findCount(filters.tokenSalePageVisitsFilter) || 0;
    const whitepaperDownloadCount =
      platform.metric.findCount(filters.downloadWhitepaperFilter) || 0;
    const useCalculatorCount =
      platform.metric.findCount(filters.useCalculatorFilter) || 0;
    const openFlowCount =
      platform.metric.findCount(filters.openFlowFilter) || 0;
    const approveCount = platform.metric.findCount(filters.approveFilter) || 0;
    const checkoutCount =
      platform.metric.findCount(filters.checkoutFilter) || 0;
    const successCount = platform.metric.findCount(filters.successFilter) || 0;
    return {
      pageViewCount,
      whitepaperDownloadCount,
      useCalculatorCount,
      openFlowCount,
      approveCount,
      checkoutCount,
      successCount,
    };
  }, [platform]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      await Promise.all([
        platform.metric.getCount(filters.tokenSalePageVisitsFilter),
        platform.metric.getCount(filters.downloadWhitepaperFilter),
        platform.metric.getCount(filters.useCalculatorFilter),
        platform.metric.getCount(filters.openFlowFilter),
        platform.metric.getCount(filters.approveFilter),
        platform.metric.getCount(filters.checkoutFilter),
        platform.metric.getCount(filters.successFilter),
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    const total = Math.max(
      tokenSaleStats.pageViewCount,
      tokenSaleStats.whitepaperDownloadCount,
      tokenSaleStats.openFlowCount,
      tokenSaleStats.useCalculatorCount,
      tokenSaleStats.approveCount,
      tokenSaleStats.checkoutCount,
      tokenSaleStats.successCount,
      1,
    ); // Prevent division by zero
    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / total) * 100),
    });

    return {
      pageView: calculateStats(tokenSaleStats.pageViewCount),
      whitepaperDownload: calculateStats(
        tokenSaleStats.whitepaperDownloadCount,
      ),
      openFlow: calculateStats(tokenSaleStats.openFlowCount),
      useCalculator: calculateStats(tokenSaleStats.useCalculatorCount),
      approve: calculateStats(tokenSaleStats.approveCount),
      checkout: calculateStats(tokenSaleStats.checkoutCount),
      success: calculateStats(tokenSaleStats.successCount),
      conversionRate: {
        count: `${tokenSaleStats.successCount} / ${tokenSaleStats.pageViewCount}`,
        percentage: tokenSaleStats.successCount
          ? Number(
              (
                (tokenSaleStats.successCount / tokenSaleStats.pageViewCount) *
                100
              ).toFixed(2),
            )
          : 0,
      },
    };
  }, [tokenSaleStats]);
  return (
    <section className="w-full md:w-1/3 min-h-fit md:min-h-[600px]">
      <Card className="h-full flex flex-col justify-start">
        <Heading level={2}>
          {t('dashboard_performance_token_sales_funnel')}
        </Heading>
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            <div className="border-2 rounded-lg space-y-4 p-2 pb-4">
              <Heading level={3}>
                {t('dashboard_performance_conversion_rate')}
              </Heading>
              <FunnelBar
                label="Success / page views"
                stats={funnelStats.conversionRate}
                color="bg-accent-alt"
              />
            </div>
            <FunnelBar
              label="View Token Sale page"
              stats={funnelStats.pageView}
              color="bg-accent-alt"
            />
            <FunnelBar
              label="Download Whitepaper"
              stats={funnelStats.whitepaperDownload}
              color="bg-accent-alt"
            />
            <FunnelBar
              label="Open Flow"
              stats={funnelStats.openFlow}
              color="bg-accent-alt"
            />
            <FunnelBar
              label="Use Calculator"
              stats={funnelStats.useCalculator}
              color="bg-accent-alt"
            />
            <FunnelBar
              label="Checkout"
              stats={funnelStats.checkout}
              color="bg-accent-alt"
            />
            <FunnelBar
              label="Approve"
              stats={funnelStats.approve}
              color="bg-accent-alt"
            />
            <FunnelBar
              label="Success"
              stats={funnelStats.success}
              color="bg-accent-alt"
            />
          </div>
        )}
      </Card>
    </section>
  );
};

export default TokenSalesFunnel;
