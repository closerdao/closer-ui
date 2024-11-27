import Head from 'next/head';

import CreateProjectView from '../../components/CreateProjectView';
import { Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { VolunteerConfig } from '../../types';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  volunteerConfig: VolunteerConfig;
}

const CreateProject = ({ volunteerConfig }: Props) => {
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
      <div>
        <Heading level={2} className="mb-2">
          {t('projects_create_title')}
        </Heading>
        <CreateProjectView dynamicField={skillsDynamicField} />
      </div>
    </>
  );
};

CreateProject.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages, volunteerConfigRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME).catch(
        (error) => {
          console.error('Failed to load locale data:', error);  
          return null;
        },
      ),
      api.get('/config/volunteering').catch((error) => {
        console.error('Failed to load volunteer config:', error);
        return null;
      }),
    ]);

    const volunteerConfig = volunteerConfigRes?.data?.results.value;

    return {
      volunteerConfig,
      messages,
    };
  } catch (error) {
    console.error(error);
    return {
      messages: null,
      volunteerConfig: null,
    };
  }
};

export default CreateProject;
