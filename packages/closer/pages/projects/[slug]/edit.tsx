import Head from 'next/head';

import CreateProjectView from '../../../components/CreateProjectView';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Page401 } from '../../..';
import { useAuth } from '../../../contexts/auth';
import { Project, VolunteerConfig } from '../../../types';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  project: Project;
  volunteerConfig: VolunteerConfig;
}

const EditProject = ({ project, volunteerConfig }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  const skillsDynamicField = {
    name: 'skills',
    options: volunteerConfig?.skills?.split(',') ?? [],
  };

  if (!hasStewardRole) return <Page401 />;
  return (
    <>
      <Head>
        <title>{t('projects_edit_project_title')}</title>
      </Head>
      <div>
        <Heading level={2} className="mb-2">
          {t('projects_edit_project_title')}
        </Heading>
        <CreateProjectView
          isEditMode={true}
          data={project}
          dynamicField={skillsDynamicField}
        />
      </div>
    </>
  );
};

EditProject.getInitialProps = async (context: NextPageContext) => {
  try {
    const id = context.query.slug;
    const [projectRes, messages, volunteerConfigRes] = await Promise.all([
      api.get(`/project/${id}`).catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME).catch(
        () => {
          return null;
        },
      ),
      api.get('/config/volunteering').catch(() => {
        return null;
      }),
    ]);

    const project = projectRes?.data?.results;
    const volunteerConfig = volunteerConfigRes?.data?.results.value;

    return {
      project,
      volunteerConfig,
      messages,
    };
  } catch (error) {
    console.error(error);
    return {
      project: null,
      messages: null,
      volunteerConfig: null,
    };
  }
};

export default EditProject;
