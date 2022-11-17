import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import EventsList from '../../components/EventsList';
import Layout from '../../components/Layout';

import { PERMISSIONS, PLATFORM_NAME } from '../../config';
import { useAuth } from '../../contexts/auth.js';
import { __ } from '../../utils/helpers';

const now = new Date();

const Events = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <Head>
        <title>
          {PLATFORM_NAME} {__('events_title')}
        </title>
      </Head>
      <div className="main-content intro">
        <div className="page-title flex justify-between">
          <h1 className="mb-4">{__('events_upcoming')}</h1>
          <div className="action">
            {user &&
              (!PERMISSIONS ||
                !PERMISSIONS.event.create ||
                user.roles.includes(PERMISSIONS.event.create)) && (
              <Link href="/events/create">
                <a className="btn-primary">{__('events_link')}</a>
              </Link>
            )}
          </div>
        </div>
        <EventsList
          limit={30}
          where={{
            end: {
              $gt: now,
            },
          }}
        />
      </div>
      <div className="main-content intro">
        <div className="page-title flex justify-between">
          <h1 className="mb-4">{__('events_past')}</h1>
        </div>
        <EventsList
          limit={30}
          where={{
            end: {
              $lt: now,
            },
            visibility: 'public',
          }}
        />
      </div>
    </Layout>
  );
};

export default Events;
