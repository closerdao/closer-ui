import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import LearnCategoriesNav from '../../../../components/LearnCategoriesNav';
import LessonsList from '../../../../components/LessonsList';
import Pagination from '../../../../components/Pagination';
import { Spinner } from '../../../../components/ui';
import Heading from '../../../../components/ui/Heading';

import { Record } from 'immutable';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../../configCached';
import { usePlatform } from '../../../../contexts/platform';
import { useConfig } from '../../../../hooks/useConfig';
import useRBAC from '../../../../hooks/useRBAC';
import { GeneralConfig } from '../../../../types';
import { Lesson } from '../../../../types/lesson';
import { parseMessageFromError } from '../../../../utils/common';
import { capitalizeFirstLetter } from '../../../../utils/learn.helpers';
import { LessonFilter, useLessons } from '../../../../utils/lessons';
import PageNotFound from '../../../not-found';

const LESSONS_PER_PAGE = 10;

interface Props {
  generalConfig: GeneralConfig | null;
  learningHubConfig: { enabled: boolean; value?: any } | null;
}

const LearnCategoryPage = ({ generalConfig, learningHubConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const category = router.query.slug;

  const isLearningHubEnabled = learningHubConfig && learningHubConfig?.enabled;

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { platform }: any = usePlatform();

  const [page, setPage] = useState(1);

  const { hasAccess } = useRBAC();
  const canCreateLesson = hasAccess('LearningHubCreate');

  const filter: LessonFilter = {
    where: category === 'all' ? {} : { category },
    limit: LESSONS_PER_PAGE,
    sort_by: '-created',
    page,
  };

  const { lessons, allLessons, totalLessons, isLoading } = useLessons(
    platform,
    filter,
  );

  const publicLessons = lessons?.filter(
    (lesson: Record<Lesson>) => !lesson.get('isDraft'),
  );

  const totalPublicLessons = publicLessons?.size;

  const allPublicLessons = allLessons?.filter(
    (lesson: Record<Lesson>) => !lesson.get('isDraft'),
  );

  const categories = lessons &&
    allLessons && [
      ...new Set(
        allLessons.toJS().map((lesson: Lesson) => {
          return lesson.category;
        }),
      ),
    ];

  const publicCategories = allPublicLessons &&
    allLessons && [
      ...new Set(
        allPublicLessons.toJS().map((lesson: Lesson) => {
          return lesson.category;
        }),
      ),
    ];

  useEffect(() => {
    setPage(1);
  }, [category]);

  if (!isLearningHubEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`${t('learn_heading')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="main-content w-full max-w-6xl">
        <header className="lg:flex lg:justify-between mb-14">
          <div>
            <Heading
              level={1}
              className="mt-10 mb-2 uppercase text-5xl font-extrabold"
            >
              {t('learn_heading')}
            </Heading>
            <p className="max-w-4xl">{t('learn_subheading')}</p>
          </div>

          <div className="action">
            {canCreateLesson && (
              <Link
                href="/learn/create"
                className="mt-10 btn-primary inline-block"
              >
                {t('learn_create_lesson_hading')}
              </Link>
            )}
          </div>
        </header>

        <div className="w-full flex-col sm:flex-row flex gap-4">
          <nav className="w-full sm:w-1/5 flex flex-col gap-4">
            <Heading level={2} className="mb-4 text-xl">
              {t('learn_categories_heading')}
            </Heading>

            <LearnCategoriesNav
              categories={canCreateLesson ? categories : publicCategories}
              currentCategory={category as string}
            />
          </nav>

          <section className="w-full sm:w-4/5 flex flex-col gap-8">
            <Heading level={2} className="text-xl">
              {capitalizeFirstLetter(category as string)} {t('learn_courses')}
            </Heading>

            {isLoading && <Spinner />}
            {lessons && lessons.size === 0 && (
              <Heading level={1}>{t('generic_coming_soon')}</Heading>
            )}

            <LessonsList lessons={canCreateLesson ? lessons : publicLessons} />

            {lessons && (totalLessons ?? 0) > LESSONS_PER_PAGE && (
              <Pagination
                loadPage={(page: number) => {
                  setPage(page);
                }}
                page={page}
                limit={LESSONS_PER_PAGE}
                total={canCreateLesson ? totalLessons : totalPublicLessons}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
};

LearnCategoryPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const generalConfig = config.general || null;
    const learningHubConfig = config.learningHub || null;

    return {
      generalConfig,
      learningHubConfig,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      learningHubConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default LearnCategoryPage;
