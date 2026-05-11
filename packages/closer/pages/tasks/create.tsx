import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';

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
    return {
    };
  } catch (err: unknown) {
    return {
      };
  }
};

export default CreateTask;
