import Metatags from '../../../components/Metatags';
import ProjectView from '../../../components/ProjectView';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Project, VolunteerConfig } from '../../../types/api';
import api from '../../../utils/api';
import NotFoundPage from '../../not-found';

interface Props {
  project: Project;
  descriptionText?: string;
  volunteerConfig?: VolunteerConfig;
}

const ProjectPage = ({ project, descriptionText, volunteerConfig }: Props) => {
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
    const [projectResponse, volunteerConfigResponse] =
      await Promise.all([
        api.get(`/project/${id}`),
        api.get('/config/volunteering'),
      ]);
    const project = projectResponse?.data?.results;
    const volunteerConfig = volunteerConfigResponse?.data?.results?.value;

    return {
      project,
      volunteerConfig,
    };
  } catch (error) {
    console.error(error);
    return {
      project: null,
      descriptionText: null,
      volunteerConfig: null,
    };
  }
};

export default ProjectPage;
