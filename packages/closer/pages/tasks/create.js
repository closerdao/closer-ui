import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../components/EditModel';

import models from '../../models';
import { __ } from '../../utils/helpers';

const CreateTask = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{__('tasks_create_title')}</title>
      </Head>
      <div className="main-content intro">
        <EditModel
          endpoint={'/task'}
          fields={models.task}
          buttonText="Create Task"
          onSave={(event) => router.push(`/tasks/${event.slug}`)}
        />
      </div>
    </>
  );
};

export default CreateTask;
