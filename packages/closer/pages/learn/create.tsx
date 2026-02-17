import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import api from '../../utils/api';
import { getConfig, getConfigValueBySlug } from '../../utils/configCache';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  learningHubConfig: { enabled: boolean; value?: any } | null;
}

const CreateLessonPage = ({ learningHubConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const isLearningHubEnabled = learningHubConfig && learningHubConfig?.enabled;

  if (!isLearningHubEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{t('learn_create_lesson')}</title>
      </Head>
      <EditModelPageLayout
        title={t('learn_create_lesson')}
        subtitle={t('edit_model_create_intro')}
      >
        <EditModel
          endpoint={'/lesson'}
          fields={models.lesson}
          onSave={(lesson) => router.push(`/learn/${lesson.slug}`)}
        />
      </EditModelPageLayout>
    </>
  );
};

CreateLessonPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [configs, messages] = await Promise.all([
      getConfig(api),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const learningHubConfig = getConfigValueBySlug(configs, 'learningHub') || null;
    return {
      learningHubConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      learningHubConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default CreateLessonPage;
