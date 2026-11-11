import Metatags from '../../../components/Metatags';
import ProjectView from '../../../components/ProjectView';

import { convert } from 'html-to-text';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Project } from '../../../types/api';
import { fetchProject } from '../../../utils/community';
import NotFoundPage from '../../not-found';

interface Props {
  project: Project;
  descriptionText?: string;
}

const ProjectPage = ({ project, descriptionText }: Props) => {
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
      <ProjectView project={project} />
    </>
  );
};

ProjectPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const id = context.query.slug;
    const project = await fetchProject(String(id));

    return {
      project,
      descriptionText: project?.description
        ? convert(project.description).trim().slice(0, 160)
        : '',
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
