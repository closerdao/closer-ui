import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  generateCitizenshipFilter,
  getStartAndEndDate,
} from '../../../../utils/performance.utils';
import FunnelBar from './FunnelBar';

interface CitizenshipStats {
  pageViewCount: number;
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
    const total = Math.max(
      citizenshipStats.pageViewCount,
      citizenshipStats.appliedCount,
      citizenshipStats.qualifiedCount,
      citizenshipStats.bought30TokensCount,
      citizenshipStats.becameCitizenCount,
      1,
    ); // Prevent division by zero

    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / total) * 100),
    });

    return {
      pageView: calculateStats(citizenshipStats.pageViewCount),
      applied: calculateStats(citizenshipStats.appliedCount),
      qualified: calculateStats(citizenshipStats.qualifiedCount),
      bought30Tokens: calculateStats(citizenshipStats.bought30TokensCount),
      becameCitizen: calculateStats(citizenshipStats.becameCitizenCount),
      conversionRate: {
        count: `${citizenshipStats.becameCitizenCount} / ${citizenshipStats.pageViewCount}`,
        percentage: Number(
          (
            (citizenshipStats.becameCitizenCount /
              citizenshipStats.pageViewCount) *
            100
          ).toFixed(2) || 0,
        ),
      },
    };
  }, [citizenshipStats]);

  return (
    <section className="w-full md:w-1/3 min-h-fit md:min-h-[600px]">
      <Card className="h-full flex flex-col justify-start">
        <Heading level={2}>
          {t('dashboard_performance_citizenship_funnel')}
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
                label="Citizens / page views"
                stats={funnelStats.conversionRate}
                color="bg-accent-light"
              />
            </div>
            <FunnelBar
              label="Citizenship page views"
              stats={funnelStats.pageView}
              color="bg-accent-light"
            />
            <FunnelBar
              label="Applied"
              stats={funnelStats.applied}
              color="bg-accent-light"
            />
            <FunnelBar
              label="Qualified"
              stats={funnelStats.qualified}
              color="bg-accent-light"
            />
            <FunnelBar
              label="Bought 30+ tokens"
              stats={funnelStats.bought30Tokens}
              color="bg-accent-light"
            />
            <FunnelBar
              label="Became citizen"
              stats={funnelStats.becameCitizen}
              color="bg-accent-light"
            />
          </div>
        )}
      </Card>
    </section>
  );
};

export default CitizenshipFunnel;
