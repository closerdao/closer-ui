import Head from 'next/head';

import CreateProjectView from '../../../components/CreateProjectView';
import { EditModelPageLayout } from '../../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Page401 } from '../../..';
import { useAuth } from '../../../contexts/auth';
import { Project, VolunteerConfig } from '../../../types';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';

interface Props {
  project: Project;
}

const EditProject = ({ project }: Props) => {
  const volunteerConfig = getCachedConfig('volunteering') as VolunteerConfig | null;
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
      <EditModelPageLayout
        title={t('projects_edit_project_title')}
        backHref={`/projects/${project.slug}`}
        isEdit
      >
        <CreateProjectView
          isEditMode={true}
          data={project}
          dynamicField={skillsDynamicField}
        />
      </EditModelPageLayout>
    </>
  );
};

EditProject.getInitialProps = async (context: NextPageContext) => {
  try {
    const id = context.query.slug;
    const projectRes = await api.get(`/project/${id}`).catch(() => null);

    const project = projectRes?.data?.results;

    return {
      project,
    };
  } catch (error) {
    console.error(error);
    return {
      project: null,
    };
  }
};

export default EditProject;
