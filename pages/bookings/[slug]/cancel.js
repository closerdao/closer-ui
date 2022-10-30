import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import PageNotFound from '../../404';
import PageNotAllowed from '../../401';

import { useAuth } from '../../../contexts/auth';

import { priceFormat, __ } from '../../../utils/helpers';
import api from '../../../utils/api';

import Layout from '../../../components/Layout';
import CancelCompleted from '../../../components/CancelCompleted';
import CancelBooking from '../../../components/CancelBooking';

const BookingCancelPage = ({ booking, error, policy }) => {
  const router = useRouter();
  const bookingId = router.query.slug
  const { isAuthenticated } = useAuth()
  const [isCancelCompleted, setCancelCompleted] = useState(false)

  if (!booking || error) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />
  }

  return (
    <Layout>
      <Head>
        <title>{`${bookingId} ${__('cancel_booking_page_title')}`}</title>
        <meta name="description" content={__('cancel_booking_page_title')} />
        <meta property="og:type" content="booking" />
      </Head>
      {isCancelCompleted 
        ? <CancelCompleted /> 
        : <CancelBooking 
          bookingId={bookingId} 
          policy={policy} 
          setCancelCompleted={setCancelCompleted}
        />
      }
    </Layout>
  );
}

BookingCancelPage.getInitialProps = async ({ query }) => {
  try {
    // const policyPromise = api.get('/bookings/cancelation-policy');
    const bookingPromise = api.get(`/booking/${query.slug}`);
    const [bookingRes] = await Promise.all([bookingPromise])
    // console.log(policyRes)
    const props = { booking: bookingRes.data.results }
    return props 
  } catch (err) {
    console.error('Error', err.message);
    return {
      error: err.message
    };
  }
}

export default BookingCancelPage;
