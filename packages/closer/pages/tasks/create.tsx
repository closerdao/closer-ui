import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../components/EditModel';

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
      <div className="main-content intro">
        <EditModel
          endpoint={'/task'}
          fields={models.task}
          onSave={(event) => router.push(`/tasks/${event.slug}`)}
        />
      </div>
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
