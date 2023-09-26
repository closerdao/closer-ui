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
              {'TDF isn\'t just land; it\'s where artists, farmers, developers, entrepreneurs, and healers converge for holistic regeneration. Join an event to connect with these visionaries.'}
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