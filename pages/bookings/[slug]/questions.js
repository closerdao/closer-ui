import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useState } from 'react';

import Layout from '../../../components/Layout';
import Switch from '../../../components/Switch';

import { useWeb3React } from '@web3-react/core';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import config from '../../../config';
import { BLOCKCHAIN_NETWORK_ID } from '../../../config_blockchain';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

dayjs.extend(LocalizedFormat);

const Booking = ({ booking, error, questions }) => {
  const router = useRouter();
  const [editBooking, setBooking] = useState(booking);
  const { isAuthenticated, user } = useAuth();
  const { platform } = usePlatform();

  console.log('questions', questions);

  const { chainId, account, activate, deactivate, setError, active, library } =
    useWeb3React();

  const saveBooking = async (update) => {
    try {
      await platform.booking.patch(booking._id, update);
      active && typeof account === 'string' && chainId === BLOCKCHAIN_NETWORK_ID
        ? router.push(`/bookings/${booking._id}/checkout`)
        : router.push(`/bookings/${booking._id}/connectwallet`);
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
        <h1 className="mb-4">{__('bookings_contribution_title')}</h1>
        {booking.status === 'open' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveBooking(editBooking);
            }}
          >
            <section>
              <h3>{__('bookings_contribution_about')}</h3>
              <textarea
                onChange={(e) =>
                  setBooking({
                    ...editBooking,
                    about: e.target.value,
                  })
                }
                value={editBooking.about}
                placeholder={__('bookings_contribution_about_placeholder')}
              />
            </section>
            <section className="mt-8">
              <h3>{__('bookings_contribution_message')}</h3>
              <textarea
                onChange={(e) =>
                  setBooking({
                    ...editBooking,
                    message: e.target.value,
                  })
                }
                value={editBooking.message}
                placeholder={__('bookings_contribution_message_placeholder')}
              />
            </section>
            {config.FEATURES.bookingVolunteers && (
              <section className="mt-8">
                <h3 className="mb-3">
                  {__('bookings_contribution_volunteer')}
                </h3>
                <Switch
                  checked={editBooking.volunteer}
                  onChange={(volunteer) =>
                    setBooking({
                      ...editBooking,
                      volunteer,
                    })
                  }
                />
              </section>
            )}
            {editBooking.volunteer && (
              <section className="mt-8">
                <h3>{__('bookings_contribution_gift')}</h3>
                <textarea
                  onChange={(e) =>
                    setBooking({
                      ...editBooking,
                      gift: e.target.value,
                    })
                  }
                  value={editBooking.gift}
                  placeholder={__('bookings_contribution_gift_placeholder')}
                />
              </section>
            )}
            <section className="mt-8">
              <button className="btn-primary">{__('generic_next')}</button>
            </section>
          </form>
        )}
      </main>
    </Layout>
  );
};
Booking.getInitialProps = async ({ req, query }) => {
  try {
    const [{
      data: { results: booking },
    }, {
      data: {
        results: questions
      }
    }] = await Promise.all([
      api.get(`/booking/${query.slug}`),
      api.get('/bookings/questions')
    ]);

    console.log('// QUESTION: ', questions)

    return { booking, questions };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default Booking;
