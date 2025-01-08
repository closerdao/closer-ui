import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import LessonDescription from '../../../components/LessonDescription';
import LessonVideo from '../../../components/LessonVideo';
import Tag from '../../../components/Tag';
import { Card, ErrorMessage, LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import IconLocked from '../../../components/ui/IconLocked';
import IconPlay from '../../../components/ui/IconPlay';

import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import { Lesson } from '../../../types/lesson';
import { SubscriptionPlan } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { prepareSubscriptions } from '../../../utils/subscriptions.helpers';
import PageNotFound from '../../not-found';

const MIN_SUBSCRIPTION_PLAN = 'Wanderer';

interface Props {
  lesson: Lesson;
  error?: string;
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  learningHubConfig: { enabled: boolean; value?: any } | null;
}

const LessonPage = ({
  lesson,
  subscriptionsConfig,
  error,
  learningHubConfig,
}: Props) => {
  const t = useTranslations();
  const subscriptions = subscriptionsConfig
    ? prepareSubscriptions(subscriptionsConfig)
    : null;
  const { asPath } = useRouter();
  const { user, refetchUser } = useAuth();

  const isLearningHubEnabled = learningHubConfig && learningHubConfig?.enabled;
  const learnVariant = lesson?.variant;

  const [hasRefetchedUser, setHasRefetchedUser] = useState(false);

  const subscriptionPriceId = subscriptions?.find(
    (subscription: SubscriptionPlan) => {
      return (
        subscription.title === MIN_SUBSCRIPTION_PLAN && subscription.priceId
      );
    },
  )?.priceId;

  const getAccessUrl = () => {
    if (lesson?.access === 'single-payment') {
      return `/learn/checkout?lessonId=${lesson._id}&source=${encodeURIComponent(asPath)}`;
    }
    return `/subscriptions/checkout?priceId=${subscriptionPriceId}&source=${encodeURIComponent(asPath)}`;
  };

  const accessUrl = getAccessUrl();

  const canViewLessons = Boolean(
    (user && (user?.subscription?.plan || !lesson?.paid)) ||
      user?.roles.includes('admin'),
  );

  const [isVideoPreview, setIsVideoPreview] = useState(
    Boolean(lesson?.previewVideo),
  );
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    if (user && !hasRefetchedUser) {
      setTimeout(() => {
        refetchUser();
        setHasRefetchedUser(true);
      }, 1000);
    }
  }, [user]);

  const handleShowPreview = () => {
    setIsVideoPreview(true);
    setIsVideoLoading(true);
  };
  const handleShowFullVideo = () => {
    setIsVideoPreview(false);
    setIsVideoLoading(true);
  };

  if (!lesson) {
    return <PageNotFound error={error} />;
  }

  if (!isLearningHubEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{lesson.title}</title>
        <meta name="description" content={lesson.summary} />
        <meta property="og:type" content="lesson" />
      </Head>

      <div className="w-full flex items-center flex-col gap-4">
        <section className="w-full flex justify-center max-w-4xl flex-wrap">
          <Link
            href="/learn/category/all"
            className="hover:text-accent w-full my-4"
          >
            &lt; {t('learn_all_courses')}
          </Link>
          <div className="w-full relative">
            <LessonVideo
              videoUrl={
                isVideoPreview && lesson.previewVideo
                  ? lesson.previewVideo
                  : lesson.fullVideo
              }
              isUnlocked={canViewLessons || isVideoPreview}
              setIsVideoLoading={setIsVideoLoading}
              isVideoLoading={isVideoLoading}
              getAccessUrl={accessUrl}
            />

            {(user?._id === lesson.createdBy ||
              user?.roles.includes('admin')) && (
              <div className="absolute right-0 top-0 p-8 flex flex-col gap-4">
                <LinkButton
                  size="small"
                  href={lesson.slug && `/learn/${lesson.slug}/edit`}
                  className="bg-accent text-white rounded-full px-4 py-2 text-center uppercase text-sm"
                >
                  {t('learn_edit_lesson_hading')}
                </LinkButton>
              </div>
            )}
          </div>
        </section>

        <section className=" w-full flex justify-center">
          <div className="max-w-4xl w-full ">
            <div className="w-full py-2">
              <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex items-center text-sm uppercase font-bold gap-1">
                  <div>
                    {t('learn_lesson_category')}: {lesson.category}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className=" w-full flex justify-center min-h-[400px] ">
          <div className="max-w-4xl w-full">
            <div className="flex-col-reverse sm:flex-row static flex items-start justify-between gap-6 w-full">
              <div className="flex flex-col gap-10 w-full sm:w-2/3">
                <div>
                  learnVariant={learnVariant}
                  <Heading level={1} className="md:text-4xl mt-2 font-bold">
                    {lesson.title}
                  </Heading>
                </div>

                {error && <ErrorMessage error={error} />}

                <div>
                  {lesson.description && <LessonDescription lesson={lesson} />}
                </div>
              </div>
              <div className="h-auto static sm:sticky bottom-0 left-0  sm:top-[100px] w-full sm:w-[250px]">
                <Card className="bg-white border border-gray-100 gap-6">
                  <Heading level={2}>{t('learn_lessons_heading')}</Heading>
                  <div className="flex flex-col">
                    {lesson.previewVideo && (
                      <button
                        onClick={handleShowPreview}
                        disabled={isVideoPreview}
                        className={`flex gap-2 py-1 px-2 rounded-md ${
                          isVideoPreview
                            ? 'bg-accent-light font-bold'
                            : 'bg-transparent font-normal'
                        }`}
                      >
                        <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
                          <IconPlay />
                        </div>
                        {t('learn_introduction_heading')}
                      </button>
                    )}

                    {lesson.fullVideo && (
                      <button
                        onClick={handleShowFullVideo}
                        disabled={!isVideoPreview}
                        className={`flex gap-2 py-1 px-2 rounded-md ${
                          !isVideoPreview
                            ? 'bg-accent-light font-bold'
                            : 'bg-transparent font-normal'
                        }`}
                      >
                        {canViewLessons ? (
                          <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
                            <IconPlay />
                          </div>
                        ) : (
                          <div className=" flex justify-center items-center w-[21px] h-[21px]">
                            <IconLocked />
                          </div>
                        )}
                        {t('learn_full_lesson_heading')}
                      </button>
                    )}
                  </div>

                  {!canViewLessons && lesson.fullVideo && (
                    <LinkButton href={accessUrl}>
                      {t('learn_get_access_button')}
                    </LinkButton>
                  )}
                  <LinkButton href={accessUrl}>
                    {t('learn_get_access_button')}
                  </LinkButton>

                  <Heading className="uppercase text-md" level={3}>
                    {t('learn_tags_heading')}
                  </Heading>

                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag: string) => {
                      return <Tag key={tag}>{tag}</Tag>;
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

LessonPage.getInitialProps = async (context: NextPageContext) => {
  const { req, query } = context;
  try {
    const [subscriptionsConfigRes, lessonRes, learningHubRes, messages] =
      await Promise.all([
        api.get('/config/subscriptions').catch(() => {
          return null;
        }),
        api
          .get(`/lesson/${query.slug}`, {
            headers: (req as NextApiRequest)?.cookies?.access_token && {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            },
          })
          .catch(() => {
            return null;
          }),
        api.get('/config/learningHub').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);
    const learningHubConfig = learningHubRes?.data?.results?.value || null;

    return {
      subscriptionsConfig: subscriptionsConfigRes?.data?.results?.value || null,
      lesson: lessonRes?.data?.results || null,
      error: null,
      learningHubConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      learningHubConfig: null,
      error: parseMessageFromError(err),
      lesson: null,
      messages: null,
    };
  }
};

export default LessonPage;
