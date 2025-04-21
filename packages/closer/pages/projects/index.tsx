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
                      Builders Residency Open Call
                    </Heading>
                    <div className=" w-full sm:w-[250px]">
                      <LinkButton href="/projects/apply">
                        {t('apply_submit_button')}
                      </LinkButton>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <p>
                      We are starting to build! TDF has secured funding to start
                      major renovations. In Jan 2025, the first phase of
                      accommodation will start with a professional contractor,
                      and alongside that, we are self-building various projects
                      to support the opening of TDF V2.
                    </p>

                    <p>
                      <strong className="uppercase">Requirements: </strong> 6
                      hours per day, 1 month minimum ✅. Free accommodation &
                      food (glamping tents and dorms available, or bring your
                      van)
                    </p>

                    <p>
                      <strong className="uppercase">
                        Token rewards for completed projects!💰
                      </strong>{' '}
                      We will be offering tokens to builders who take projects
                      from start to completion. Rewards will be negotiated with
                      the team.
                    </p>

                    <p>
                      <strong className="uppercase">Community culture: </strong>
                      Experience co-living with fellow builders and the TDF
                      team. We will have regular community activities, saunas,
                      experiential dinners, music jams, music jams, embodiment
                      practices, yoga, massage, and more 🥙💃🏽🔥🎶🎭
                    </p>

                    <Heading level={2}>{t('open_projects')} 🛠🏡🛕</Heading>

                    {projects && projects.length > 0 && projects.some(project => project.status === 'open') ? (
                      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
                        {projects
                          .filter(project => project.status === 'open')
                          .map((project) => (
                            <ProjectCard
                              key={project.slug}
                              project={project}
                              hasStewardRole={hasStewardRole || false}
                            />
                          ))}
                      </section>
                    ) : (
                      <p className="text-gray-500 italic mb-8">{t('no_open_projects')}</p>
                    )}
                    
                    <Heading level={2} className="mt-12">{t('in_progress_projects')} 🔨</Heading>
                    
                    {projects && projects.some(project => project.status === 'in-progress') ? (
                      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
                        {projects
                          .filter(project => project.status === 'in-progress')
                          .map((project) => (
                            <ProjectCard
                              key={project.slug}
                              project={project}
                              hasStewardRole={hasStewardRole || false}
                            />
                          ))}
                      </section>
                    ) : (
                      <p className="text-gray-500 italic mb-8">{t('no_in_progress_projects')}</p>
                    )}
                    
                    <Heading level={2} className="mt-12">{t('completed_projects')} ✅</Heading>
                    
                    {projects && projects.some(project => project.status === 'done') ? (
                      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
                        {projects
                          .filter(project => project.status === 'done')
                          .map((project) => (
                            <ProjectCard
                              key={project.slug}
                              project={project}
                              hasStewardRole={hasStewardRole || false}
                            />
                          ))}
                      </section>
                    ) : (
                      <p className="text-gray-500 italic mb-8">{t('no_completed_projects')}</p>
                    )}

                    <Heading level={2}>
                      Skill & qualifications that can support us 👍🏼
                    </Heading>
                    <ul className="mb-4 list-disc pl-5">
                      <li>Practical build skills</li>
                      <li>Electrical</li>
                      <li>Plumbing</li>
                      <li>Cement & plastering</li>
                      <li>Carpentry</li>
                      <li>Painting & decorating</li>
                      <li>Stoneworks</li>
                      <li>Tools & machinery operation</li>
                      <li>Design & drawing skills</li>
                    </ul>

                    <p>
                      <strong className="uppercase">Time frame: </strong>{' '}
                      Starting {volunteerConfig?.residenceTimeFrame} 🗓.
                    </p>
                    <p>
                      We are ideally looking for people to join us from October
                      and stay with the team over winter, but the build will
                      continue to the end of next year.
                    </p>
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
