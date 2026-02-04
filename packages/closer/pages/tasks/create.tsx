import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { loadLocaleData } from '../../utils/locale.helpers';

const CreateTask = () => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{t('tasks_create_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('tasks_create_title')}
        subtitle={t('edit_model_create_intro')}
      >
        <EditModel
          endpoint={'/task'}
          fields={models.task}
          onSave={(event) => router.push(`/tasks/${event.slug}`)}
        />
      </EditModelPageLayout>
    </>
  );
};

CreateTask.getInitialProps = async (context: NextPageContext) => {
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

export default CreateTask;
