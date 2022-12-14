import Head from 'next/head';

import Bookings from '../../components/Bookings';
import Layout from '../../components/Layout';
import Tabs from '../../components/Tabs';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const BookingsDirectory = () => {
  const { user } = useAuth();

  const filters = {
    myBookings: user && {
      where: {
        createdBy: user._id,
        status: ['open', 'pending', 'confirmed', 'checkedIn', 'checkedOut'],
        end: {
          $gt: new Date(),
        },
      },
    },
    pastBookings: user && {
      where: {
        createdBy: user._id,
        end: { $lt: new Date() },
      },
    },
  };

  if (!user) {
    return <PageNotFound error="User not logged in." />;
  }

  return (
    <Layout>
      <Head>
        <title>{__('bookings_title')}</title>
      </Head>
      <div className="main-content intro fullwidth">
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
          ]}
        />
      </div>
    </Layout>
  );
};

export default BookingsDirectory;
