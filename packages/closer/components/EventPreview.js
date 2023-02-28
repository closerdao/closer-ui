import Link from 'next/link';

import React from 'react';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { cdn } from '../utils/api';

dayjs.extend(advancedFormat);

const EventPreview = ({ event, list }) => {
  const start = event.get('start') && dayjs(event.get('start'));
  const end = event.get('end') && dayjs(event.get('end'));
  const duration = end && end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do HH:mm' : 'YYYY MMMM Do HH:mm';

  return (
    <div
      key={event.get('_id')}
      className={`event-preview relative ${
        list ? 'mb-2' : 'md:pr-4 w-full md:w-1/3 mb-8'
      }`}
    >
      <div
        className={`${
          list ? 'flex flex-row' : 'card rounded bg-card overflow-hidden'
        }`}
      >
        <div
          className={`${
            list ? 'w-24 mt-3 mr-3 h-24' : '-mx-4 -mt-4 h-44 md:h-80 '
          } bg-gray-50 overflow-hidden`}
        >
          <Link href={`/events/${event.get('slug')}`}>

            {event.get('photo') ? (
              <img
                className="object-cover h-full w-full"
                src={`${cdn}${event.get('photo')}-place-lg.jpg`}
                alt={event.get('name')}
              />
            ) : (
              event.get('visual') && (
                <img
                  className="w-full object-fit md:h-full"
                  src={event.get('visual')}
                  alt={event.get('name')}
                />
              )
            )}

          </Link>
        </div>
        <div className={`p-2 ${list ? 'w-2/3' : 'text-left'}`}>
          <div className="event-description">
            <h4 className={`${list ? 'text-sm' : 'font-bold text-xl'}`}>
              <Link href={`/events/${event.get('slug')}`}>
                {event.get('name')}
              </Link>
            </h4>
            <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
              <FaCalendarAlt />
              <p className="text-xs font-light">
                {start && start.format(dateFormat)}
                {end && duration <= 24 && ` - ${end.format('HH:mm')}`}
              </p>
            </div>
            {event.get('location') && (
              <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
                <MdLocationOn />
                <p className="text-sm">Online</p>
              </div>
            )}
            {event.get('address') && (
              <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
                <MdLocationOn />
                <p className="text-sm">{event.get('address')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
EventPreview.defaultProps = {};

export default EventPreview;
