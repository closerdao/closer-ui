import Head from 'next/head';

import Bookings from '../../components/Bookings';
import Tabs from '../../components/Tabs';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';
import { parseMessageFromError } from '../../utils/common';
import api from '../../utils/api';

const bookingsToShowLimit = 50;

const BookingsDirectory = ({ bookingConfig }) => {
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const { user } = useAuth();

  const filters = {
    myBookings: user && {
      where: {
        createdBy: user._id,
        status: [
          'open',
          'pending',
          'confirmed',
          'tokens-staked',
          'credits-paid',
          'paid',
          'checked-in',
          'checked-out',
        ],
        end: {
          $gt: new Date(),
        },
      },
      limit: bookingsToShowLimit,
    },
    pastBookings: user && {
      where: {
        createdBy: user._id,
        end: { $lt: new Date() },
      },
      limit: bookingsToShowLimit,
    },
  };

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
      <div className="max-w-screen-lg mx-auto">
        <Tabs
          tabs={[
            {
              title: __('bookings_title'),
              value: 'my-bookings',
              content: <Bookings filter={filters.myBookings} />,
            },
            {
              title: __('past_bookings_title'),
              value: 'past-bookings',
              content: <Bookings filter={filters.pastBookings} />,
            },
          ].filter((tab) => tab?.content)}
        />
      </div>
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
