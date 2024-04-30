import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import models from '../../models';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

interface Props {
  learningHubConfig: { enabled: boolean; value?: any } | null;
}

const CreateLessonPage = ({ learningHubConfig }: Props) => {
  const router = useRouter();
  const isLearningHubEnabled = learningHubConfig && learningHubConfig?.enabled;

  if (!isLearningHubEnabled) {
    return <PageNotFound />;
  }

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

CreateLessonPage.getInitialProps = async () => {
  try {
    const learningHubRes = await api.get('/config/learningHub').catch(() => {
      return null;
    });

    const learningHubConfig = learningHubRes?.data?.results?.value || null;

    return {
      learningHubConfig,
    };
  } catch (err: unknown) {
    return {
      learningHubConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default CreateLessonPage;
