import React, { FC } from 'react';
import Linkify from 'react-linkify';

import { type Event, VolunteerOpportunity } from '../types';
import { __ } from '../utils/helpers';

interface Props {
  event: Event | VolunteerOpportunity;
  isVolunteer?: boolean;
}

const EventDescription: FC<Props> = ({ event, isVolunteer = false }) => {
  return (
    <section className="mb-6">
      <h3 className="font-bold text-2xl">
        {isVolunteer
          ? __('volunteer_description_title')
          : __('event_description_title')}
      </h3>
      <p className="whitespace-pre-line">
        <Linkify
          componentDecorator={(decoratedHref, decoratedText, key) => (
            <a
              target="_blank"
              rel="nofollow noreferrer"
              href={decoratedHref}
              key={key}
              onClick={(e) => e.stopPropagation()}
            >
              {decoratedText}
            </a>
          )}
        >
          {event.description}
        </Linkify>
      </p>
    </section>
  );
};

export default EventDescription;
