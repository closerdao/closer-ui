import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Ticket as TicketIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import type { CloserCurrencies } from '../types/currency';
import type { Ticket } from '../types/ticket';
import { priceFormat } from '../utils/helpers';
import { getMyTickets } from '../utils/tickets.api';
import { getTicketPriceBreakdown } from '../utils/tickets.helpers';
import { Card } from './ui';
import Heading from './ui/Heading';

interface Props {
  eventId: string;
  /** Bump to refetch — a purchase elsewhere on the page changes this list. */
  refreshKey?: number;
}

/** Cancelled tickets let nobody in, so they are not what the guest holds. */
const HOLDS_A_SEAT = ['approved', 'pending', 'pending-payment'];

/**
 * The tickets the signed-in guest already holds for this event, shown at the
 * top of the event page so they never have to wonder whether they bought one.
 */
const MyEventTickets = ({ eventId, refreshKey = 0 }: Props) => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id || !eventId) {
      setTickets([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const results = await getMyTickets({ event: eventId, limit: 20 });
        if (cancelled) return;
        setTickets(results.filter((t) => HOLDS_A_SEAT.includes(t.status)));
      } catch {
        // A guest who holds no tickets and a request that failed look the
        // same here, and neither is worth an error on the event page.
        if (!cancelled) setTickets([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id, eventId, refreshKey]);

  if (tickets.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border border-gray-100 w-full">
      <Heading level={3} className="text-lg flex items-center gap-2">
        <TicketIcon className="w-5 h-5 text-accent" />
        {t('event_my_tickets_title')}
      </Heading>
      <ul className="divide-y divide-gray-100">
        {tickets.map((ticket) => {
          const price = getTicketPriceBreakdown(ticket);
          return (
            <li
              key={ticket._id}
              className="flex flex-wrap items-center justify-between gap-3 py-2"
            >
              <div>
                <Link
                  href={`/tickets/${ticket._id}`}
                  className="text-accent font-medium hover:underline"
                >
                  {ticket.option?.name || t('event_my_tickets_admission')}
                  {price.quantity > 1 ? ` × ${price.quantity}` : ''}
                </Link>
                {ticket.status !== 'approved' && (
                  <p className="text-xs text-gray-500">
                    {t(`ticket_status_${ticket.status}`)}
                  </p>
                )}
              </div>
              {price.total > 0 && (
                <span className="text-sm text-gray-600">
                  {priceFormat(price.total, price.currency as CloserCurrencies)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default MyEventTickets;
