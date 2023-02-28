import Head from 'next/head';

import React from 'react';

import Layout from '../../../components/Layout';

import dayjs from 'dayjs';

import PageNotFound from '../../404';
import { PLATFORM_LEGAL_ADDRESS, PLATFORM_NAME } from '../../../config';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import api from '../../../utils/api';
import { priceFormat } from '../../../utils/helpers';
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
          {__('tickets_invoice_title')} {ticket._id}
        </title>
        <meta property="og:type" content="ticket" />
      </Head>
      <main className="main-content invoice-page">
        <div className="card">
          <h3 className="mb-2">
            {__('tickets_invoice_id')} {ticket._id}
          </h3>
          <h3>
            {__('tickets_invoice_date')} {dayjs(ticket.created).format('LLL')}
          </h3>
          <div className="flex flex-row mt-4">
            <div className="from col">
              <b>{PLATFORM_NAME}</b>
              <br />
              {PLATFORM_LEGAL_ADDRESS}
            </div>
            <br />
            <div className="to col">
              <b>{ticket.name}</b>
              <br />
              {ticket.company && <p>{ticket.company}</p>}
              {ticket.vatID && <p>{ticket.vatID}</p>}
              {ticket.address && <p>{ticket.address}</p>}
            </div>
          </div>
          <hr />
          <h2>{event.name}</h2>
          <h4>{priceFormat(ticket.price.val, ticket.price.cur)}</h4>
        </div>
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
    console.warn('Error loading ticket', err);

    return {
      error: err.message,
    };
  }
};

export default Ticket;
