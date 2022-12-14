import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useEffect } from 'react';

import Layout from '../../../components/Layout';
import TicketListPreview from '../../../components/TicketListPreview';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EventTickets = ({ event }) => {
  const router = useRouter();

  const { user } = useAuth();
  const { platform } = usePlatform();
  const ticketsFilter = { where: { event: event && event._id } };
  const tickets = platform.ticket.find(ticketsFilter);

  const loadData = async () => {
    await Promise.all([platform.ticket.get(ticketsFilter)]);
  };

  useEffect(() => {
    if (user && user.roles.includes('admin')) {
      loadData();
    }
  }, [user]);

  if (
    !user ||
    (!user.roles.includes('admin') &&
      !user.roles.includes('space-host') &&
      event.createdBy !== user._id)
  ) {
    return (
      <PageNotAllowed error="You must be the event creator, or an admin or space-host in order to see tickets." />
    );
  }
  if (!event) {
    return <PageNotFound error="Event not found" />;
  }

  return (
    <Layout>
      <Head>
        <title>
          {event.name} {__('events_slug_tickets_title')}
        </title>
      </Head>
      {tickets && tickets.get('error') && (
        <div className="validation-error">{tickets.get('error')}</div>
      )}
      <div className="main-content intro fullwidth">
        <div className="page-header mb-3 flex justify-between">
          <h1>
            <i>{event.name}</i> {__('events_slug_tickets_title')}
          </h1>
        </div>
        <div className="tickets-list">
          {tickets && tickets.count() > 0 ? (
            tickets.map((ticket) => (
              <TicketListPreview key={ticket.get('_id')} ticket={ticket} />
            ))
          ) : (
            <p className="p-3 text-2xl card text-center italic">
              {__('events_slug_tickets_error')}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};
EventTickets.getInitialProps = async ({ req, query }) => {
  try {
    const {
      data: { results: event },
    } = await api.get(`/event/${query.slug}`);
    return { event };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default EventTickets;
