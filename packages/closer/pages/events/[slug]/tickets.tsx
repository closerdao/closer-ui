import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Pagination from '../../../components/Pagination';
import TicketListPreview from '../../../components/TicketListPreview';
import Heading from '../../../components/ui/Heading';

import { ArrowLeft } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import config from '../../../configCached';
import { TICKETS_PER_PAGE } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { Event } from '../../../types';
import { getBearerToken } from '../../../utils/authHeaders.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { fetchEvent } from '../../../utils/events';
import { useEventTickets } from '../../../utils/tickets';
import PageNotFound from '../../not-found';

interface EventsConfig {
  enabled: boolean;
}

interface Props {
  event: Event;
  eventsConfig: EventsConfig | null;
}

const EventTickets = ({ event, eventsConfig }: Props) => {
  const t = useTranslations();

  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const [page, setPage] = useState(1);

  // Organisers only need completed tickets, not pending/cancelled enquiries.
  const ticketsFilter = {
    where: { event: event && event._id, status: { $in: ['paid', 'approved'] } },
  };
  const paginatedFilter = {
    ...ticketsFilter,
    limit: TICKETS_PER_PAGE,
    page,
  };

  const { tickets, count, loadTickets, loadCount } = useEventTickets(
    platform,
    paginatedFilter,
    ticketsFilter,
  );
  const totalTickets = count || 0;

  const isEventsEnabled = eventsConfig?.enabled === true;

  const loadData = async () => {
    await Promise.all([loadCount(), loadTickets()]);
  };

  const canViewTickets =
    user &&
    (user.roles.includes('admin') ||
      user.roles.includes('space-host') ||
      event?.createdBy === user._id);

  useEffect(() => {
    if (canViewTickets) {
      loadData();
    }
  }, [canViewTickets, page]);

  if (!isEventsEnabled) {
    return <FeatureNotEnabled feature="events" />;
  }

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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {event.name}
        </Link>
        <div className="mb-10">
          <Heading
            level={2}
            className="text-2xl md:text-3xl font-semibold text-gray-900"
          >
            {t('events_slug_tickets_title')}
          </Heading>
          {totalTickets > 0 && (
            <p className="text-gray-600 mt-1">
              {t('events_slug_tickets_count', { count: totalTickets })}
            </p>
          )}
        </div>
        {tickets && tickets.count() > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <TicketListPreview
                key={ticket.get('_id')}
                ticket={ticket.toJS()}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500 italic">
              {t('events_slug_tickets_error')}
            </p>
          </div>
        )}
        <div className="mt-10">
          <Pagination
            loadPage={(p: number) => setPage(p)}
            page={page}
            limit={TICKETS_PER_PAGE}
            total={totalTickets}
          />
        </div>
      </div>
    </>
  );
};
EventTickets.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const event = await fetchEvent(String(query.slug), {
      token: getBearerToken(req as NextApiRequest),
    }).catch((err) => {
      console.error('Error fetching event:', err);
      return null;
    });
    const eventsConfig = config.events;

    return { event, eventsConfig };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      eventsConfig: null,
    };
  }
};

export default EventTickets;
