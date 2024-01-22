import Head from 'next/head';
import Link from 'next/link';

import QRCode from 'react-qr-code';

import Heading from '../../../components/ui/Heading';

import PageNotFound from '../../404';
import { useConfig } from '../../../hooks/useConfig';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Ticket = ({ ticket, event, error }) => {
  const config = useConfig();
  if (!ticket) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{`${__('tickets_slug_title')} - ${event.name}`}</title>
        <meta property="og:type" content="ticket" />
      </Head>
      <main className="main-content ticket-page flex flex-col justify-center items-center">
        <div className="ticket card flex flex-col md:flex-row justify-center items-center max-w-32">
          <div>
            <QRCode value={`${config.SEMANTIC_URL}/tickets/${ticket._id}`} />
          </div>
          <div className="md:ml-6">
            <i>{__('tickets_slug_subtitle')}</i>
            <Heading level={2} className="my-3">
              <Link
                href={ `/events/${event.slug}` }
              >
                {event.name}
              </Link>
            </Heading>
            <p>
              {__('tickets_slug_holder')} <b>{ticket.name} x { ticket.quantity || 1 }</b>
            </p>
            <p>
              {__('tickets_slug_number')} <b>{ticket._id}</b>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};
Ticket.getInitialProps = async ({ query }) => {
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
