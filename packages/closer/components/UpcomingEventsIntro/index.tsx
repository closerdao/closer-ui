import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <section className="mb-20 max-w-5xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
      <div className="md:max-w-lg w-full md:w-1/3">
        <Heading display level={2} className="mb-6 text-3xl normal-case ">
          {t('events_upcoming_heading', appName)}
        </Heading>

        {t('events_upcoming_intro') !== 'events_upcoming_intro' && (
          <p className="mb-6 text-sm md:text-base">
            {t('events_upcoming_intro', appName)}
          </p>
        )}

        <p className="mb-6 text-sm md:text-base">
          <Link href="/events" className="underline text-accent">
            See all events
          </Link>
        </p>
      </div>
      <div className="flex-grow">
        <EventsList
          limit={2}
          cols={2}
          where={{
            end: {
              $gt: loadTime,
            },
          }}
          sort_by="start"
        />
      </div>
    </section>
  );
};

export default UpcomingEventsIntro;
