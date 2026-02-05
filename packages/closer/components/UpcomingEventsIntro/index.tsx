import { useEffect, useState } from 'react';
import Link from 'next/link';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import { usePlatform } from '../../contexts/platform';
import EventsList from '../EventsList';
import { Heading } from '../ui';

const loadTime = new Date();

const UpcomingEventsIntro = () => {
  const t = useTranslations();
  const config = useConfig();
  const { APP_NAME } = config || {};
  const appName = (APP_NAME || '').toLowerCase();
  const { platform } = usePlatform() as { platform?: any };
  const [hasEvents, setHasEvents] = useState<boolean | null>(null);

  useEffect(() => {
    const checkEvents = async () => {
      if (!platform?.event) {
        setHasEvents(false);
        return;
      }
      
      try {
        const filter = {
          where: { end: { $gt: loadTime } },
          limit: 1,
          sort_by: 'start',
        };
        await platform.event.get(filter);
        const events = platform.event.find(filter);
        setHasEvents(events && events.count() > 0);
      } catch (error) {
        console.error('Error checking events:', error);
        setHasEvents(false);
      }
    };
    
    if (platform) {
      checkEvents();
    }
  }, [platform]);

  if (hasEvents === false || hasEvents === null) {
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-32 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[minmax(0,340px)_1fr] md:gap-16 lg:gap-20 items-start">
          <div className="text-center md:text-left mb-10 md:mb-0">
            <Heading display level={2} className="mb-6 text-2xl md:text-3xl normal-case font-normal text-gray-900 tracking-tight">
              {t('events_upcoming_heading', appName)}
            </Heading>

            {t('events_upcoming_intro') !== 'events_upcoming_intro' && (
              <p className="mb-6 text-sm md:text-base text-gray-700 leading-relaxed font-light">
                {t('events_upcoming_intro', appName)}
              </p>
            )}

            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('events_see_all')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="min-w-0">
            <EventsList
              limit={2}
              cols={2}
              showPagination={false}
              where={{
                end: {
                  $gt: loadTime,
                },
              }}
              sort_by="start"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEventsIntro;
