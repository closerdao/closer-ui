import Head from 'next/head';

import { useState } from 'react';

import Bookings from '../../components/Bookings';
// import BookingsFilter from '../../components/BookingsFilter';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const loadTime = new Date();

interface Props {
  bookingConfig: any;
}

const BookingsRequests = ({ bookingConfig }: Props) => {
  const isBookingEnabled =
  bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const defaultWhere = {
    end: { $gte: loadTime },
    status: 'pending',
  };

  const [filter] = useState({
    where: defaultWhere,
    sort_by: '-created',
  });

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{__('booking_requests_title')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('booking_requests_title')}</Heading>

        <Bookings
          isPagination={false}
          filter={filter}
          setPage={setPage}
          page={page}
        />
      </div>
    </>
  );
};

BookingsRequests.getInitialProps = async () => {
  try {
    const bookingRes = await api.get('/config/booking').catch(() => {
      return null;
    });
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      bookingConfig,
    };
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default BookingsRequests;
