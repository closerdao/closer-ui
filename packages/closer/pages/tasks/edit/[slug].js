import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import models from '../../../models';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EditTask = ({ task }) => {
  const router = useRouter();
  const onUpdate = async (name, value, option, actionType) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/task/${task._id}/add`, option);
    }
  };
  if (!task) {
    return <Heading>{__('tasks_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>
          {__('tasks_edit_title')} {task.name}
        </title>
      </Head>
      <div className="main-content">
        <EditModel
          id={task._id}
          endpoint={'/task'}
          fields={models.task}
          buttonText="Save"
          onSave={(task) => router.push(`/tasks/${task.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton="Delete Task"
          onDelete={() => router.push('/')}
        />
      </div>
    </>
  );
};

EditTask.getInitialProps = async ({ query }) => {
  try {
    if (!query.slug) {
      throw new Error('No task');
    }
    const {
      data: { results: task },
    } = await api.get(`/task/${query.slug}`);

    return { task };
  } catch (err) {
    return {
      error: err.message,
    };
  }
};

export default EditTask;
