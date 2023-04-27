import Head from 'next/head';

import PageError from '../../../components/PageError';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { __, priceFormat } from '../../../utils/helpers';

dayjs.extend(LocalizedFormat);

const Booking = ({ booking, error }) => {
  // TODO: update cards with proper buttons and event and volunteer data
  const { isAuthenticated } = useAuth();

  if (!booking || process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  const start = dayjs(booking.start);
  const end = dayjs(booking.end);

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <Head>
        <title>{booking.name}</title>
        <meta name="description" content={booking.description} />
        <meta property="og:type" content="booking" />
      </Head>
      <main className="main-content max-w-prose booking">
        <h1 className="mb-4">{__(`bookings_title_${booking.status}`)}</h1>
        <section className="mt-3">
          <h3>{__('bookings_summary')}</h3>
          <p>
            {__('bookings_status')} <b>{booking.status}</b>
          </p>
          <p>
            {__('bookings_checkin')} <b>{start.format('LLL')}</b>
          </p>
          <p>
            {__('bookings_checkout')} <b>{end.format('LLL')}</b>
          </p>
          <p>
            {__('bookings_total')}
            <b>{booking.total ? priceFormat(booking.total?.val, booking.total?.cur) : 0}</b>
          </p>
          <p>
            {__('bookings_id')} <b>{booking._id}</b>
          </p>
        </section>
        {booking.status === 'confirmed' && (
          <section className="mt-3">{__('bookings_confirmation')}</section>
        )}
      </main>
    </>
  );
};
Booking.getInitialProps = async ({ query }) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);
    return { booking };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default Booking;
