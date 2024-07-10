import { useState } from 'react';

import { useTranslations } from 'next-intl';

import RevenueIcon from '../icons/RevenueIcon';
import { Card, Heading } from '../ui';
import LineChart from '../ui/Charts/LineChart';
import StackedBarChart from '../ui/Charts/StackedBarChart';
import TimeFrameSelector from './TimeFrameSelector';

const DashboardRevenue = () => {
  const t = useTranslations();
  const [timeFrame, setTimeFrame] = useState('year');

  const revenueData = [
    {
      name: 'Jul',
      Hospitality: 1000,
      Events: 500,
      Spaces: 200,
      Food: 100,
      Subscriptions: 400,
      Tokens: 200,
    },
    {
      name: 'Jun',
      Hospitality: 800,
      Events: 400,
      Spaces: 300,
      Food: 400,
      Subscriptions: 200,
      Tokens: 1200,
    },
    {
      name: 'May',
      Hospitality: 600,
      Events: 400,
      Spaces: 400,
      Food: 200,
      Subscriptions: 500,
      Tokens: 100,
    },
    {
      name: 'Apr',
      Hospitality: 550,
      Events: 400,
      Spaces: 400,
      Food: 500,
      Subscriptions: 400,
      Tokens: 100,
    },
  ];
  const tokenRevenueData = [
    {
      name: 'Jul',
      Revenue: 100,
    },
    {
      name: 'Jun',
      Revenue: 800,
    },
    {
      name: 'May',
      Revenue: 600,
    },
    {
      name: 'Apr',
      Revenue: 550,
    },
  ];

  return (
    <section className="bg-white rounded-md p-6 flex flex-col gap-6">
      <div className="flex justify-between">
        <Heading level={3} className="uppercase text-md flex gap-3">
          <RevenueIcon /> {t('dashboard_revenue_title')}
        </Heading>
        <TimeFrameSelector timeFrame={timeFrame} setTimeFrame={setTimeFrame} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_general_revenue')}
          </Heading>
          <StackedBarChart data={revenueData} />
        </Card>

        <Card className="col-span-1 p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_token_revenue')}
          </Heading>
          <LineChart data={tokenRevenueData} />
        </Card>
      </div>
    </section>
  );
};

export default DashboardRevenue;
