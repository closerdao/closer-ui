import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { FC } from 'react';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import models from '../../models';
import { __ } from '../../utils/helpers';

const CreateLessonPage: FC = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{__('learn_create_lesson')}</title>
      </Head>
      <div className="main-content intro">
        <Heading level={2} className="mb-2">
          {__('learn_create_lesson')}
        </Heading>
        <EditModel
          endpoint={'/lesson'}
          fields={models.lesson}
          onSave={(lesson) => router.push(`/learn/${lesson.slug}`)}
        />
      </div>
    </>
  );
};

export default CreateLessonPage;
