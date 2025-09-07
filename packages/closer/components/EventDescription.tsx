import React, { FC, useEffect, useState } from 'react';

import { type Event, VolunteerOpportunity } from '../types';

interface Props {
  event: Event | VolunteerOpportunity;
  isVolunteer?: boolean;
}

const EventDescription: FC<Props> = ({ event, isVolunteer = false }) => {
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  // This useEffect is needed to fix next js hydration issue
  useEffect(() => {
    setInitialRenderComplete(true);
  }, []);

  return (
    <section className="mb-6 flex flex-col gap-6">
      {initialRenderComplete && (
        <div
          className="rich-text word-break overflow-hidden"
          dangerouslySetInnerHTML={{ __html: event.description }}
        />
      )}
    </section>
  );
};

export default EventDescription;
