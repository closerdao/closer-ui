import Head from 'next/head';

import { useState } from 'react';

import Bookings from '../../components/Bookings';
import BookingsFilter from '../../components/BookingsFilter';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const AllBookingsRequestsPage = () => {
  const { enabledConfigs } = useConfig();
  const { user } = useAuth();

  const defaultWhere = {
    status: { $ne: 'open' },
  };

  const [filter, setFilter] = useState({
    where: defaultWhere,
  });
  const [page, setPage] = useState(1);

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
        <title>{__('booking_requests_title_all')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('booking_requests_title_all')}</Heading>
        <BookingsFilter
          setFilter={setFilter}
          page={page}
          setPage={setPage}
          defaultWhere={defaultWhere}
        />

        <Bookings
          filter={filter}
          setPage={setPage}
          page={page}
          isPagination={true}
        />
      </div>
    </>
  );
};

export default AllBookingsRequestsPage;
