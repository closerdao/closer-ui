import Head from 'next/head';
import Image from 'next/image';

import ProjectCard from '../../components/ProjectCard/ProjectCard';
import PageError from 'closer/components/PageError';
import { Heading, LinkButton } from 'closer/components/ui';

import { GeneralConfig, Project, api, useAuth } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import { VolunteerConfig } from 'closer/types/api';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
  error: string | null;
  projects: Project[] | null;
  volunteerConfig: VolunteerConfig | null;
}

const ProjectsPage = ({
  generalConfig,
  error,
  projects,
  volunteerConfig,
}: Props) => {
  const t = useTranslations();

  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${t('projects_page_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className=" pb-24">
        <section
          className="w-full flex justify-center max-w-4xl mx-auto mb-4 relative"
          style={{ position: 'relative' }}
        >
          <Image
            alt="Traditional Dream Factory Builders Residency"
            src="/images/builders-l.png"
            width={1344}
            height={600}
          />

          {hasStewardRole && (
            <LinkButton
              href="/projects/create"
              className="w-fit absolute bottom-6 right-6  z-10 "
            >
              {t('projects_create_title')}
            </LinkButton>
          )}
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
                  <p className="text-sm uppercase font-bold flex gap-1">
                    {volunteerConfig?.residenceTimeFrame}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className=" w-full flex justify-center min-h-[400px]">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col sm:flex-row">
              <div className="flex items-start justify-between gap-6 w-full">
                <div className="flex flex-col gap-6 w-full ">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 items-center pt-4">
                    <Heading level={1} className="md:text-4xl  font-bold">
                      {t('projects_builders_residency_open_call')}
                    </Heading>
                    <div className=" w-full sm:w-[250px]">
                      <LinkButton href="/projects/apply">
                        {t('apply_submit_button')}
                      </LinkButton>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <p>{t('projects_starting_to_build')}</p>
                    <p>
                      <strong className="uppercase">
                        {t('projects_requirements_label')}
                      </strong>{' '}
                      {t('projects_requirements_value')}
                    </p>
                    <p>
                    <strong className="uppercase">
                        {t('projects_token_rewards_label')}
                      </strong>{' '}
                      {t('projects_token_rewards_value')}
                    </p>
                    <p>
                      <strong className="uppercase">
                        {t('projects_community_culture_label')}
                      </strong>{' '}
                      {t('projects_community_culture_value')}
                    </p>
                    <Heading level={2}>
                      {t('projects_build_projects_title')}
                    </Heading>

                    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
                    {
                      !projects ||
                      projects.filter(project => (project.status !== 'done' && project.status !== 'in-progress')).length === 0 ?
                      <p className="p-2">{t('projects_no_active_projects')}</p>:
                      projects
                      .filter(project => (project.status !== 'done' && project.status !== 'in-progress'))
                      .map((project) => (
                        <ProjectCard
                          key={project.slug}
                          project={project}
                          hasStewardRole={hasStewardRole || false}
                        />
                      ))
                    }
                    </section>

                    <Heading level={2}>{t('projects_completed_title')}</Heading>
                    {projects && 
                      projects.filter(project => (project.status === 'done')).length === 0 &&
                      <p className="p-2">{t('projects_no_active_projects')}</p>
                    }

                    {projects && projects.length > 0 && (
                      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
                        {projects
                          .filter(project => (project.status === 'done'))
                          .map((project) => (
                            <ProjectCard
                              key={project.slug}
                              project={project}
                              hasStewardRole={hasStewardRole || false}
                            />
                          ))}
                      </section>
                    )}

                    <Heading level={2}>
                      {t('projects_skills_and_qualifications_title')}
                    </Heading>
                    <ul className="mb-4 list-disc pl-5">
                      <li>{t('projects_skill_practical_build')}</li>
                      <li>{t('projects_skill_electrical')}</li>
                      <li>{t('projects_skill_plumbing')}</li>
                      <li>{t('projects_skill_cement_plastering')}</li>
                      <li>{t('projects_skill_carpentry')}</li>
                      <li>{t('projects_skill_painting_decorating')}</li>
                      <li>{t('projects_skill_stoneworks')}</li>
                      <li>{t('projects_skill_tools_machinery')}</li>
                      <li>{t('projects_skill_design_drawing')}</li>
                    </ul>

                    <p>
                      <strong className="uppercase">
                        {t('projects_time_frame_label')}
                      </strong>{' '}
                      {t('projects_time_frame_value', {
                        time: volunteerConfig?.residenceTimeFrame,
                      })}
                    </p>
                    <p>{t('projects_booking_recommendation')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

ProjectsPage.getInitialProps = async (context: NextPageContext) => {
  const { convert } = require('html-to-text');

  try {
    const [messages, generalRes, projectsRes, volunteerConfigRes] =
      await Promise.all([
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
        api.get('/config/general').catch(() => null),
        api.get('/project').catch(() => {
          return null;
        }),
        api.get('/config/volunteering').catch(() => null),
      ]);
    const projectManagerIds = projectsRes?.data?.results?.map(
      (project: Project) => project.createdBy,
    );

    const projectManagersRes = await Promise.all(
      projectManagerIds.map((id: string) => api.get(`/user/${id}`)),
    );

    const projectManagers = projectManagersRes.map((res) => res?.data?.results);

    const generalConfig = generalRes?.data?.results?.value;
    const volunteerConfig = volunteerConfigRes?.data?.results?.value;
    const projects =
      projectsRes?.data?.results.map((project: Project, index: number) => ({
        ...project,
        descriptionText:
          convert(project.description).trim().slice(0, 120) + '...',
        manager: projectManagers[index],
      })) || null;

    return { messages, generalConfig, projects, volunteerConfig };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
      projects: null,
      volunteerConfig: null,
    };
  }
};

export default ProjectsPage;
