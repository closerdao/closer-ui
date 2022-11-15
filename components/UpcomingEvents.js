import React from 'react';

import EventsList from './EventsList';

const now = new Date();

const UpcomingEvents = ({ ...props }) => (
  <EventsList
    {...props}
    where={{
      end: {
        $gt: now,
      },
    }}
  />
);
UpcomingEvents.defaultProps = {
  showPagination: true,
  list: false,
  card: false,
  queryParam: 'events',
};

export default UpcomingEvents;
