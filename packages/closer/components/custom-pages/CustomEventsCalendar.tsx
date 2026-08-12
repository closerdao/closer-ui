import React from 'react';

import EventsCalendar from '../EventsCalendar';

const CustomEventsCalendar: React.FC<{
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}> = ({ settings }) => {
  const showCreateCta = settings?.showCreateCta !== false;
  const upcomingLimit =
    typeof settings?.upcomingLimit === 'number'
      ? settings.upcomingLimit
      : 100;
  const pastLimit =
    typeof settings?.pastLimit === 'number' ? settings.pastLimit : 50;

  return (
    <div className="py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <EventsCalendar
          showCreateCta={showCreateCta}
          upcomingLimit={upcomingLimit}
          pastLimit={pastLimit}
        />
      </div>
    </div>
  );
};

export default CustomEventsCalendar;
