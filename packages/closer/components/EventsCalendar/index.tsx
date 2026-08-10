import { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import dayjs from 'dayjs';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { useRBAC } from '../../hooks/useRBAC';
import { Event } from '../../types';
import { cdn } from '../../utils/api';
import Heading from '../ui/Heading';

interface MonthGroup {
  month: string;
  monthKey: string;
  events: Event[];
}

interface YearGroup {
  year: string;
  yearKey: string;
  events: Event[];
}

interface EventsCalendarProps {
  showCreateCta?: boolean;
  upcomingLimit?: number;
  pastLimit?: number;
}

const toEventList = (results: unknown): Event[] => {
  if (!results) return [];

  const plain =
    typeof (results as { toJS?: () => unknown }).toJS === 'function'
      ? (results as { toJS: () => unknown }).toJS()
      : results;

  if (!Array.isArray(plain)) return [];

  return plain.map((item) => {
    if (item && typeof (item as { toJSON?: () => Event }).toJSON === 'function') {
      return (item as { toJSON: () => Event }).toJSON();
    }
    return item as Event;
  });
};

const EventsCalendar = ({
  showCreateCta = true,
  upcomingLimit = 100,
  pastLimit = 50,
}: EventsCalendarProps) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const defaultConfig = useConfig();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const upcomingEventsByMonth = useMemo(() => {
    const groups: { [key: string]: MonthGroup } = {};

    upcomingEvents.forEach((event) => {
      const startDate = dayjs(event.start);
      const monthKey = startDate.format('YYYY-MM');
      const monthName = startDate.format('MMMM YYYY');

      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthName,
          monthKey,
          events: [],
        };
      }
      groups[monthKey].events.push(event);
    });

    return Object.values(groups).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    );
  }, [upcomingEvents]);

  const pastEventsByYear = useMemo(() => {
    const groups: { [key: string]: YearGroup } = {};

    pastEvents.forEach((event) => {
      const startDate = dayjs(event.start);
      const yearKey = startDate.format('YYYY');
      const yearName = startDate.format('YYYY');

      if (!groups[yearKey]) {
        groups[yearKey] = {
          year: yearName,
          yearKey,
          events: [],
        };
      }
      groups[yearKey].events.push(event);
    });

    return Object.values(groups).sort((a, b) =>
      b.yearKey.localeCompare(a.yearKey),
    );
  }, [pastEvents]);

  useEffect(() => {
    if (!platform?.event || !defaultConfig) return;
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const upcomingRes = await platform.event.get({
          where: { end: { $gt: now } },
          limit: upcomingLimit,
          sort_by: 'start',
        });
        setUpcomingEvents(toEventList(upcomingRes?.results));

        const pastRes = await platform.event.get({
          where: { end: { $lt: now } },
          limit: pastLimit,
          sort_by: '-start',
        });
        setPastEvents(toEventList(pastRes?.results));
      } catch (err: unknown) {
        console.error('Error loading events:', err);
        setError(
          err instanceof Error ? err.message : t('events_platform_not_initialized'),
        );
        setUpcomingEvents([]);
        setPastEvents([]);
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, [platform, defaultConfig, upcomingLimit, pastLimit, t]);

  const formatEventDate = (event: Event) => {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    const isSameDay = startDate.isSame(endDate, 'day');

    if (isSameDay) {
      return `${startDate.format('MMM D')}`;
    }
    return `${startDate.format('MMM D')} - ${endDate.format('MMM D')}`;
  };

  const formatEventTime = (event: Event) => {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    const isSameDay = startDate.isSame(endDate, 'day');

    if (isSameDay) {
      return `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`;
    }
    return startDate.format('HH:mm');
  };

  if (loading) {
    return (
      <div className="w-full py-12 text-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="flex justify-between mb-8">
          <Heading level={2} className="text-xl">
            {t('events_upcoming')}
          </Heading>
          {showCreateCta && user && hasAccess('EventCreation') ? (
            <div className="action">
              <Link href="/events/create" className="btn-primary">
                {t('events_link')}
              </Link>
            </div>
          ) : null}
        </div>

        {upcomingEventsByMonth.length > 0 ? (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />

            {upcomingEventsByMonth.map((monthGroup) => (
              <div key={monthGroup.monthKey} className="relative mb-12">
                <div className="absolute left-4 top-0 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-md z-10" />

                <div className="ml-16 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {monthGroup.month}
                  </h3>
                </div>

                <div className="ml-16 space-y-6">
                  {monthGroup.events.map((event) => (
                    <Link
                      key={event._id}
                      href={`/events/${event.slug}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-xl border border-gray-100 p-3 md:p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                          <div className="w-full md:w-36 aspect-[4/3] md:aspect-square md:w-32 md:h-32 lg:w-40 lg:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {event.photo ? (
                              <img
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                src={`${cdn}${event.photo}-place-lg.jpg`}
                                alt={event.name}
                              />
                            ) : event.visual ? (
                              <img
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                src={event.visual}
                                alt={event.name}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  {t('events_no_image')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex justify-center flex-col">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-1">
                              {formatEventDate(event)}
                              <span className="mx-1.5">·</span>
                              {formatEventTime(event)}
                            </p>
                            <h4 className="font-medium text-base md:text-lg text-gray-900 group-hover:text-primary transition-colors tracking-tight">
                              {event.name}
                            </h4>
                            {(event.virtual ||
                              event.address ||
                              event.location) && (
                              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {event.virtual
                                    ? t('events_online')
                                    : event.address || event.location}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="italic text-gray-500">{t('events_list_no_events')}</p>
          </div>
        )}
      </div>

      {pastEventsByYear.length > 0 ? (
        <div className="w-full">
          <Heading level={2} className="mb-6 text-xl">
            {t('events_past')}
          </Heading>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {pastEventsByYear.map((yearGroup) => (
              <div key={yearGroup.yearKey} className="relative mb-12">
                <div className="absolute left-4 top-0 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-sm z-10" />

                <div className="ml-16 mb-6">
                  <h3 className="text-xl font-semibold text-gray-600">
                    {yearGroup.year}
                  </h3>
                </div>

                <div className="ml-16 space-y-6">
                  {yearGroup.events.map((event) => (
                    <Link
                      key={event._id}
                      href={`/events/${event.slug}`}
                      className="block group"
                    >
                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 md:p-4 hover:shadow-sm hover:border-gray-200 transition-all duration-200">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                          <div className="w-full md:w-36 aspect-[4/3] md:aspect-square md:w-32 md:h-32 lg:w-40 lg:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {event.photo ? (
                              <img
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                src={`${cdn}${event.photo}-place-lg.jpg`}
                                alt={event.name}
                              />
                            ) : event.visual ? (
                              <img
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                src={event.visual}
                                alt={event.name}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  {t('events_no_image')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex justify-center flex-col">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-1">
                              {formatEventDate(event)}
                            </p>
                            <h4 className="font-medium text-base md:text-lg text-gray-700 group-hover:text-primary transition-colors tracking-tight">
                              {event.name}
                            </h4>
                            {(event.virtual ||
                              event.address ||
                              event.location) && (
                              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {event.virtual
                                    ? t('events_online')
                                    : event.address || event.location}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EventsCalendar;
