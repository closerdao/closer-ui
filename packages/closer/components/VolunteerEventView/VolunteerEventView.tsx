import Image from 'next/image';

import { FC, useState } from 'react';

import dayjs from 'dayjs';

import { useAuth } from '../../contexts/auth';
import { VolunteerOpportunity } from '../../types';
import { cdn } from '../../utils/api';
import { __ } from '../../utils/helpers';
import EventDescription from '../EventDescription';
import EventPhoto from '../EventPhoto';
import UploadPhoto from '../UploadPhoto/UploadPhoto';
import { Card, LinkButton } from '../ui';
import Heading from '../ui/Heading';

interface Props {
  volunteer: VolunteerOpportunity;
}

const VolunteerEventView: FC<Props> = ({ volunteer }) => {
  const {
    name,
    description,
    photo: volunteerPhoto,
    start: startDate,
    end: endDate,
  } = volunteer || {};

  const { user, isAuthenticated } = useAuth();
  const [photo, setPhoto] = useState(volunteer && volunteerPhoto);
  const hasStewardRole = user?.roles?.includes('steward');
  if (!volunteer) {
    return null;
  }
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const duration = end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do' : 'MMMM Do';
  const isEnded = end.isBefore(dayjs());

  return (
    <div className="w-full flex items-center flex-col gap-4">
      <section className=" w-full flex justify-center max-w-4xl">
        <div className="w-full relative">
          <EventPhoto
            event={null}
            user={user}
            photo={photo}
            cdn={cdn}
            isAuthenticated={isAuthenticated}
            setPhoto={setPhoto}
          />

          {hasStewardRole && (
            <div className="absolute right-0 bottom-0 p-8 flex flex-col gap-4">
              <LinkButton
                size="small"
                href={volunteer.slug && `/volunteer/${volunteer.slug}/edit`}
              >
                {__('button_edit_opportunity')}
              </LinkButton>

              <UploadPhoto
                model="volunteer"
                id={volunteer._id}
                onSave={(id) => setPhoto(id)}
                label={photo ? 'Change photo' : 'Add photo'}
              />
            </div>
          )}
        </div>
      </section>

      <section className=" w-full flex justify-center">
        <div className="max-w-4xl w-full ">
          <div className="w-full py-2">
            <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex gap-1 items-center min-w-[120px]">
                <Image
                  alt="calendar icon"
                  src="/images/icons/calendar-icon.svg"
                  width={20}
                  height={20}
                />
                <label className="text-sm uppercase font-bold flex gap-1">
                  {start && dayjs(start).format(dateFormat)}
                  {end &&
                    Number(duration) > 24 &&
                    ` - ${dayjs(end).format(dateFormat)}`}
                  {end &&
                    Number(duration) <= 24 &&
                    ` - ${dayjs(end).format('HH:mm')}`}{' '}
                  {end && end.isBefore(dayjs()) && (
                    <p className="text-disabled">
                      {__('volunteer_opportunity_ended')}
                    </p>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className=" w-full flex justify-center min-h-[400px]">
        <div className="max-w-4xl w-full">
          <div className="flex flex-col sm:flex-row">
            <div className="flex items-start justify-between gap-6 w-full">
              <div className="flex flex-col gap-10 w-full sm:w-2/3">
                <Heading className="md:text-4xl mt-4 font-bold">{name}</Heading>

                {description && (
                  <section className="">
                    <EventDescription event={volunteer} isVolunteer={true} />
                  </section>
                )}
              </div>
              <div className="h-auto fixed bottom-0 left-0 sm:sticky sm:top-[100px] w-full sm:w-[250px]">
                {!isEnded && (
                  <Card className="bg-white border border-gray-100">
                    <LinkButton
                      href={`/bookings/create/dates?volunteerId=${
                        volunteer._id
                      }&start=${start.format('YYYY-MM-DD')}&end=${end.format(
                        'YYYY-MM-DD',
                      )}`}
                    >
                      {__('apply_submit_button')}
                    </LinkButton>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VolunteerEventView;
