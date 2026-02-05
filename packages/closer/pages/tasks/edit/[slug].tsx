import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  task: any;
}

const EditTask = ({ task }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const onUpdate = async (
    name: any,
    value: any,
    option: any,
    actionType: any,
  ) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/task/${task._id}/add`, option);
    }
  };
  if (!task) {
    return <Heading>{t('tasks_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>{`${t('tasks_edit_title')} - ${task.name}`}</title>
      </Head>
      <EditModelPageLayout
        title={`${t('tasks_edit_title')} ${task.name}`}
        backHref={`/tasks/${task.slug}`}
        isEdit
      >
        <EditModel
          id={task._id}
          endpoint={'/task'}
          fields={models.task}
          onSave={(task) => router.push(`/tasks/${task.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton="Delete Task"
          onDelete={() => router.push('/')}
        />
      </EditModelPageLayout>
    </>
  );
};

EditTask.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    if (!query.slug) {
      throw new Error('No task');
    }
    const [taskResponse, messages] = await Promise.all([
      api.get(`/task/${query.slug}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const task = taskResponse.data.results;
    return { task, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default EditTask;
