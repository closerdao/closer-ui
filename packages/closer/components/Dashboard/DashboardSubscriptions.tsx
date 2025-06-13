import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CalendarSync } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { MAX_USERS_TO_FETCH } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { Filter } from '../../types';
import { getDateRange } from '../../utils/dashboard.helpers';
import { Heading, Spinner } from '../ui';
import DonutChart from '../ui/Charts/DonutChart';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

const DashboardSubscriptions = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { TIME_ZONE, TOKEN_PRICE, APP_NAME } = useConfig();

  const [isLoading, setIsLoading] = useState(false);

  const [userFilter, setUserFilter] = useState<Filter | null>(null);
  const [tier1SubscriptionsFilter, setTier1SubscriptionsFilter] =
    useState<Filter | null>(null);
  const [tier2SubscriptionsFilter, setTier2SubscriptionsFilter] =
    useState<Filter | null>(null);

  const usersCount = platform.user.findCount(userFilter);
  const tier1SubscriptionsCount = platform.user.findCount(
    tier1SubscriptionsFilter,
  );
  const tier2SubscriptionsCount = platform.user.findCount(
    tier2SubscriptionsFilter,
  );

  const getSubscriptionsData = () => {
    const subscriptionsData = [];

    subscriptionsData.push({
      name: 'users',
      value: usersCount,
    });
    subscriptionsData.push({
      name: 'wanderer',
      value: tier1SubscriptionsCount,
    });

    subscriptionsData.push({
      name: 'pioneer',
      value: tier2SubscriptionsCount,
    });

    return subscriptionsData;
  };
  const subscriptionsData = getSubscriptionsData();

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.user.getCount(userFilter),
        platform.user.getCount(tier1SubscriptionsFilter),
        platform.user.getCount(tier2SubscriptionsFilter),
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
  }, [userFilter, tier1SubscriptionsFilter, tier2SubscriptionsFilter]);

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });

    if (timeFrame === 'allTime') {
      setUserFilter({
        where: {},
        limit: MAX_USERS_TO_FETCH,
      });
      setTier1SubscriptionsFilter({
        where: { 'subscription.plan': { $in: ['wanderer'] } },
        limit: MAX_USERS_TO_FETCH,
      });
      setTier2SubscriptionsFilter({
        where: { 'subscription.plan': { $in: ['pioneer'] } },
        limit: MAX_USERS_TO_FETCH,
      });
    } else {
      setUserFilter({
        where: {
          $and: [{ created: { $lte: end } }, { created: { $gte: start } }],
        },

        limit: MAX_USERS_TO_FETCH,
      });
      setTier1SubscriptionsFilter({
        where: {
          $and: [
            { created: { $lte: end } },
            { created: { $gte: start } },
            { 'subscription.plan': { $in: ['wanderer'] } },
          ],
        },
        limit: MAX_USERS_TO_FETCH,
      });
      setTier2SubscriptionsFilter({
        where: {
          $and: [
            { created: { $lte: end } },
            { created: { $gte: start } },
            { 'subscription.plan': { $in: ['pioneer'] } },
          ],
        },
      });
    }
  }, [timeFrame, fromDate, toDate]);

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
