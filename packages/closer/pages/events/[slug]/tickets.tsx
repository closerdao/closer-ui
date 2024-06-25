import Head from 'next/head';

import { useEffect } from 'react';

import TicketListPreview from '../../../components/TicketListPreview';
import Heading from '../../../components/ui/Heading';

import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { Event } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  event: Event;
}

const EventTickets = ({ event }: Props) => {
  const t = useTranslations();

  const { user } = useAuth();
  const { platform }: any = usePlatform();
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
    <>
      <Head>
        <title>{`${event.name} - ${t('events_slug_tickets_title')}`}</title>
      </Head>
      {tickets && tickets.get('error') && (
        <div className="validation-error">{tickets.get('error')}</div>
      )}
      <div className="main-content intro fullwidth">
        <div className="page-header mb-3 flex justify-between">
          <Heading>
            <i>{event.name}</i> {t('events_slug_tickets_title')}
          </Heading>
        </div>
        <div className="tickets-list">
          {tickets && tickets.count() > 0 ? (
            tickets.map((ticket: any) => (
              <TicketListPreview key={ticket.get('_id')} ticket={ticket} />
            ))
          ) : (
            <p className="p-3 text-2xl card text-center italic">
              {t('events_slug_tickets_error')}
            </p>
          )}
        </div>
      </div>
    </>
  );
};
EventTickets.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [eventRes, messages] = await Promise.all([
      api
        .get(`/event/${query.slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          return null;
        }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const event = eventRes?.data?.results;

    return { event, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default EventTickets;
