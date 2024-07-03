import Link from 'next/link';

import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';
import EventsList from '../EventsList';
import { Heading } from '../ui';

const loadTime = new Date();

const UpcomingEventsIntro = () => {
  const config = useConfig();
  const { APP_NAME } = config || {};
  const appName = (APP_NAME || '').toLowerCase();

  return (
    <section className="mb-20 max-w-6xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
      <div className="md:max-w-lg w-full md:w-1/3">
        <Heading display level={2} className="mb-6 text-3xl">
          {__('events_upcoming_heading', appName)}
        </Heading>

        {!__('events_upcoming_intro').includes('_missing') && (
          <p className="mb-6 text-sm md:text-base">
            {__('events_upcoming_intro', appName)}
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
