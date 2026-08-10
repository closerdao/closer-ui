import React from 'react';

import UpcomingEventsIntro from '../UpcomingEventsIntro';

const CustomUpcomingEvents: React.FC<{
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}> = () => {
  return <UpcomingEventsIntro />;
};

export default CustomUpcomingEvents;
