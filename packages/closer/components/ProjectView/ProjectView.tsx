import Image from 'next/image';
import Link from 'next/link';

import { FC, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { Project } from '../../types';
import { cdn } from '../../utils/api';
import { priceFormat } from '../../utils/helpers';
import EventDescription from '../EventDescription';
import EventPhoto from '../EventPhoto';
import Tag from '../Tag';
import UploadPhoto from '../UploadPhoto';
import { LinkButton } from '../ui';
import Heading from '../ui/Heading';

interface Props {
  project: Project;
  timeFrame?: string;
}

const ProjectView: FC<Props> = ({ project, timeFrame }) => {
  const t = useTranslations();

  const {
    name,
    description,
    photo: projectPhoto,
    start: startDate,
    end: endDate,
    documentUrl,
    budget,
    reward,
    estimate,
    skills,
    manager,
    _id,
  } = project || {};

  const { user, isAuthenticated } = useAuth();
  const [photo, setPhoto] = useState<string | null>(project?.photo ?? null);
  const hasStewardRole = user?.roles?.includes('steward');
  if (!project) {
    return null;
  }
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const duration = end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do' : 'MMMM Do';

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
                href={project.slug && `/projects/${project.slug}/edit`}
              >
                {t('button_edit_project')}
              </LinkButton>

              <UploadPhoto
                model="project"
                id={project._id}
                onSave={(id) => setPhoto(id[0])}
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
                  {timeFrame ?? (
                    <>
                      {start && dayjs(start).format(dateFormat)}
                      {end &&
                        Number(duration) > 24 &&
                        ` - ${dayjs(end).format(dateFormat)}`}
                      {end &&
                        Number(duration) <= 24 &&
                        ` - ${dayjs(end).format('HH:mm')}`}{' '}
                      {end && end.isBefore(dayjs()) && (
                        <p className="text-disabled">
                          {t('project_opportunity_ended')}
                        </p>
                      )}
                    </>
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
            <div className="flex items-start justify-between gap-6 w-full ">
              <div className="flex flex-col gap-10 w-full overflow-hidden">
                <div className=" w-full flex flex-col sm:flex-row justify-between gap-4 items-center pt-4">
                  <Heading level={1} className="md:text-4xl  font-bold">
                    {name}
                  </Heading>
                  <div className=" w-full sm:w-[250px]">
                    <LinkButton href={`/projects/apply?projectId=${_id}`}>
                      {t('apply_submit_button')}
                    </LinkButton>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2 text-md">
                    <div className="flex gap-2 flex-wrap pb-2">
                      {skills &&
                        skills.map((skill) => (
                          <Tag key={skill} size="small" color="primary">
                            {skill}
                          </Tag>
                        ))}
                    </div>
                    <p>
                      {t('projects_reward')} {priceFormat(reward)}
                    </p>
                    <p>
                      {t('projects_budget')} {priceFormat(budget)}
                    </p>
                    <p>
                      {t('projects_estimate')} {estimate}
                    </p>
                    <p>
                      {t('projects_managed_by')}{' '}
                      <Link href={`/members/${manager?.slug}`}>
                        {manager?.screenname}
                      </Link>
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <LinkButton
                      size="small"
                      className="w-fit"
                      variant="secondary"
                      href={documentUrl}
                      target="_blank"
                    >
                      {t('projects_go_to_document')}
                    </LinkButton>
                  </div>
                </div>

                {description && (
                  <section className="max-w-2xl">
                    <EventDescription event={project} isVolunteer={true} />
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectView;
