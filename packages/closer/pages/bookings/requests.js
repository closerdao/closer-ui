import Head from 'next/head';

import Bookings from '../../components/Bookings';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const BookingsRequests = () => {
  const { user } = useAuth();
  const filters = {
    openBookings: user && {
      where: {
        status: ['pending'],
        end: {
          $gt: new Date(),
        },
      },
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
        <title>{__('booking_requests_title')}</title>
      </Head>
      <div className="main-content intro fullwidth">
        <h1 className="page-title">{__('booking_requests_title')}</h1>
        <Bookings filter={filters.openBookings} />
      </div>
    </>
  );
};

export default BookingsRequests;
