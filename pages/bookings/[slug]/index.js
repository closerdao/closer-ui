import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useState } from 'react';

import { loadStripe } from '@stripe/stripe-js';

import Layout from '../../../components/Layout';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import config from '../../../config';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import api from '../../../utils/api';
import { __, priceFormat } from '../../../utils/helpers';

dayjs.extend(LocalizedFormat);

const Booking = ({ booking, error }) => {
  const router = useRouter();
  const [editBooking, setBooking] = useState(booking);
  const stripe = loadStripe(config.STRIPE_TEST_KEY);
  const { isAuthenticated, user } = useAuth();
  const { platform } = usePlatform();

  const saveBooking = async (update) => {
    try {
      await platform.booking.patch(booking._id, update);
      router.push(`/bookings/${booking._id}`);
    } catch (err) {
      alert('An error occured.');
      console.log(err);
    }
  };

  if (!booking) {
    return <PageNotFound />;
  }

  const start = dayjs(booking.start);
  const end = dayjs(booking.end);

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <Layout>
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
            {__('bookings_status')} <b>{editBooking.status}</b>
          </p>
          <p>
            {__('bookings_checkin')} <b>{start.format('LLL')}</b>
          </p>
          <p>
            {__('bookings_checkout')} <b>{end.format('LLL')}</b>
          </p>
          <p>
            {__('bookings_total')}
            <b className={booking.volunteer ? 'line-through' : ''}>
              {' '}
              {priceFormat(booking.price)}
            </b>
            <b> {booking.volunteer && priceFormat(0, booking.price.cur)}</b>
          </p>
          <p>
            {__('bookings_id')} <b>{booking._id}</b>
          </p>
        </section>
        {booking.status === 'confirmed' && (
          <section className="mt-3">{__('bookings_confirmation')}</section>
        )}
      </main>
    </Layout>
  );
};
Booking.getInitialProps = async ({ req, query }) => {
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
