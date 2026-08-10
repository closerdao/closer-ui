import Head from 'next/head';

import CreateProjectView from '../../components/CreateProjectView';
import { EditModelPageLayout } from '../../components/EditModel';

import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { VolunteerConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';

const CreateProject = () => {
  const volunteerConfig = getCachedConfig('volunteering') as VolunteerConfig | null;
  const t = useTranslations();
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  const skillsDynamicField = {
    name: 'skills',
    options: volunteerConfig?.skills?.split(',') || [],
  };

  if (!hasStewardRole) return <Page401 />;

  return (
    <>
      <Head>
        <title>{t('projects_create_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('projects_create_title')}
        subtitle={t('edit_model_create_intro')}
      >
        <CreateProjectView dynamicField={skillsDynamicField} />
      </EditModelPageLayout>
    </>
  );
};

export default CreateProject;
