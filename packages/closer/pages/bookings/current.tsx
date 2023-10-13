import Head from 'next/head';

import { useState } from 'react';

import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const CurrentBookings = () => {
  const { user } = useAuth();

  const [filter, setFilter] = useState({
    where: {},
  });

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

        <p>TODO: Write some code here....</p>
      </div>
    </>
  );
};

export default CurrentBookings;
