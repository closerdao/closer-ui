import Metatags from '../../../components/Metatags';
import ProjectView from '../../../components/ProjectView';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Project } from '../../../types/api';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';
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
  const { convert } = require('html-to-text');
  try {
    const id = context.query.slug;
    const [projectResponse, messages] = await Promise.all([
      api.get(`/project/${id}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const project = projectResponse?.data?.results;

    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };
    const descriptionText = convert(project.description, options)
      .trim()
      .slice(0, 100);

    return {
      project,
      descriptionText,
      messages,
    };
  } catch (error) {
    console.error(error);
    return {
      project: null,
      descriptionText: null,
      messages: null,
    };
  }
};

export default ProjectPage;
