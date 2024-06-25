import Link from 'next/link';

import { FC } from 'react';

import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();
  const { start, end, photo, name, slug } = event || {};
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
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div role="listitem" className={className}>
      <div
        className={`h-full card rounded overflow-hidden
        ${
          isVolunteerCard
            ? 'flex gap-8 p-4 px-8'
            : 'card rounded overflow-hidden'
        }  
        `}
      >
        {!isVolunteerCard && (
          <p className="text-xs font-light">
            {startDate && dayjs(startDate).format(dateFormat)}
            {endDate &&
              duration > 24 &&
              ` - ${dayjs(endDate).format(dateFormat)}`}
            {endDate &&
              duration <= 24 &&
              ` - ${dayjs(endDate).format('HH:mm')}`}{' '}
            ({localTimezone} {t('events_time')})
          </p>
        )}
        <div
          className={`${
            isListView ? 'w-24 mt-3 mr-3 h-24' : '-mx-4 mt-4 h-44 md:h-50 '
          } bg-gray-50 overflow-hidden
          ${isVolunteerCard && 'w-[100px] h-[100px]'}
            `}
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
        <div
          className={` p-2  ${isListView ? 'w-2/3' : 'text-left'} first-letter:
        ${isVolunteerCard ? 'w-2/3' : ''}
        `}
        >
          <div className="event-description">
            <h4
              className={`${isListView ? 'text-sm' : 'font-bold text-xl'}
            // ${isVolunteerCard && 'w-2/3'}
            `}
            >
              <Link href={linkHref}>{name}</Link>
            </h4>
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
          </div>
        </div>
      </div>
    </div>
  );
};
EventPreview.defaultProps = {};

export default EventPreview;
