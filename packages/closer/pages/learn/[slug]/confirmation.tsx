import { useRouter } from 'next/router';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { PRODUCT_SALE_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { Lesson } from '../../../types/lesson';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  error?: string;
  lesson: Lesson | null;
}

const LearnConfirmation = ({ error, lesson }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const { isAuthenticated } = useAuth();

  const goBack = () => {
    router.push(`/learn/${slug}`);
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="pb-4 mt-8">
          <span>{t('learn_confirmation_title')}</span>
        </Heading>
        <ProgressBar steps={PRODUCT_SALE_STEPS} />

        <div className="mt-16 flex flex-col gap-6">

          <p>{t('learn_confirmation_message')}</p>
          <p>{t('learn_confirmation_message_2')}</p>
        </div>
      </div>
    </>
  );
};

LearnConfirmation.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;

  try {
    const [lessonRes, messages] = await Promise.all([
      api.get(`/lesson/${query.slug}`).catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const lesson = lessonRes?.data?.results;
    return {
      error: null,
      messages,
      lesson,
    };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      lesson: null,
      messages: null,
    };
  }
};

export default LearnConfirmation;
