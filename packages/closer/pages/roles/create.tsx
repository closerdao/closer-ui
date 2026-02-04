import Head from 'next/head';

import CreateRoleView from '../../components/CreateRoleView';
import { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';

const CreateRole = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const hasSpaceHostRole = user?.roles?.includes('space-host');

  if (!hasSpaceHostRole) return <Page401 />;

  return (
    <>
      <Head>
        <title>{t('roles_create_page_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('roles_create_page_title')}
        subtitle={t('edit_model_create_intro')}
      >
        <CreateRoleView />
      </EditModelPageLayout>
    </>
  );
};

CreateRole.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );

    return { messages };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default CreateRole; 