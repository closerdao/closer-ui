import Head from 'next/head';
import Link from 'next/link';

import QRCode from 'react-qr-code';

import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useConfig } from '../../../hooks/useConfig';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  ticket: any;
  event: any;
  error?: string;
}

const Ticket = ({ ticket, event, error }: Props) => {
  const t = useTranslations();
  const config = useConfig();
  if (!ticket) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{`${t('tickets_slug_title')} - ${event.name}`}</title>
        <meta property="og:type" content="ticket" />
      </Head>
      <main className="main-content ticket-page flex flex-col justify-center items-center">
        <div className="ticket card flex flex-col md:flex-row justify-center items-center max-w-32">
          <div>
            <QRCode value={`${config.SEMANTIC_URL}/tickets/${ticket._id}`} />
          </div>
          <div className="md:ml-6">
            <i>{t('tickets_slug_subtitle')}</i>
            <Heading level={2} className="my-3">
              <Link href={`/events/${event.slug}`}>{event.name}</Link>
            </Heading>
            <p>
              {t('tickets_slug_holder')}{' '}
              <b>
                {ticket.name} x {ticket.quantity || 1}
              </b>
            </p>
            <p>
              {t('tickets_slug_number')} <b>{ticket._id}</b>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};
Ticket.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    const {
      data: { results: ticket },
    } = await api.get(`/ticket/${query.slug}`);

    const [eventResponse, messages] = await Promise.all([
      api.get(`/event/${ticket.event}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const event = eventResponse.data.results;

    return { ticket, event, messages };
  } catch (err) {
    console.log('Error', parseMessageFromError(err));

    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default Ticket;
