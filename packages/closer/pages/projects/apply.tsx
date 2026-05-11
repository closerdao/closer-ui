import Head from 'next/head';
import { useRouter } from 'next/router';

import BookingBackButton from '../../components/BookingBackButton';
import PageError from '../../components/PageError';
import VolunteerOrResidenceApplication from '../../components/VolunteerOrResidenceApplication/VolunteerOrResidenceApplication';
import Heading from '../../components/ui/Heading';
import ProgressBar from '../../components/ui/ProgressBar';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { BOOKING_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { GeneralConfig, Project, VolunteerConfig } from '../../types';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import {
  default as PageNotAllowed,
  default as PageNotFound,
} from '../not-found';
import { useEffect } from 'react';

interface Props {
  error: string | null;
  projects: Project[];
}

const ProjectApplicationPage = ({ error, projects }: Props) => {
  const volunteerConfig = getCachedConfig('volunteering') as VolunteerConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const PLATFORM_NAME = generalConfig?.platformName || '';
  const t = useTranslations();

  const isVolunteerEnabled = volunteerConfig?.enabled;

  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/projects');
  };

  if (!isVolunteerEnabled) {
    return <PageNotFound />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${t(
          'projects_application_title',
        )} - ${PLATFORM_NAME}!`}</title>
      </Head>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="pb-4 mt-8">
          {t('projects_application_title')}
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        <VolunteerOrResidenceApplication
          volunteerConfig={volunteerConfig}
          type="residence"
          projects={projects}
        />
      </div>
    </>
  );
};

ProjectApplicationPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const projectsRes = await api.get('/project').catch(() => {
      return null;
    });

    const allProjects = projectsRes?.data?.results || [];
    // Filter out projects with status 'done'
    const projects = allProjects.filter((project: Project) => project.status !== 'done');

    return {
      projects,
    };
  } catch (err) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      projects: [],
      };
  }
};

export default ProjectApplicationPage;
