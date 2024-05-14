import Head from 'next/head';

import UserBookings from '../../components/UserBookings';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const BookingsDirectory = ({ bookingConfig }) => {
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const { user } = useAuth();

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  if (!user) {
    return <PageNotFound error="User not logged in." />;
  }

  return (
    <>
      <Head>
        <title>{__('bookings_title')}</title>
      </Head>

      <UserBookings user={user} />
    </>
  );
};

BookingsDirectory.getInitialProps = async () => {
  try {
    const bookingRes = await api.get('/config/booking').catch(() => {
      return null;
    });
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      bookingConfig,
    };
  } catch (err) {
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default BookingsDirectory;
