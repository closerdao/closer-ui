import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { getDateRange } from '../../utils/dashboard.helpers';
import {
  DashboardStatSpec,
  StatRange,
  fetchStatValue,
  formatStatValue,
  getDashboardStatSpecs,
  getPreviousRange,
  getStatDelta,
} from '../../utils/dashboardStats.helpers';
import StatCard from './StatCard';
import { getDashboardSubscriptionPlans } from './dashboardFeatures';
import { useDashboardFeatures } from './useDashboardFeatures';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

type StatValues = Record<string, number>;

const DashboardStats = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { features, config } = useDashboardFeatures();
  const { TIME_ZONE } = config;

  const [isLoading, setIsLoading] = useState(true);
  const [values, setValues] = useState<StatValues>({});
  const [previousValues, setPreviousValues] = useState<StatValues>({});

  // A cheap pure derivation, and the config object identity is not stable
  // across app renders — so the effect keys off the stable ids below instead.
  const planSlugs = getDashboardSubscriptionPlans(config).map(
    (plan) => plan.slug,
  );
  const specs = getDashboardStatSpecs(features, {
    subscriptionPlanSlugs: planSlugs,
  });

  const specsRef = useRef<DashboardStatSpec[]>(specs);
  specsRef.current = specs;

  const hasRange = timeFrame !== 'custom' || Boolean(fromDate && toDate);
  const { start, end } = getDateRange({
    timeFrame,
    fromDate,
    toDate,
    timeZone: TIME_ZONE,
  });

  const isAllTime = timeFrame === 'allTime';
  const startTime = start?.getTime();
  const endTime = end?.getTime();
  const specsKey = `${specs.map((spec) => spec.id).join('|')}::${planSlugs.join(
    ',',
  )}`;

  useEffect(() => {
    if (!hasRange || !startTime || !endTime) {
      setIsLoading(false);
      return;
    }

    const range: StatRange = {
      start: new Date(startTime),
      end: new Date(endTime),
      isAllTime,
    };
    const currentSpecs = specsRef.current;
    const previousRange = getPreviousRange(range);
    const flowSpecs = currentSpecs.filter((spec) => spec.mode === 'flow');

    let isStale = false;
    setIsLoading(true);

    (async () => {
      const [currentResults, previousResults] = await Promise.all([
        Promise.all(
          currentSpecs.map((spec) => fetchStatValue(spec.buildQuery(range))),
        ),
        previousRange
          ? Promise.all(
              flowSpecs.map((spec) =>
                fetchStatValue(spec.buildQuery(previousRange)),
              ),
            )
          : Promise.resolve([] as number[]),
      ]);

      if (isStale) return;

      const nextValues: StatValues = {};
      currentSpecs.forEach((spec, index) => {
        nextValues[spec.id] = currentResults[index];
      });

      const nextPrevious: StatValues = {};
      flowSpecs.forEach((spec, index) => {
        if (previousRange) nextPrevious[spec.id] = previousResults[index];
      });

      setValues(nextValues);
      setPreviousValues(nextPrevious);
      setIsLoading(false);
    })();

    return () => {
      isStale = true;
    };
  }, [hasRange, startTime, endTime, isAllTime, specsKey]);

  const comparisonHint = isAllTime
    ? undefined
    : t('dashboard_stats_vs_previous_period');

  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {specs.map((spec) => {
          const isStock = spec.mode === 'stock';
          const delta = isStock
            ? null
            : getStatDelta(values[spec.id] ?? 0, previousValues[spec.id]);

          return (
            <StatCard
              key={spec.id}
              label={t(spec.labelKey)}
              value={values[spec.id] ?? null}
              delta={delta}
              hint={isStock ? t('dashboard_stats_total') : comparisonHint}
              isLoading={isLoading}
              formatValue={formatStatValue}
            />
          );
        })}
      </div>
    </section>
  );
};

export default DashboardStats;
