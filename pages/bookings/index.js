import Head from 'next/head';
import Layout from '../../components/Layout';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';
import Tabs from '../../components/Tabs';
import MyBookings from '../../components/MyBookings';
import PastBookings from '../../components/PastBookings';

const Bookings = () => {
  const { user } = useAuth();

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
          tabs={ [
            {
              title: __('bookings_title'),
              value: 'my-bookings',
              content: <MyBookings />
            },
            {
              title: __('past_bookings_title'),
              value: 'past-bookings',
              content: <PastBookings />
            },
          ] }
        />
      </div>
    </Layout>
  );
};

export default Bookings;
