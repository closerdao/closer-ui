import Head from 'next/head';

import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useConfig } from '../../../hooks/useConfig';
import { Event, GeneralConfig } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  ticket: any;
  event: Event;
  error?: string;
  generalConfig: GeneralConfig;
}

const Ticket = ({ ticket, event, error, generalConfig }: Props) => {
  const t = useTranslations();
  const { PLATFORM_LEGAL_ADDRESS } = useConfig();

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  if (!ticket) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{`${t('tickets_invoice_title')} - ${ticket._id}`}</title>
        <meta property="og:type" content="ticket" />
      </Head>
      <main className="main-content invoice-page">
        <div className="card">
          <h3 className="mb-2">
            {t('tickets_invoice_id')} {ticket._id}
          </h3>
          <h3>
            {t('tickets_invoice_date')} {dayjs(ticket.created).format('LLL')}
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
          <Heading level={2}>{event.name}</Heading>
          <h4>{priceFormat(ticket.price.val, ticket.price.cur)}</h4>
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
    const [eventRes, generalRes, messages] = await Promise.all([
      api.get(`/event/${ticket.event}`),
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    return {
      ticket,
      event: eventRes.data?.results,
      generalConfig,
      messages,
    };
  } catch (error) {
    return {
      ticket: null,
      event: null,
      error: parseMessageFromError(error),
      generalConfig: null,
      messages: null,
    };
  }
};

export default Ticket;
