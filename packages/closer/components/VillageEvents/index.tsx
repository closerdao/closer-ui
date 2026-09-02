import { FC, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { VillageEvent } from '../../types/village';
import { cdn } from '../../utils/api';
import { fetchVillageEvents } from '../../utils/village.utils';
import { Panel } from '../VillageUI';

const EVENT_LIMIT = 3;

/** `Mar 4` for a single day, `Mar 4 – Mar 8` when it spans several. */
const formatRange = (start?: string, end?: string) => {
  if (!start) return '';
  const startDate = dayjs(start);
  const endDate = end ? dayjs(end) : null;
  if (!endDate || startDate.isSame(endDate, 'day')) {
    return startDate.format('MMM D, YYYY');
  }
  return `${startDate.format('MMM D')} – ${endDate.format('MMM D, YYYY')}`;
};

const EventRow: FC<{ event: VillageEvent; appUrl?: string }> = ({
  event,
  appUrl,
}) => {
  const t = useTranslations();
  const start = event.start ? dayjs(event.start) : null;
  const place = event.virtual
    ? t('villages_events_online')
    : event.location || event.address;
  // Events are pages on the village's own app, so we can only link out when we
  // know where that app lives.
  const href =
    appUrl && event.slug
      ? `${appUrl.replace(/\/+$/, '')}/events/${event.slug}`
      : null;

  const body = (
    <div className="flex items-center gap-4">
      {/* Date chip stands in for the poster when a village has no photo. */}
      <div className="flex-none w-14 h-14 rounded-xl bg-accent-light border border-accent-medium flex flex-col items-center justify-center overflow-hidden">
        {event.photo && cdn ? (
          <img
            src={`${cdn}${event.photo}-place-lg.jpg`}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : start ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent-text">
              {start.format('MMM')}
            </span>
            <span className="text-[18px] font-bold leading-none text-accent-text">
              {start.format('D')}
            </span>
          </>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate">
          {event.name}
        </p>
        <p className="text-[13px] text-foreground/70 mt-0.5">
          {formatRange(event.start, event.end)}
        </p>
        {place ? (
          <p className="flex items-center gap-1 text-[13px] text-foreground/50 mt-0.5 truncate">
            <MapPin className="w-3.5 h-3.5 flex-none" />
            {place}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <li className="rounded-[18px] border border-neutral-dark bg-accent-light/40 px-4 py-3.5">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
};

/**
 * Upcoming events pulled live from the village's own Closer instance. Renders
 * nothing at all when there is no API to ask or nothing coming up — an empty
 * card on a public page reads as a broken one.
 */
const VillageEvents: FC<{ apiUrl?: string; appUrl?: string }> = ({
  apiUrl,
  appUrl,
}) => {
  const t = useTranslations();
  const [events, setEvents] = useState<VillageEvent[]>([]);

  useEffect(() => {
    if (!apiUrl) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const results = await fetchVillageEvents(apiUrl, EVENT_LIMIT);
      if (!cancelled) setEvents(results);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  if (events.length === 0) return null;

  return (
    <Panel
      eyebrow={t('villages_events_eyebrow')}
      title={t('villages_events_title')}
    >
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <EventRow key={event._id} event={event} appUrl={appUrl} />
        ))}
      </ul>
      {appUrl ? (
        <a
          href={`${appUrl.replace(/\/+$/, '')}/events`}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-5 text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px]"
        >
          {t('villages_events_view_all')} ↗
        </a>
      ) : null}
    </Panel>
  );
};

export default VillageEvents;
