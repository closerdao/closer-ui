import Link from 'next/link';

import { FC } from 'react';

import dayjs from 'dayjs';

import { useAuth } from '../../contexts/auth';
import { VolunteerOpportunity } from '../../types';
import { cdn } from '../../utils/api';
import { __ } from '../../utils/helpers';
import EventDescription from '../EventDescription';
import Heading from '../ui/Heading';

interface Props {
  volunteer: VolunteerOpportunity;
}

const VolunteerEventView: FC<Props> = ({ volunteer }) => {
  const {
    name,
    description,
    photo,
    start: startDate,
    end: endDate,
  } = volunteer || {};
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');
  if (!volunteer) {
    return null;
  }
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const duration = end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do HH:mm' : 'YYYY MMMM Do HH:mm';
  const isEnded = end.isBefore(dayjs());

  return (
    <div className="max-w-6xl mx-auto">
      <section className="mb-5">
        <div className="md:flex flex-row justify-center items-center gap-4">
          <div className="md:w-1/2 relative bg-gray-50">
            <img
              className="object-cover md:h-full md:w-full"
              src={`${cdn}${photo}-max-lg.jpg`}
              alt={name}
            />
          </div>
          <div className="md:w-1/2 justify-between flex flex-col self-stretch">
            <div>
              <div className="flex items-center gap-2 md:whitespace-nowrap">
                <span className="text-lg font-light">
                  {start && start.format(dateFormat)}
                  {end && duration > 24 && ` - ${end.format(dateFormat)}`}
                  {end && duration <= 24 && ` - ${end.format('HH:mm')}`}
                  {' '}({localTimezone} {__('events_time')})
                </span>
              </div>
              <Heading className="md:text-4xl font-bold">{name}</Heading>
              {isEnded && (
                <h3 className="p3 mr-2 italic">
                  {__('volunteer_page_opportunity_ended')}
                </h3>
              )}
              <div className="mt-4 event-actions flex items-center">
                {!isEnded && (
                  <Link
                    href={`/bookings/create/dates?volunteerId=${
                      volunteer._id
                    }&start=${start.format('YYYY-MM-DD')}&end=${end.format(
                      'YYYY-MM-DD',
                    )}`}
                  >
                    <button className="btn-primary mr-2">
                      {__('apply_submit_button')}
                    </button>
                  </Link>
                )}
                {hasStewardRole && (
                  <Link href={`/volunteer/${volunteer.slug}/edit`}>
                    <button className="btn-primary inline-flex items-center">
                      {__('button_edit_opportunity')}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {description && (
        <section className="max-w-prose py-10 mx-auto">
          <EventDescription event={volunteer} isVolunteer={true} />
        </section>
      )}
    </div>
  );
};

export default VolunteerEventView;
