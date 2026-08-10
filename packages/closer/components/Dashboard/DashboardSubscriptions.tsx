import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CalendarSync } from 'lucide-react';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { MAX_USERS_TO_FETCH } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { Filter } from '../../types';
import { getDateRange } from '../../utils/dashboard.helpers';
import { Heading, Spinner } from '../ui';
import { getDashboardSubscriptionPlans } from './dashboardFeatures';
import { useDashboardFeatures } from './useDashboardFeatures';

const DonutChart = dynamic(() => import('../ui/Charts/DonutChart'), {
  ssr: false,
  loading: () => <Spinner />,
});

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

const DashboardSubscriptions = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { config } = useDashboardFeatures();
  const { TIME_ZONE } = config;

  const [isLoading, setIsLoading] = useState(false);

  // Plans come from the subscriptions config rather than a hardcoded
  // wanderer/pioneer pair, which rendered empty slices on every other app.
  const plans = getDashboardSubscriptionPlans(config);
  const plansKey = plans.map((plan) => plan.slug).join(',');

  const [userFilter, setUserFilter] = useState<Filter | null>(null);
  const [planFilters, setPlanFilters] = useState<Record<string, Filter>>({});

  const usersCount = platform.user.findCount(userFilter);

  const subscriptionsData = [
    { name: t('dashboard_subscriptions_all_users'), value: usersCount || 0 },
    ...plans.map((plan) => ({
      name: plan.title,
      value: platform.user.findCount(planFilters[plan.slug]) || 0,
    })),
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.user.getCount(userFilter),
        ...plans.map((plan) =>
          planFilters[plan.slug]
            ? platform.user.getCount(planFilters[plan.slug])
            : Promise.resolve(null),
        ),
      ]);
    } catch (err) {
      console.log('Error fetching  data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userFilter) {
      loadData();
    }
  }, [userFilter, planFilters]);

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });

    const createdInPeriod =
      timeFrame === 'allTime'
        ? []
        : [{ created: { $lte: end } }, { created: { $gte: start } }];

    const withPeriod = (clauses: Record<string, unknown>[]) => {
      const all = [...createdInPeriod, ...clauses];
      return all.length > 0 ? { $and: all } : {};
    };

    setUserFilter({
      where: withPeriod([]),
      limit: MAX_USERS_TO_FETCH,
    });
    setPlanFilters(
      Object.fromEntries(
        plans.map((plan) => [
          plan.slug,
          {
            where: withPeriod([{ 'subscription.plan': { $in: [plan.slug] } }]),
            limit: MAX_USERS_TO_FETCH,
          } as Filter,
        ]),
      ),
    );
  }, [timeFrame, fromDate, toDate, plansKey]);

  return (
    <section className="bg-white rounded-md px-0 sm:px-6 py-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3 items-center">
        <CalendarSync size={22} /> {t('dashboard_subscriptions_title')}
      </Heading>

      <div className=" gap-4">
        <div
          className={`${isMobile ? 'h-[280px]' : 'h-[220px]'} overflow-hidden`}
        >
          {isLoading ? (
            <Spinner />
          ) : (
            <DonutChart data={subscriptionsData || []} />
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardSubscriptions;
