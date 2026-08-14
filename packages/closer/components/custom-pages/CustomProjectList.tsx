import React, { useEffect, useState } from 'react';

import { convert } from 'html-to-text';
import { useTranslations } from 'next-intl';

import { userRolesCanManageProjects } from '../../constants/projectAccess';
import { useAuth } from '../../contexts/auth';
import type { Project } from '../../types/api';
import api, { formatSearch } from '../../utils/api';
import { resolveBlockText } from '../../utils/blockI18n';
import ProjectCard from '../ProjectCard/ProjectCard';
import { Heading, LinkButton, Spinner } from '../ui';

interface Props {
  settings?: {
    showInProgress?: boolean;
    showCompleted?: boolean;
    limit?: number;
  };
  content?: {
    title?: string;
    inProgressTitle?: string;
    completedTitle?: string;
  };
}

/** One request for every manager, rather than one per project. */
const fetchManagersByIds = async (ids: string[]): Promise<any[]> => {
  if (ids.length === 0) return [];
  try {
    const { data } = await api.get(
      `/user?where=${formatSearch({ _id: { $in: ids } })}`,
      { params: { limit: 200 } },
    );
    const results = data?.results || data;
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
};

const withPreview = (project: Project, managers: Map<string, any>): Project => ({
  ...project,
  descriptionText: project.description
    ? `${convert(project.description).trim().slice(0, 120)}...`
    : '',
  manager: project.createdBy ? managers.get(project.createdBy) : undefined,
});

const CustomProjectList = ({ settings, content }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward') || false;
  const canAddProject = userRolesCanManageProjects(user?.roles);

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showInProgress = settings?.showInProgress !== false;
  const showCompleted = settings?.showCompleted !== false;
  const limit = Number(settings?.limit) > 0 ? Number(settings?.limit) : undefined;

  useEffect(() => {
    let isCurrent = true;

    const loadProjects = async () => {
      try {
        const res = await api.get('/project');
        const results: Project[] = res?.data?.results || [];
        const managerIds = Array.from(
          new Set(results.map((project) => project.createdBy).filter(Boolean)),
        );
        const managers = new Map<string, any>();
        const users = await fetchManagersByIds(managerIds);
        users.forEach((manager: any) => managers.set(manager._id, manager));
        if (!isCurrent) return;
        setProjects(results.map((project) => withPreview(project, managers)));
      } catch {
        if (isCurrent) setProjects([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadProjects();
    return () => {
      isCurrent = false;
    };
  }, []);

  const byStatus = (match: (status?: string) => boolean) => {
    const matched = (projects ?? []).filter((project) => match(project.status));
    return limit ? matched.slice(0, limit) : matched;
  };

  const openProjects = byStatus(
    (status) => status !== 'done' && status !== 'in-progress',
  );
  const inProgressProjects = showInProgress
    ? byStatus((status) => status === 'in-progress')
    : [];
  const completedProjects = showCompleted
    ? byStatus((status) => status === 'done')
    : [];

  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : t('projects_build_projects_title');
  const inProgressTitle = content?.inProgressTitle?.trim()
    ? resolveBlockText(content.inProgressTitle, t)
    : t('projects_in_progress_title');
  const completedTitle = content?.completedTitle?.trim()
    ? resolveBlockText(content.completedTitle, t)
    : t('projects_completed_title');

  const renderGrid = (items: Project[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((project) => (
        <ProjectCard
          key={project.slug}
          project={project}
          hasStewardRole={hasStewardRole}
        />
      ))}
    </div>
  );

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {title ? <Heading level={2}>{title}</Heading> : null}
            {canAddProject && (
              <LinkButton
                size="small"
                variant="secondary"
                className="w-fit"
                href="/projects/create"
              >
                {t('projects_add_project')}
              </LinkButton>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : openProjects.length > 0 ? (
            renderGrid(openProjects)
          ) : (
            <p className="text-gray-500">{t('projects_no_active_projects')}</p>
          )}
        </div>

        {!isLoading && inProgressProjects.length > 0 && (
          <div className="flex flex-col gap-6">
            <Heading level={2}>{inProgressTitle}</Heading>
            {renderGrid(inProgressProjects)}
          </div>
        )}

        {!isLoading && showCompleted && (
          <div className="flex flex-col gap-6">
            <Heading level={2}>{completedTitle}</Heading>
            {completedProjects.length > 0 ? (
              renderGrid(completedProjects)
            ) : (
              <p className="text-gray-500">
                {t('projects_no_completed_projects')}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomProjectList;
