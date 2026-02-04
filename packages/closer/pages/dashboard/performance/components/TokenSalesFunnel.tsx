import { useCallback, useEffect, useMemo, useState } from 'react';

import { Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  generateTokenSalesFilter,
  generateTokenBasketFilter,
  generateFinancedTokenStartedFilter,
  generateFinancedTokenBasketFilter,
  getStartAndEndDate,
} from '../../../../utils/performance.utils';

interface TokenSaleStats {
  pageViewCount: number;
  whitepaperDownloadCount: number;
  openFlowCount: number;
  useCalculatorCount: number;
  approveCount: number;
  checkoutCount: number;
  successCount: number;
  totalTokensSold: number;
  financedTokenStartedCount: number;
  totalFinancedTokensSold: number;
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

  const [, setError] = useState(null);
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
      tokenBasketFilter: generateTokenBasketFilter({
        fromDate,
        toDate,
        timeFrame,
      }),
      financedTokenStartedFilter: generateFinancedTokenStartedFilter({
        fromDate,
        toDate,
        timeFrame,
      }),
      financedTokenBasketFilter: generateFinancedTokenBasketFilter({
        fromDate,
        toDate,
        timeFrame,
      }),
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
    
    // Calculate total tokens sold from basket data
    const tokenBasketData = platform.metric.find(filters.tokenBasketFilter);
    const totalTokensSold = tokenBasketData?.toJS().reduce((sum: number, item: any) => {
      return sum + (item.point || 0);
    }, 0) || 0;
    
    // Calculate financed token metrics
    const financedTokenStartedCount = platform.metric.findCount(filters.financedTokenStartedFilter) || 0;
    const financedTokenBasketData = platform.metric.find(filters.financedTokenBasketFilter);
    const totalFinancedTokensSold = financedTokenBasketData?.toJS().reduce((sum: number, item: any) => {
      return sum + (item.point || 0);
    }, 0) || 0;
    
    return {
      pageViewCount,
      whitepaperDownloadCount,
      useCalculatorCount,
      openFlowCount,
      approveCount,
      checkoutCount,
      successCount,
      totalTokensSold,
      financedTokenStartedCount,
      totalFinancedTokensSold,
    };
  }, [platform, filters]);

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
    const maxFunnelCount = Math.max(
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
      percentage: Math.round((count / maxFunnelCount) * 100),
    });

    return {
      whitepaperDownload: calculateStats(
        tokenSaleStats.whitepaperDownloadCount,
      ),
      openFlow: calculateStats(tokenSaleStats.openFlowCount),
      useCalculator: calculateStats(tokenSaleStats.useCalculatorCount),
      approve: calculateStats(tokenSaleStats.approveCount),
      checkout: calculateStats(tokenSaleStats.checkoutCount),
      success: calculateStats(tokenSaleStats.successCount),
      conversionRate: {
        count: `${tokenSaleStats.successCount} / ${tokenSaleStats.openFlowCount}`,
        percentage: tokenSaleStats.openFlowCount
          ? Number(
              (
                (tokenSaleStats.successCount / tokenSaleStats.openFlowCount) *
                100
              ).toFixed(2),
            )
          : 0,
      },
    };
  }, [tokenSaleStats]);
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard_performance_token_sales_funnel')}
            </h3>
            <p className="text-gray-600 text-sm">{t('dashboard_performance_token_purchase_journey')}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Activity Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-xs font-medium">{t('dashboard_performance_page_views')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {tokenSaleStats.pageViewCount}
                  </span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-xs font-medium">{t('dashboard_performance_whitepaper_downloads')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {funnelStats.whitepaperDownload.count}
                  </span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-xs font-medium">{t('dashboard_performance_tokens_sold')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {tokenSaleStats.totalTokensSold}
                  </span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-xs font-medium">{t('dashboard_performance_financed_started')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {tokenSaleStats.financedTokenStartedCount}
                  </span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-xs font-medium">{t('dashboard_performance_financed_tokens')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {tokenSaleStats.totalFinancedTokensSold}
                  </span>
                </div>
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
                {funnelStats.conversionRate.count} {t('dashboard_performance_successful_purchases')}
              </div>
            </div>

            {/* Funnel Steps - Single Card Design */}
            <div className="bg-white/90 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_open_flow')}</span>
                  <span className="font-bold">{funnelStats.openFlow.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: '100%' }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_use_calculator')}</span>
                  <span className="font-bold">{funnelStats.useCalculator.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.useCalculator.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_checkout')}</span>
                  <span className="font-bold">{funnelStats.checkout.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.checkout.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_approve')}</span>
                  <span className="font-bold">{funnelStats.approve.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.approve.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_success')}</span>
                  <span className="font-bold">{funnelStats.success.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.success.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenSalesFunnel;