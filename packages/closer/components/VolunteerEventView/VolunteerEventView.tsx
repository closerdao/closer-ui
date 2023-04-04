import Link from 'next/link';

import { FC } from 'react';

import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';

import { useAuth } from '../../contexts/auth';
import { VolunteerOpportunity } from '../../types';
import { cdn } from '../../utils/api';
import { __ } from '../../utils/helpers';
import EventDescription from '../EventDescription';

interface Props {
  volunteer: VolunteerOpportunity;
  location?: string;
}

const VolunteerEventView: FC<Props> = ({ volunteer, location }) => {
  const {
    name,
    description,
    photo,
    start: startDate,
    end: endDate,
    slug,
  } = volunteer || {};
  const { user } = useAuth();

  if (!volunteer) {
    return null;
  }

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const duration = end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do HH:mm' : 'YYYY MMMM Do HH:mm';
  const isEnded = end.isBefore(dayjs());

  return (
    <div>
      <section className="py-5">
        <div className="main-content md:flex flex-row justify-center items-center">
          <div className="md:w-1/2 md:mr-4 mb-4 relative bg-gray-50 md:h-80">
            <img
              className="object-cover md:h-full md:w-full"
              src={`${cdn}${photo}-max-lg.jpg`}
              alt={name}
            />
          </div>
          <div className="md:w-1/2 mt-2">
            <h2 className="text-lg font-light md:whitespace-nowrap">
              {start && start.format(dateFormat)}
              {end && duration > 24 && ` - ${end.format(dateFormat)}`}
              {end && duration <= 24 && ` - ${end.format('HH:mm')}`}
            </h2>
            {location && (
              <h3 className="text-lg font-light text-gray-500 flex mt-2">
                <MdLocationOn />
                <p className="text-sm">{location}</p>
              </h3>
            )}
            {isEnded && (
              <h3 className="p3 mr-2 italic">
                {__('volunteer_page_opportunity_ended')}
              </h3>
            )}
            <h1 className="md:text-4xl mt-4 font-bold">{name}</h1>
            <div className="mt-4 event-actions flex items-center">
              {!isEnded && (
                <a href="mailto:traditionaldreamfactory@gmail.com">
                  <button className="btn-primary mr-2">
                    {__('apply_submit_button')}
                  </button>
                </a>
              )}
              {user?.roles.includes('admin') && (
                <Link href={`/volunteer/${slug}/edit`}>
                  <button className="btn-primary inline-flex items-center">
                    {__('button_edit_opportunity')}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      <main className="max-w-prose py-10 mx-auto">
        {description && <EventDescription event={volunteer} />}
      </main>
    </div>
  );
};

export default VolunteerEventView;
