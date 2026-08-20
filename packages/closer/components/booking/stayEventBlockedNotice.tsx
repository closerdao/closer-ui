import Link from 'next/link';

import dayjs from 'dayjs';
import { CalendarX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { CalendarBlockingEvent } from '../../utils/events.helpers';
import Button from '../ui/Button';
import Heading from '../ui/Heading';
import LinkButton from '../ui/LinkButton';

/** `Mar 4, 2026` for a single day, `Mar 4 – Mar 8, 2026` when it spans several. */
const formatEventRange = (start?: string, end?: string) => {
  if (!start) return '';
  const startDate = dayjs(start);
  const endDate = end ? dayjs(end) : null;
  if (!endDate || startDate.isSame(endDate, 'day')) {
    return startDate.format('MMM D, YYYY');
  }
  return `${startDate.format('MMM D')} – ${endDate.format('MMM D, YYYY')}`;
};

interface Props {
  events: CalendarBlockingEvent[];
  /** Renders the dismiss action — pass it when the notice is shown in a modal. */
  onDismiss?: () => void;
}

const StayEventBlockedNotice = ({ events, onDismiss }: Props) => {
  const t = useTranslations();

  if (events.length === 0) return null;

  const singleEvent = events.length === 1 ? events[0] : null;
  const eventHref = singleEvent?.slug ? `/events/${singleEvent.slug}` : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 rounded-full bg-yellow-50 p-2 text-yellow-700"
          aria-hidden
        >
          <CalendarX className="h-5 w-5" />
        </span>
        <Heading level={2} className="text-lg md:text-xl mb-0">
          {t('stay_create_event_block_title')}
        </Heading>
      </div>

      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
        {t('stay_create_event_block_description')}
      </p>

      <ul className="flex flex-col gap-2 rounded-xl bg-neutral p-3 list-none">
        {events.map((event) => (
          <li key={event._id} className="text-sm text-gray-700">
            <span className="font-semibold">
              {event.slug ? (
                <Link href={`/events/${event.slug}`} className="underline">
                  {event.name}
                </Link>
              ) : (
                event.name
              )}
            </span>
            <span className="text-gray-500">
              {' · '}
              {formatEventRange(event.start, event.end)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3">
        <LinkButton
          href={eventHref || '/events'}
          className="min-h-[44px] !normal-case"
        >
          {!eventHref
            ? t('stay_create_event_block_view_events')
            : singleEvent?.paid
            ? t('stay_create_event_block_buy_ticket')
            : t('stay_create_event_block_view_event')}
        </LinkButton>
        {onDismiss && (
          <Button
            variant="secondary"
            onClick={onDismiss}
            className="min-h-[44px] !normal-case"
          >
            {t('stay_create_event_block_adjust_dates')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StayEventBlockedNotice;
