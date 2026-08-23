import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Card, Heading, Spinner } from '../../components/ui';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import type { CloserCurrencies } from '../../types/currency';
import type { Ticket } from '../../types/ticket';
import api, { formatSearch } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { priceFormat } from '../../utils/helpers';
import { getMyTickets } from '../../utils/tickets.api';
import PageNotFound from '../not-found';

type EventSummary = { _id: string; name: string; slug: string; start?: string };

const STATUS_TONE: Record<string, string> = {
  approved: 'bg-success/10 text-success',
  pending: 'bg-accent-light text-accent',
  'pending-payment': 'bg-accent-light text-accent',
  cancelled: 'bg-neutral text-gray-500',
  refunded: 'bg-neutral text-gray-500',
};

/**
 * Every ticket the signed-in guest holds, whichever door it came in by: bought
 * on its own, or written by a stay that carried an event. `/tickets/mine` only
 * knows the event by id, so the events are looked up in one follow-up call.
 */
const MyTicketsPage = () => {
  const t = useTranslations();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [events, setEvents] = useState<Record<string, EventSummary>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await getMyTickets({ limit: 100 });
        if (cancelled) return;
        setTickets(results);

        const eventIds = [...new Set(results.map((ticket) => ticket.event))];
        if (eventIds.length === 0) return;
        const { data } = await api.get('/event', {
          params: {
            where: formatSearch({ _id: { $in: eventIds } }),
            limit: 100,
          },
        });
        if (cancelled) return;
        setEvents(
          Object.fromEntries(
            (data?.results || []).map((event: EventSummary) => [
              event._id,
              event,
            ]),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setTickets([]);
          setError(parseMessageFromError(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  if (!user && !isAuthLoading) {
    return <PageNotFound error="User not logged in." />;
  }

  return (
    <>
      <Head>
        <title>{t('tickets_my_tickets_title')}</title>
      </Head>
      <main className="main-content w-full max-w-3xl">
        <Heading level={1} className="mb-6">
          🎟 {t('tickets_my_tickets_title')}
        </Heading>

        {tickets === null ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="bg-white">
            <p className="text-gray-600">
              {error || t('tickets_my_tickets_empty')}
            </p>
            <Link href="/events" className="text-accent underline mt-2">
              {t('tickets_my_tickets_browse_events')}
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => {
              const event = events[ticket.event];
              const price = ticket.price;
              return (
                <Card key={ticket._id} className="bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/tickets/${ticket._id}`}
                        className="font-bold hover:underline"
                      >
                        {event?.name || t('tickets_my_tickets_unknown_event')}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {event?.start &&
                          dayjs(event.start).format('MMM D, YYYY')}
                        {ticket.option?.name ? ` · ${ticket.option.name}` : ''}
                        {ticket.quantity > 1 ? ` · × ${ticket.quantity}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {price && price.val > 0 && (
                        <span className="text-sm">
                          {priceFormat(
                            price.val,
                            price.cur as CloserCurrencies,
                          )}
                        </span>
                      )}
                      <span
                        className={`text-xs uppercase rounded-full px-3 py-1 ${
                          STATUS_TONE[ticket.status] || 'bg-neutral'
                        }`}
                      >
                        {t(`ticket_status_${ticket.status}`)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
};

export default MyTicketsPage;
