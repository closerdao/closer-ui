import React from 'react';

import EventsList from './EventsList';

const now = new Date();

const UpcomingEvents = ({ showPagination = true, list = false, card = false, queryParam = 'events', ...props }) => (
  <EventsList
    showPagination={showPagination}
    list={list}
    card={card}
    queryParam={queryParam}
    {...props}
    where={{
      end: {
        $gt: now,
      },
    }}
  />
);
export default UpcomingEvents;
