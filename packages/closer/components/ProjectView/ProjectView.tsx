import Link from 'next/link';

import { FC, ReactNode, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { userRolesCanManageProjects } from '../../constants/projectAccess';
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
}

const STATUS_STYLE: Record<string, 'green' | 'orange' | 'neutral'> = {
  open: 'green',
  'in-progress': 'orange',
  done: 'neutral',
};

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-b-0 sm:flex-row sm:gap-4 sm:items-baseline">
    <span className="text-sm uppercase font-bold text-gray-500 sm:w-40 sm:shrink-0">
      {label}
    </span>
    <span className="text-md">{children}</span>
  </div>
);

const ProjectView: FC<Props> = ({ project }) => {
  const t = useTranslations();

  const {
    name,
    description,
    start: startDate,
    end: endDate,
    documentUrl,
    budget,
    reward,
    estimate,
    skills,
    manager,
    status,
    _id,
  } = project || {};

  const { user, isAuthenticated } = useAuth();
  const [photo, setPhoto] = useState<string | null>(project?.photo ?? null);
  const canManageProject = userRolesCanManageProjects(user?.roles);
  if (!project) {
    return null;
  }

  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;
  const dateFormat = 'MMMM Do YYYY';
  const dateRange = start
    ? `${start.format(dateFormat)}${end ? ` – ${end.format(dateFormat)}` : ''}`
    : '';
  const hasEnded = Boolean(end && end.isBefore(dayjs()));
  const isDone = status === 'done';
  const canApply = !isDone;

  const statusLabel = t(
    isDone
      ? 'projects_status_done'
      : status === 'in-progress'
        ? 'projects_status_in_progress'
        : 'projects_status_open',
  );

  const applyButton = (
    <LinkButton href={`/projects/apply?projectId=${_id}`}>
      {t('projects_apply_to_project')}
    </LinkButton>
  );

  return (
    <div className="w-full flex items-center flex-col gap-4">
      <section className="w-full flex justify-center max-w-4xl">
        <div className="w-full relative">
          <EventPhoto
            event={null}
            user={user}
            photo={photo}
            cdn={cdn}
            isAuthenticated={isAuthenticated}
            setPhoto={setPhoto}
          />

          {canManageProject && (
            // With no photo `EventPhoto` renders nothing and the wrapper
            // collapses, so the controls only float over the image when there
            // is one to float over.
            <div
              className={`flex flex-col gap-4 ${
                photo ? 'absolute right-0 bottom-0 p-8' : 'items-end pt-4'
              }`}
            >
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

      <section className="w-full flex justify-center pb-16">
        <div className="max-w-4xl w-full flex flex-col gap-10">
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex gap-2 flex-wrap items-center">
              <Tag size="small" color={STATUS_STYLE[status ?? 'open']}>
                {statusLabel}
              </Tag>
              {skills?.map((skill) => (
                <Tag key={skill} size="small" color="primary">
                  {skill}
                </Tag>
              ))}
            </div>

            <div className="w-full flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
              <Heading level={1} className="md:text-4xl font-bold">
                {name}
              </Heading>
              {canApply && (
                <div className="w-full sm:w-[250px] sm:shrink-0">
                  {applyButton}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Heading level={2}>{t('projects_details_title')}</Heading>
            <div className="rounded-md border border-gray-100 bg-white px-4 sm:px-6">
              {reward ? (
                <DetailRow label={t('projects_reward_label')}>
                  {priceFormat(reward)}
                </DetailRow>
              ) : null}
              {budget ? (
                <DetailRow label={t('projects_budget_label')}>
                  {priceFormat(budget)}
                </DetailRow>
              ) : null}
              {estimate ? (
                <DetailRow label={t('projects_estimate_label')}>
                  {estimate}
                </DetailRow>
              ) : null}
              {dateRange ? (
                <DetailRow label={t('projects_residency_window_label')}>
                  {dateRange}
                  {hasEnded ? (
                    <span className="text-disabled">
                      {' '}
                      · {t('volunteer_opportunity_ended')}
                    </span>
                  ) : null}
                </DetailRow>
              ) : null}
              <DetailRow label={t('projects_managed_by_label')}>
                {manager?.slug ? (
                  <Link
                    className="hover:text-accent underline"
                    href={`/members/${manager.slug}`}
                  >
                    {manager.screenname}
                  </Link>
                ) : (
                  t('projects_no_manager')
                )}
              </DetailRow>
            </div>

            {documentUrl ? (
              <LinkButton
                size="small"
                className="w-fit"
                variant="secondary"
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('projects_go_to_document')}
              </LinkButton>
            ) : null}
          </div>

          {description && (
            <div className="flex flex-col gap-4">
              <Heading level={2}>{t('projects_about_title')}</Heading>
              <section className="max-w-2xl">
                <EventDescription event={project} isVolunteer={true} />
              </section>
            </div>
          )}

          <div className="rounded-md bg-accent-light p-6 sm:p-8 flex flex-col gap-4">
            <Heading level={2}>
              {canApply
                ? t('projects_ready_to_build_title')
                : t('projects_completed_notice_title')}
            </Heading>
            {canApply ? (
              <>
                <p>{t('projects_apply_flow_explainer')}</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>{t('projects_apply_step_application')}</li>
                  <li>{t('projects_apply_step_review')}</li>
                  <li>{t('projects_apply_step_booking')}</li>
                </ul>
                <div className="w-full sm:w-[250px]">{applyButton}</div>
              </>
            ) : (
              <>
                <p>{t('projects_completed_notice_body')}</p>
                <div className="w-full sm:w-[250px]">
                  <LinkButton variant="secondary" href="/projects">
                    {t('projects_see_open_projects')}
                  </LinkButton>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectView;
