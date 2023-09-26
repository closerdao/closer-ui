import React from 'react';
import { Heading } from '../ui';
import EventsList from '../EventsList';

const loadTime = new Date();

const UpcomingEventsIntro = () => {
    return (
        <section className="mb-20 max-w-6xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
          
            <div className="md:max-w-lg w-full md:w-1/3">
            <Heading display level={2} className="mb-6 text-3xl">
              JOIN FELLOW FUTURISTS FOR UPCOMING EVENTS
            </Heading>
            <p className="mb-6 text-sm md:text-base">
              TDF is more than the land from which we build. Regeneration
              transcends soil, bricks and mortar and farming practices. It is
              also about our souls. It gathers thinkers, artists, farmers,
              developers, entrepreneurs, healers, investors - all to supercharge
              a movement that will bring us all closer to a regenerative
              whole-system. Come to TDF for an event where you can meet all
              these folks.
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