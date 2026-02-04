import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  lesson: any;
  error?: string;
  learningHubConfig: { enabled: boolean; value?: any } | null;
}

const EditLessonPage = ({ lesson, error, learningHubConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const onUpdate = async (
    name: string,
    value: any,
    option?: any,
    actionType?: string,
  ) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option?._id) {
      await api.post(`/moderator/lesson/${lesson._id}/add`, option);
    }
  };

  const isLearningHubEnabled = learningHubConfig && learningHubConfig?.enabled;

  if (!isLearningHubEnabled) {
    return <PageNotFound />;
  }

  if (!lesson) {
    return <Heading>{t('events_slug_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>{`${t('learn_edit_heading')} ${lesson.name}`}</title>
      </Head>
      <EditModelPageLayout
        title={`${t('learn_edit_heading')} ${lesson.title}`}
        backHref={`/learn/${lesson.slug}`}
        isEdit
      >
        {error && <div className="error-box mb-4">{error}</div>}
        {!process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY && (
          <div className="my-4 error-box italic">
            {t('events_no_stripe_integration')}
          </div>
        )}
        <EditModel
          id={lesson._id}
          endpoint="/lesson"
          fields={models.lesson}
          initialData={lesson}
          onSave={(lesson) => router.push(`/learn/${lesson.slug}`)}
          onUpdate={onUpdate}
          allowDelete
          deleteButton="Delete Course"
          onDelete={() => router.push('/')}
        />
      </EditModelPageLayout>
    </>
  );
};

EditLessonPage.getInitialProps = async (context: NextPageContext) => {
  const { req, query } = context;
  try {
    if (!query.slug) {
      throw new Error('No event');
    }

    const [
      {
        data: { results: lesson },
      },
      learningHubRes,
      messages,
    ] = await Promise.all([
      api.get(`/lesson/${query.slug}`, {
        headers: (req as NextApiRequest)?.cookies?.access_token && {
          Authorization: `Bearer ${
            (req as NextApiRequest)?.cookies?.access_token
          }`,
        },
      }),
      api.get('/config/learningHub').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const learningHubConfig = learningHubRes?.data?.results?.value || null;

    return { lesson, learningHubConfig, messages };
  } catch (err) {
    console.log(err);
    return {
      learningHubConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default EditLessonPage;
