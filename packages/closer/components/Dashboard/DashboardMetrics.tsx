import { useTranslations } from 'next-intl';

import UserMetricsIcon from '../icons/UserMetricsIcon';
import { Heading } from '../ui';
import StackedBarChart from '../ui/Charts/StackedBarChart';

const DashboardMetrics = () => {
  const t = useTranslations();

  const metricsData = [
    {
      name: 'Accounts Created',
      Platform: 30,
      External: 0,
    },
    {
      name: 'Wallets connected',
      Platform: 12,
      External: 0,
    },
    {
      name: 'Bookings made',
      Platform: 25,
      External: 1,
    },
    {
      name: '$TDF tokens sold',
      Platform: 33,
      External: 5,
    },
    {
      name: 'Event participants',
      Platform: 24,
      External: 3,
    },
    {
      name: 'Members',
      Platform: 4,
      External: 0,
    },
  ];

  return (
    <section className="bg-white rounded-md p-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3">
        <UserMetricsIcon /> {t('dashboard_metrics')}
      </Heading>

      <StackedBarChart layout="vertical" data={metricsData} />
    </section>
  );
};

export default DashboardMetrics;