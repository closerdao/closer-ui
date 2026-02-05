import Head from 'next/head';

import CreateVolunteerView from '../../components/CreateVolunteerView';
import { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';

const CreateVolunteerOportunity = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const hasStewardRole = user?.roles?.includes('steward');

  if (!hasStewardRole) return <Page401 />;

  return (
    <>
      <Head>
        <title>{t('volunteer_create_page_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('volunteer_create_page_title')}
        subtitle={t('edit_model_create_intro')}
      >
        <CreateVolunteerView />
      </EditModelPageLayout>
    </>
  );
};

CreateVolunteerOportunity.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default CreateVolunteerOportunity;
