import Head from 'next/head';

// import { useState } from 'react';

import Heading from '../../components/ui/Heading';
import Bookings from '../../components/Bookings';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const CurrentBookings = () => {
  const { user } = useAuth();

  // const [filter, setFilter] = useState({
  //   where: {},
  // });

  const loadTime = Date.now();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const threeDaysAgo = new Date(loadTime - 3 * dayAsMs);
  const inSevenDays = new Date(loadTime + 7 * dayAsMs);
  console.log(threeDaysAgo);
  console.log(inSevenDays);
  
  const filter = {
    where: {
      // status: { $nin: ['open', 'pending'] }, // confirmed and various ways to pay...
      status: 'paid', // confirmed and various ways to pay...
      start: { $lte: inSevenDays },
      end: { $gte: threeDaysAgo },
    },
  };


  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{__('current_bookings_title')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('current_bookings_title')}</Heading>

        <Bookings filter={filter} />
      </div>
    </>
  );
};

export default CurrentBookings;
