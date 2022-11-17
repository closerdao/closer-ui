import Head from 'next/head';

import React from 'react';
import QRCode from 'react-qr-code';

import Layout from '../../../components/Layout';

import PageNotFound from '../../404';
import config from '../../../config';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Ticket = ({ ticket, event, error }) => {
  const { platform } = usePlatform();
  const { user, isAuthenticated } = useAuth();

  if (!ticket) {
    return <PageNotFound error={error} />;
  }

  return (
    <Layout>
      <Head>
        <title>
          {__('tickets_slug_title')} {event.name}
        </title>
        <meta property="og:type" content="ticket" />
      </Head>
      <main className="main-content ticket-page flex flex-col justify-center items-center">
        <div className="ticket card flex flex-col md:flex-row justify-center items-center max-w-32">
          <div>
            <QRCode value={`${config.SEMANTIC_URL}/tickets/${ticket._id}`} />
          </div>
          <div className="md:ml-6">
            <i>{__('tickets_slug_subtitle')}</i>
            <h2 className="my-3">{event.name}</h2>
            <p>
              {__('tickets_slug_holder')} <b>{ticket.name}</b>
            </p>
            <p>
              {__('tickets_slug_number')} <b>{ticket._id}</b>
            </p>
          </div>
        </div>
        <br />
        <p>
          Make sure to check your email address. If you didn&apos;t receive the
          ticket in your email, add no-reply@mg.oasa.co to your contacts and
          send us an email to {config.TEAM_EMAIL} for support.
        </p>
      </main>
    </Layout>
  );
};
Ticket.getInitialProps = async ({ req, query }) => {
  try {
    const {
      data: { results: ticket },
    } = await api.get(`/ticket/${query.slug}`);
    const {
      data: { results: event },
    } = await api.get(`/event/${ticket.event}`);
    return { ticket, event };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default Ticket;
