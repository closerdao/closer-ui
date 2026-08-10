import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { usePlatform } from '../../contexts/platform';
import { Event } from '../../types/event';
import { resolveBlockText } from '../../utils/blockI18n';

const now = new Date();

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
  };
}

const CustomPastEvents = ({ content }: Props) => {
  const t = useTranslations();
  const { platform }: { platform?: any } = usePlatform() as { platform?: any };
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!platform?.event) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const pastFilter = {
          where: { end: { $lt: now } },
          limit: 20,
          sort_by: '-start',
        };
        const pastRes = await platform.event.get(pastFilter);
        const pastData = pastRes?.results;
        setPastEvents(
          pastData
            ? pastData.map((e: { toJSON: () => Event }) => e.toJSON())
            : [],
        );
      } catch (error) {
        console.error('Error loading past events:', error);
        setPastEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [platform]);

  const title =
    content?.title?.trim()
      ? resolveBlockText(content.title, t)
      : t('events_past');

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
        {title ? (
          <Heading level={2} className="text-2xl font-normal text-gray-900">
            {title}
          </Heading>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-gray-500">...</p>
        ) : pastEvents.length === 0 ? (
          <p className="text-sm text-gray-500">{t('events_list_no_events')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pastEvents.map((event) => (
              <li key={event._id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-gray-200 hover:text-accent transition-colors"
                >
                  <span className="font-medium text-gray-900">{event.name}</span>
                  {event.start ? (
                    <span className="text-sm text-gray-500">
                      {new Date(event.start).toLocaleDateString()}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default CustomPastEvents;
