import Head from 'next/head';

import CurrentBooking from '../../components/CurrentBooking';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const CurrentBookings = () => {
  const { enabledConfigs } = useConfig();
  const { user } = useAuth();

  const loadTime = Date.now();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const threeDaysAgo = new Date(loadTime - 3 * dayAsMs);
  const inSevenDays = new Date(loadTime + 7 * dayAsMs);

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (
    process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true' ||
    !enabledConfigs.includes('booking')
  ) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{__('current_bookings_title')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('current_bookings_title')}</Heading>

        <CurrentBooking leftAfter={threeDaysAgo} arriveBefore={inSevenDays} />
      </div>
    </>
  );
};

export default CurrentBookings;
