import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { usePlatform } from '../../contexts/platform';
import { Event } from '../../types';
import { GeneralConfig } from '../../types';
import { cdn } from '../../utils/api';
import Heading from '../../components/ui/Heading';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';

const now = new Date();

interface EventsConfig {
  enabled: boolean;
}

interface Props {
  generalConfig: GeneralConfig | null;
  eventsConfig: EventsConfig | null;
}

interface MonthGroup {
  month: string;
  monthKey: string;
  events: Event[];
}

const Events = ({ generalConfig, eventsConfig }: Props) => {
  const t = useTranslations();
  const { PERMISSIONS } = useConfig() || {};
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { platform }: any = usePlatform();
  const { user } = useAuth();

  const isEventsEnabled = eventsConfig?.enabled !== false;

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group events by month
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
          events: []
        };
      }
      groups[monthKey].events.push(event);
    });

    return Object.values(groups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [upcomingEvents]);

  const pastEventsByYear = useMemo(() => {
    const groups: { [key: string]: { year: string; yearKey: string; events: Event[] } } = {};
    
    pastEvents.forEach((event) => {
      const startDate = dayjs(event.start);
      const yearKey = startDate.format('YYYY');
      const yearName = startDate.format('YYYY');
      
      if (!groups[yearKey]) {
        groups[yearKey] = {
          year: yearName,
          yearKey,
          events: []
        };
      }
      groups[yearKey].events.push(event);
    });

    return Object.values(groups).sort((a, b) => b.yearKey.localeCompare(a.yearKey));
  }, [pastEvents]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      if (!platform || !platform.event) {
        setError(t('events_platform_not_initialized'));
        return;
      }
      
      // Load upcoming events
      const upcomingFilter = {
        where: { end: { $gt: now } },
        limit: 100,
        sort_by: 'start'
      };
      await platform.event.get(upcomingFilter);
      const upcoming = platform.event.find(upcomingFilter);
      setUpcomingEvents(upcoming ? upcoming.map((e: any) => e.toJSON()) : []);

      // Load past events
      const pastFilter = {
        where: { end: { $lt: now } },
        limit: 50,
        sort_by: '-start'
      };
      await platform.event.get(pastFilter);
      const past = platform.event.find(pastFilter);
      setPastEvents(past ? past.map((e: any) => e.toJSON()) : []);
      
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message);
      setUpcomingEvents([]);
      setPastEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (platform && platform.event && defaultConfig) {
      loadEvents();
    }
  }, [platform, defaultConfig]);

  const formatEventDate = (event: Event) => {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    const isSameDay = startDate.isSame(endDate, 'day');
    
    if (isSameDay) {
      return `${startDate.format('MMM D')}`;
    } else {
      return `${startDate.format('MMM D')} - ${endDate.format('MMM D')}`;
    }
  };

  const formatEventTime = (event: Event) => {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    const isSameDay = startDate.isSame(endDate, 'day');
    
    if (isSameDay) {
      return `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`;
    } else {
      return startDate.format('HH:mm');
    }
  };

  if (!isEventsEnabled) {
    return <FeatureNotEnabled feature="events" />;
  }

  if (loading) {
    return (
      <div className="main-content w-full mb-12">
        <div className="text-center py-12">
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content w-full mb-12">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${t('events_title')} - ${PLATFORM_NAME}`}</title>
        <meta
          name="description"
          content={`Discover upcoming events, workshops, and gatherings at ${PLATFORM_NAME}. Join our community for regenerative living experiences.`}
        />
        <meta name="keywords" content={`${PLATFORM_NAME}, events, workshops, gatherings, regenerative communities, community events, ecovillage events`} />
        <meta property="og:title" content={`${t('events_title')} - ${PLATFORM_NAME}`} />
        <meta property="og:description" content={`Discover upcoming events, workshops, and gatherings at ${PLATFORM_NAME}. Join our community for regenerative living experiences.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/events`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${t('events_title')} - ${PLATFORM_NAME}`} />
        <meta name="twitter:description" content={`Discover upcoming events, workshops, and gatherings at ${PLATFORM_NAME}.`} />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/events`}
          key="canonical"
        />
      </Head>
      
      <div className="main-content w-full mb-12">
        <div className="flex justify-between mb-8">
          <Heading level={2} className="text-xl">
            {t('events_upcoming')}
          </Heading>
          <div className="action">
            {user &&
              (!PERMISSIONS ||
                !PERMISSIONS.event.create ||
                user.roles.includes(PERMISSIONS.event.create)) && (
                <Link href="/events/create" className="btn-primary">
                  {t('events_link')}
                </Link>
              )}
          </div>
        </div>

        {upcomingEventsByMonth.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            
            {upcomingEventsByMonth.map((monthGroup) => (
              <div key={monthGroup.monthKey} className="relative mb-12">
                {/* Month circle */}
                <div className="absolute left-4 top-0 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-md z-10"></div>
                
                {/* Month title */}
                <div className="ml-16 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">{monthGroup.month}</h3>
                </div>
                
                {/* Events */}
                <div className="ml-16 space-y-4">
                  {monthGroup.events.map((event) => (
                    <Link key={event._id} href={`/events/${event.slug}`} className="block">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          {/* Event image */}
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {event.photo ? (
                              <img
                                className="w-full h-full object-cover"
                                src={`${cdn}${event.photo}-profile-lg.jpg`}
                                alt={event.name}
                              />
                            ) : event.visual ? (
                              <img
                                className="w-full h-full object-cover"
                                src={event.visual}
                                alt={event.name}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">{t('events_no_image')}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Event details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg mb-1">
                                  {event.name}
                                </h4>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                  <span>{formatEventDate(event)}</span> 
                                  <span className="mx-2">•</span> 
                                  <span>{formatEventTime(event)}</span>
                                </p>
                                
                                {(event.address || event.location) && !event.virtual && (
                                  <div className="flex items-center text-sm text-gray-500 mb-1">
                                    <MdLocationOn className="mr-1" />
                                    <span>{event.address || event.location}</span>
                                  </div>
                                )}
                                
                                {event.virtual && (
                                  <div className="flex items-center text-sm text-gray-500 mb-1">
                                    <MdLocationOn className="mr-1" />
                                    <span>{t('events_online')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
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

      {/* Past Events */}
      {pastEventsByYear.length > 0 && (
        <div className="main-content intro">
          <Heading level={2} className="mb-6 text-xl">
            {t('events_past')}
          </Heading>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {pastEventsByYear.map((yearGroup) => (
              <div key={yearGroup.yearKey} className="relative mb-12">
                {/* Year circle */}
                <div className="absolute left-4 top-0 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-sm z-10"></div>
                
                {/* Year title */}
                <div className="ml-16 mb-6">
                  <h3 className="text-xl font-semibold text-gray-600">{yearGroup.year}</h3>
                </div>
                
                {/* Events */}
                <div className="ml-16 space-y-4">
                  {yearGroup.events.map((event) => (
                    <Link key={event._id} href={`/events/${event.slug}`} className="block">
                      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          {/* Event image */}
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {event.photo ? (
                              <img
                                className="w-full h-full object-cover"
                                src={`${cdn}${event.photo}-profile-lg.jpg`}
                                alt={event.name}
                              />
                            ) : event.visual ? (
                              <img
                                className="w-full h-full object-cover"
                                src={event.visual}
                                alt={event.name}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">{t('events_no_image')}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Event details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg mb-1 hover:text-gray-700">
                                  {event.name}
                                </h4>
                                
                                <p className="text-sm text-gray-500 mb-2">
                                  {formatEventDate(event)}
                                </p>
                                
                                {(event.address || event.location) && !event.virtual && (
                                  <div className="flex items-center text-sm text-gray-400 mb-1">
                                    <MdLocationOn className="mr-1" />
                                    <span>{event.address || event.location}</span>
                                  </div>
                                )}
                                
                                {event.virtual && (
                                  <div className="flex items-center text-sm text-gray-400 mb-1">
                                    <MdLocationOn className="mr-1" />
                                    <span>{t('events_online')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
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
      )}
    </>
  );
};

Events.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, eventsRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      api.get('/config/events').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    const eventsConfig = eventsRes?.data?.results?.value;

    return {
      generalConfig,
      eventsConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      eventsConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default Events;
