import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import EventsList from '../EventsList';
import { Heading } from '../ui';

const loadTime = new Date();

const UpcomingEventsIntro = () => {
  const t = useTranslations();
  const config = useConfig();
  const { APP_NAME } = config || {};
  const appName = (APP_NAME || '').toLowerCase();

  return (
    <section className="mb-20 max-w-6xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
      <div className="md:max-w-lg w-full md:w-1/3">
        <Heading display level={2} className="mb-6 text-3xl">
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
        />
      </div>
    </section>
  );
};

export default UpcomingEventsIntro;
