import Head from 'next/head';

import { useState } from 'react';

import Bookings from '../../components/Bookings';
import BookingsFilter from '../../components/BookingsFilter';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const BookingsRequests = () => {
  const { user } = useAuth();

  const [filter, setFilter] = useState({
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
        <title>{__('booking_requests_title')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('booking_requests_title')}</Heading>

        <BookingsFilter setFilter={setFilter} />

        <Bookings filter={filter} />
      </div>
    </>
  );
};

export default BookingsRequests;
