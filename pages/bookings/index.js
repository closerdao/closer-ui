import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import BookingListPreview from '../../components/BookingListPreview';
import { __ } from '../../utils/helpers';
import PageNotFound from '../404';

const Bookings = () => {
  const { user } = useAuth();
  const { platform } = usePlatform();
  const bookingFilter = user && { where: { createdBy: user._id } };

  const loadData = async () => {
    await Promise.all([
      platform.booking.get(bookingFilter)
    ]);
  }

  useEffect(() => {
    if (user && user._id){
      loadData();
    }
  }, [user]);

  if (!user) {
    return <PageNotFound error="User not logged in." />;
  }

  const bookings = platform.booking.find(bookingFilter);
  
  return (
    <Layout>
      <Head>
        <title>{ __('bookings_title') }</title>
      </Head>
      { bookings && bookings.get('error') &&
        <div className="validation-error">{ bookings.get('error') }</div>
      }
      <div className="main-content intro fullwidth">
        <div className="columns">
          <div className="col lg two-third">
            <div className="page-header">
              <h1>{ __('bookings_title') }</h1>
            </div>
            <div className="bookings-list">
              { bookings && bookings.count() > 0 ?
                bookings.map(booking => <BookingListPreview key={ booking.get('_id') } booking={ booking } />):
                'No Bookings'
              }
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Bookings;
