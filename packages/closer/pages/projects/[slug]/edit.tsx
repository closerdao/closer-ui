import Head from 'next/head';

import CreateProjectView from '../../../components/CreateProjectView';
import { EditModelPageLayout } from '../../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Page401 } from '../../..';
import { userRolesCanManageProjects } from '../../../constants/projectAccess';
import { useAuth } from '../../../contexts/auth';
import { Project, VolunteerConfig } from '../../../types';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { fetchProject } from '../../../utils/community';

interface Props {
  project: Project;
}

const EditProject = ({ project }: Props) => {
  const volunteerConfig = getCachedConfig(
    'volunteering',
  ) as VolunteerConfig | null;
  const t = useTranslations();
  const { user } = useAuth();
  const canManageProjects = userRolesCanManageProjects(user?.roles);

  const skillsDynamicField = {
    name: 'skills',
    options: volunteerConfig?.skills?.split(',') ?? [],
  };

  if (!canManageProjects) return <Page401 />;
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
    const project = await fetchProject(String(id)).catch(() => null);

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
