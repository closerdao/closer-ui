import Image from 'next/image';
import Link from 'next/link';

import { useState } from 'react';

import { Card, Heading, LinkButton } from '../../components/ui';

import { Project } from 'closer/types';
import { useTranslations } from 'next-intl';

import { cdn } from '../../utils/api';
import { toPhotoId } from '../../utils/events.helpers';
import { priceFormat } from '../../utils/helpers';
import Tag from '../Tag';

interface Props {
  project: Project;
  canManageProject: boolean;
}

const ProjectCard = ({ project, canManageProject }: Props) => {
  const t = useTranslations();
  const [imgError, setImgError] = useState(false);
  const photoId = toPhotoId(project?.photo);
  // A project with no photo — or one whose photo has gone missing from the CDN —
  // gets no image area at all, rather than a broken-image placeholder.
  const showImage = Boolean(photoId) && !imgError;

  return (
    <Card
      key={project?._id}
      className="p-0 bg-white border border-gray-100 justify-start"
    >
      {showImage && (
        <div className="relative w-full h-[180px] border rounded-t-md overflow-hidden">
          <Link
            className="hover:text-accent"
            href={`/projects/${project?.slug}`}
          >
            <Image
              src={`${cdn}${photoId}-post-md.jpg`}
              alt={project?.name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
            />
          </Link>
        </div>
      )}
      <div
        className={`relative px-4 pb-4 flex flex-col justify-between gap-4 ${
          showImage ? 'h-[calc(100%-180px)]' : 'h-full pt-4'
        }`}
      >
        <div className="space-y-2">
          <Heading level={3} className="uppercase">
            <Link
              className="hover:text-accent"
              href={`/projects/${project?.slug}`}
            >
              {project?.name}
            </Link>
          </Heading>

          <p>{project?.descriptionText}</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-md">
            <div className="flex gap-2 flex-wrap pb-2">
              {project?.skills?.map((skill) => (
                <Tag key={skill} size="small" color="primary">
                  {skill}
                </Tag>
              ))}
            </div>
            <p>
              {t('projects_reward')} {priceFormat(project?.reward)}
            </p>
            <p>
              {t('projects_budget')} {priceFormat(project?.budget)}
            </p>
            <p>
              {t('projects_estimate')} {project?.estimate}
            </p>
            <p>
              {t('projects_managed_by')}{' '}
              {project?.manager ? (
                <Link href={`/members/${project?.manager.slug}`}>
                  {project?.manager.screenname}
                </Link>
              ) : (
                <span>{t('projects_no_manager')}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {project?.documentUrl && (
              <LinkButton
                size="small"
                variant="secondary"
                href={project?.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('projects_go_to_document')}
              </LinkButton>
            )}

            <LinkButton size="small" href={`/projects/${project?.slug}`}>
              {t('projects_view_project_title')}
            </LinkButton>

            {canManageProject && (
              <LinkButton
                size="small"
                variant="secondary"
                href={`/projects/${project?.slug}/edit`}
              >
                {t('projects_edit_project_title')}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
