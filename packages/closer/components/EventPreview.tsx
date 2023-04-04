import Link from 'next/link';

import React, { FC } from 'react';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { Event, VolunteerOpportunity } from '../types';
import { cdn } from '../utils/api';

dayjs.extend(advancedFormat);

interface BaseProps {
  isListView?: boolean;
  className?: string;
}
interface EventProps extends BaseProps {
  event: Event;
  isVolunteerCard?: false | undefined;
}

interface VolunteerProps extends BaseProps {
  event: VolunteerOpportunity;
  isVolunteerCard: true;
}

const EventPreview: FC<VolunteerProps | EventProps> = ({
  event,
  isListView,
  className,
  isVolunteerCard,
}) => {
  const { start, end, photo, description, name, slug } = event || {};
  const {
    visual = '',
    virtual = false,
    location = '',
    address = '',
  } = isVolunteerCard ? {} : event;
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const duration = endDate?.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do HH:mm' : 'YYYY MMMM Do HH:mm';
  const linkHref = isVolunteerCard ? `/volunteer/${slug}` : `/events/${slug}`;
  console.log(linkHref);
  return (
    <div role="listitem" className={className}>
      <div
        className={`h-full ${
          isListView ? 'flex flex-row' : 'card rounded bg-card overflow-hidden'
        }`}
      >
        <div
          className={`${
            isListView ? 'w-24 mt-3 mr-3 h-24' : '-mx-4 -mt-4 h-44 md:h-80 '
          } bg-gray-50 overflow-hidden`}
        >
          <Link href={linkHref}>
            {photo ? (
              <img
                className="object-cover h-full w-full"
                src={`${cdn}${photo}-place-lg.jpg`}
                alt={name}
              />
            ) : (
              visual && (
                <img
                  className="w-full object-fit md:h-full"
                  src={visual}
                  alt={name}
                />
              )
            )}
          </Link>
        </div>
        <div className={`p-2 ${isListView ? 'w-2/3' : 'text-left'}`}>
          <div className="event-description">
            <h4 className={`${isListView ? 'text-sm' : 'font-bold text-xl'}`}>
              <Link href={linkHref}>{name}</Link>
            </h4>
            <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
              <FaCalendarAlt />
              <p className="text-xs font-light">
                {startDate && startDate.format(dateFormat)}
                {endDate && duration <= 24 && ` - ${endDate.format('HH:mm')}`}
                {endDate &&
                  duration >= 24 &&
                  ` - ${endDate.format(dateFormat)}`}
              </p>
            </div>
            {virtual && (
              <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
                <MdLocationOn />
                <p className="text-sm">Online</p>
              </div>
            )}
            {(address || location) && !virtual && (
              <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
                <MdLocationOn />
                <p className="text-sm">{address || location}</p>
              </div>
            )}
            {isVolunteerCard && description && (
              <p className="text-sm line-clamp-3 mt-4">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
EventPreview.defaultProps = {};

export default EventPreview;
