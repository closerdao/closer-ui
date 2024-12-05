import Image from 'next/image';
import Link from 'next/link';

import { Card, Heading, LinkButton } from '../../components/ui';

import { Project } from 'closer/types';
import { useTranslations } from 'next-intl';

import { cdn } from '../../utils/api';
import { priceFormat } from '../../utils/helpers';
import Tag from '../Tag';

interface Props {
  project: Project;
  hasStewardRole: boolean;
}

const ProjectCard = ({ project, hasStewardRole }: Props) => {
  const t = useTranslations();
  return (
    <Card
      key={project?._id}
      className="p-0 bg-white border border-gray-100 justify-start"
    >
      <div className="relative w-full h-[180px] border rounded-t-md overflow-hidden">
        <Link className="hover:text-accent" href={`/projects/${project?.slug}`}>
          <Image
            src={`${cdn}${project?.photo}-post-md.jpg`}
            alt={project?.name}
            fill
            className="object-cover"
          />
        </Link>
      </div>
      <div className="relative px-4 pb-4 flex flex-col justify-between gap-4 h-[calc(100%-180px)]">
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

            {hasStewardRole && (
              <LinkButton size="small" href={`/projects/${project?.slug}/edit`}>
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
