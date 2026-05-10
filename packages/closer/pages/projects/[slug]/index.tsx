import Metatags from '../../../components/Metatags';
import ProjectView from '../../../components/ProjectView';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Project, VolunteerConfig } from '../../../types/api';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import NotFoundPage from '../../not-found';

interface Props {
  project: Project;
  descriptionText?: string;
}

const ProjectPage = ({ project, descriptionText }: Props) => {
  const volunteerConfig = getCachedConfig('volunteering') as VolunteerConfig | null;
  const t = useTranslations();
  const { photo, name } = project || {};

  if (!project)
    return <NotFoundPage error={t('volunteer_page_does_not_exist')} />;

  return (
    <>
      <Metatags
        imageId={photo}
        title={name}
        description={descriptionText || ''}
      />
      <ProjectView
        project={project}
        timeFrame={volunteerConfig?.residenceTimeFrame || ''}
      />
    </>
  );
};

ProjectPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const id = context.query.slug;
    const projectResponse = await api.get(`/project/${id}`);
    const project = projectResponse?.data?.results;

    return {
      project,
    };
  } catch (error) {
    console.error(error);
    return {
      project: null,
      descriptionText: null,
    };
  }
};

export default ProjectPage;
