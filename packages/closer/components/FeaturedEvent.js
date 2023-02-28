import Link from 'next/link';

import React from 'react';

import dayjs from 'dayjs';

import { cdn } from '../utils/api';

const FeaturedEvent = ({ event }) => {
  const start = event.get('start') && dayjs(event.get('start'));
  const end = event.get('end') && dayjs(event.get('end'));

  return (
    <div key={event.get('_id')} className="shadow-sm">
      <div className="main-content flex flex-row p-2 justify-between">
        <div className="preview flex flex-row">
          {event.get('photo') && (
            <div className="mr-4">
              <Link href={`/events/${event.get('slug')}`}>

                <img
                  className="h-16 object-cover"
                  src={`${cdn}${event.get('photo')}-post-md.jpg`}
                  alt={event.get('name')}
                />

              </Link>
            </div>
          )}
          <div className="event-description flex flex-col items-start justify-center">
            <h4 className="text-sm md:text-md font-bold">
              <Link href={`/events/${event.get('slug')}`}>

                {event.get('name').slice(0, 50)}
                {event.get('name').length > 50 && '...'}

              </Link>
            </h4>
            {start && (
              <p className="text-gray-400 text-xs">
                {start.format('MMM Do')}
                {end && ` - ${end.format('MMM Do')}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end grow w-48">
          <Link href={`/events/${event.get('slug')}`} className="btn-primary text-sm">

            {event.get('paid') ? 'Get your ticket' : 'See event'}

          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvent;
