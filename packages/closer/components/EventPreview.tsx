import Link from 'next/link';

import { FC } from 'react';

import { MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { Event, VolunteerOpportunity } from '../types';
import { cdn } from '../utils/api';

const stripHtml = (html: string): string =>
  html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';

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
    description = '',
    visual = '',
    virtual = false,
    location = '',
    address = '',
  } = isVolunteerCard ? {} : event;
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const duration = endDate?.diff(start, 'hour', true);
  const isSameDay = startDate.isSame(endDate, 'day');
  const dateStr = isSameDay
    ? startDate.format('MMM D')
    : `${startDate.format('MMM D')} – ${endDate.format('MMM D')}`;
  const timeStr =
    isSameDay && duration > 0 && duration <= 24
      ? `, ${startDate.format('h a')}–${endDate.format('h a')}`
      : '';
  const linkHref = isVolunteerCard ? `/volunteer/${slug}` : `/events/${slug}`;
  const strippedDesc = !isVolunteerCard && description ? stripHtml(description) : '';
  const teaser = strippedDesc.slice(0, 120);

  if (isVolunteerCard) {
    return (
      <div role="listitem" className={className}>
        <div className="h-full card rounded overflow-hidden flex gap-8 p-4 px-8">
          <div className="w-[100px] h-[100px] bg-gray-50 overflow-hidden">
            <Link href={linkHref}>
              {photo ? (
                <img
                  className="object-cover h-full w-full"
                  src={`${cdn}${photo}-place-lg.jpg`}
                  alt={name}
                />
              ) : (
                visual && (
                  <img className="w-full object-fit h-full" src={visual} alt={name} />
                )
              )}
            </Link>
          </div>
          <div className="w-2/3 p-2 text-left">
            <h4 className="font-bold text-xl">
              <Link href={linkHref}>{name}</Link>
            </h4>
            {virtual && (
              <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
                <MapPin className="h-4 w-4" />
                <p className="text-sm">Online</p>
              </div>
            )}
            {(address || location) && !virtual && (
              <div className="flex flex-row items-center space-x-1 mt-2 text-gray-500">
                <MapPin className="h-4 w-4" />
                <p className="text-sm">{address || location}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isListView) {
    return (
      <div role="listitem" className={className}>
        <Link
          href={linkHref}
          className="group flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-light transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
            {photo ? (
              <img
                className="object-cover h-full w-full"
                src={`${cdn}${photo}-place-lg.jpg`}
                alt={name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                {startDate.format('D')}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
              {name}
            </p>
            <p className="text-xs text-gray-500">
              {dateStr}{timeStr}
            </p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div role="listitem" className={className}>
      <Link
        href={linkHref}
        className="group block h-full rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-200"
      >
        <div className="h-48 md:h-52 bg-gray-100 overflow-hidden">
          {photo ? (
            <img
              className="object-cover h-full w-full group-hover:scale-[1.02] transition-transform duration-200"
              src={`${cdn}${photo}-place-lg.jpg`}
              alt={name}
            />
          ) : (
            visual && (
              <img
                className="object-cover h-full w-full group-hover:scale-[1.02] transition-transform duration-200"
                src={visual}
                alt={name}
              />
            )
          )}
        </div>
        <div className="p-5 text-left">
          <p className="text-xs text-gray-500 mb-2">
            {dateStr}{timeStr}
          </p>
          <h4 className="font-semibold text-gray-900 group-hover:text-accent transition-colors text-lg mb-2">
            {name}
          </h4>
          {teaser && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
              {teaser}
              {strippedDesc.length > 120 ? '…' : ''}
            </p>
          )}
          {(virtual || address || location) && (
            <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm truncate">
                {virtual ? t('events_online') : address || location}
              </p>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
export default EventPreview;
