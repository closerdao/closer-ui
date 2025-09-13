import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  generateCitizenshipFilter,
  generateButtonClickFilter,
  getStartAndEndDate,
} from '../../../../utils/performance.utils';

interface CitizenshipStats {
  pageViewCount: number;
  becomeCitizenButtonClickCount: number;
  appliedCount: number;
  qualifiedCount: number;
  bought30TokensCount: number;
  becameCitizenCount: number;
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

const CitizenshipFunnel = ({
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
      citizenshipPageVisitsFilter: generateCitizenshipFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'page-view',
      }),
      becomeCitizenButtonClickFilter: generateButtonClickFilter({
        fromDate,
        toDate,
        timeFrame,
        buttonType: 'citizenship',
      }),
      appliedFilter: generateCitizenshipFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'citizen-applied',
      }),
      qualifiedFilter: generateCitizenshipFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'citizen-qualified',
      }),
      bought30TokensFilter: generateCitizenshipFilter({
        fromDate,
        toDate,
        timeFrame,
        event: 'citizen-bought-30-tokens',
      }),
      becameCitizenFilter: {
        where: {
          'citizenship.status': 'completed',
          ...(timeFrame !== 'allTime' && {
            'citizenship.createdAt': {
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

  const citizenshipStats = useMemo<CitizenshipStats>(() => {
    const pageViewCount =
      platform.metric.findCount(filters.citizenshipPageVisitsFilter) || 0;
    const becomeCitizenButtonClickCount =
      platform.metric.findCount(filters.becomeCitizenButtonClickFilter) || 0;
    const appliedCount =
      platform.metric.findCount(filters.appliedFilter) || 0;
    const qualifiedCount =
      platform.metric.findCount(filters.qualifiedFilter) || 0;
    const bought30TokensCount =
      platform.metric.findCount(filters.bought30TokensFilter) || 0;
    const becameCitizenCount =
      platform.user.findCount(filters.becameCitizenFilter) || 0;

    return {
      pageViewCount,
      becomeCitizenButtonClickCount,
      appliedCount,
      qualifiedCount,
      bought30TokensCount,
      becameCitizenCount,
    };
  }, [platform, filters]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      await Promise.all([
        platform.metric.getCount(filters.citizenshipPageVisitsFilter),
        platform.metric.getCount(filters.appliedFilter),
        platform.metric.getCount(filters.qualifiedFilter),
        platform.metric.getCount(filters.bought30TokensFilter),
        platform.user.getCount(filters.becameCitizenFilter),
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
    const maxFunnelCount = Math.max(
      citizenshipStats.appliedCount,
      citizenshipStats.qualifiedCount,
      citizenshipStats.bought30TokensCount,
      citizenshipStats.becameCitizenCount,
      1,
    ); // Prevent division by zero

    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / maxFunnelCount) * 100),
    });

    return {
      applied: calculateStats(citizenshipStats.appliedCount),
      qualified: calculateStats(citizenshipStats.qualifiedCount),
      bought30Tokens: calculateStats(citizenshipStats.bought30TokensCount),
      becameCitizen: calculateStats(citizenshipStats.becameCitizenCount),
      conversionRate: {
        count: `${citizenshipStats.becameCitizenCount} / ${citizenshipStats.becomeCitizenButtonClickCount}`,
        percentage: citizenshipStats.becomeCitizenButtonClickCount
          ? Number(
              (
                (citizenshipStats.becameCitizenCount /
                  citizenshipStats.becomeCitizenButtonClickCount) *
                100
              ).toFixed(2) || 0,
            )
          : 0,
      },
    };
  }, [citizenshipStats]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard_performance_citizenship_funnel')}
            </h3>
            <p className="text-gray-600 text-sm">{t('dashboard_performance_citizenship_application_journey')}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                  {citizenshipStats.pageViewCount}
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
                {funnelStats.conversionRate.count} {t('dashboard_performance_citizens_converted')}
              </div>
            </div>

            {/* Funnel Steps - Single Card Design */}
            <div className="bg-white/90 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_applied')}</span>
                  <span className="font-bold">{funnelStats.applied.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: '100%' }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_qualified')}</span>
                  <span className="font-bold">{funnelStats.qualified.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.qualified.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_bought_30_plus_tokens')}</span>
                  <span className="font-bold">{funnelStats.bought30Tokens.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.bought30Tokens.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_became_citizen')}</span>
                  <span className="font-bold">{funnelStats.becameCitizen.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.becameCitizen.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenshipFunnel;
