import Head from 'next/head';
import Link from 'next/link';

import EventsList from '../../components/EventsList';

import { NextPage } from 'next';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const now = new Date();

const Events: NextPage = () => {
  const { PERMISSIONS, PLATFORM_NAME } = useConfig() || {};
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>{`${PLATFORM_NAME} - ${__('events_title')}`}</title>
      </Head>
      <div className="main-content w-full mb-12">
        <div className="flex justify-between">
          <h2 className="mb-4 text-xl">{__('events_upcoming')}</h2>
          <div className="action">
            {user &&
              (!PERMISSIONS ||
                !PERMISSIONS.event.create ||
                user.roles.includes(PERMISSIONS.event.create)) && (
                <Link href="/events/create" className="btn-primary">
                  {__('events_link')}
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
          <h2 className="mb-4 text-xl">{__('events_past')}</h2>
        </div>
        <EventsList
          limit={30}
          where={{
            end: {
              $lt: now,
            },
          }}
        />
      </div>
    </>
  );
};

export default Events;
