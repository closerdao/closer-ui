import Head from 'next/head';

import Bookings from '../../components/Bookings';
import Tabs from '../../components/Tabs';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const bookingsToShowLimit = 50;

const BookingsDirectory = () => {
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

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
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

export default BookingsDirectory;
