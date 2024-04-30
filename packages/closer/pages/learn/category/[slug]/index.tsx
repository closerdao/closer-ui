import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import LearnCategoriesNav from '../../../../components/LearnCategoriesNav';
import LessonsList from '../../../../components/LessonsList';
import Pagination from '../../../../components/Pagination';
import { ErrorMessage, Spinner } from '../../../../components/ui';
import Heading from '../../../../components/ui/Heading';

import PageNotFound from '../../../404';
import { useAuth } from '../../../../contexts/auth';
import { usePlatform } from '../../../../contexts/platform';
import { useConfig } from '../../../../hooks/useConfig';
import { GeneralConfig } from '../../../../types';
import { Lesson } from '../../../../types/lesson';
import api from '../../../../utils/api';
import { parseMessageFromError } from '../../../../utils/common';
import { __ } from '../../../../utils/helpers';
import { capitalizeFirstLetter } from '../../../../utils/learn.helpers';

const LESSONS_PER_PAGE = 10;

interface Props {
  generalConfig: GeneralConfig | null;
  learningHubConfig: { enabled: boolean; value?: any } | null;
}

const LearnCategoryPage = ({ generalConfig, learningHubConfig }: Props) => {
  const router = useRouter();
  const category = router.query.slug;

  const isLearningHubEnabled = learningHubConfig && learningHubConfig?.enabled;

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const filter = {
    where: getCategoryWhere(),
    limit: LESSONS_PER_PAGE,
    sort_by: '-created',
    page,
  };

  const lessons = platform.lesson.find(filter);
  const totalLessons = platform.lesson.findCount(filter);
  const allLessons = platform.lesson.find();

  const categories = lessons &&
    allLessons && [
      ...new Set(
        allLessons.toJS().map((lesson: Lesson) => {
          return lesson.category;
        }),
      ),
    ];

  function getCategoryWhere() {
    if (category === 'all') {
      return {};
    }
    return {
      category: category,
    };
  }

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.lesson.get(),
        platform.lesson.get(filter),
        platform.lesson.getCount(filter),
      ]);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, category]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  if (!isLearningHubEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`${__('learn_heading')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="main-content w-full max-w-6xl">
        <header className="lg:flex lg:justify-between mb-14">
          <div>
            <Heading
              level={1}
              className="mt-10 mb-2 uppercase text-5xl font-extrabold"
            >
              {__('learn_heading')}
            </Heading>
            <p className="max-w-4xl">{__('learn_subheading')}</p>
          </div>

          <div className="action">
            {user && user.roles.includes('admin') && (
              <Link
                href="/learn/create"
                className="mt-10 btn-primary inline-block"
              >
                {__('learn_create_lesson_hading')}
              </Link>
            )}
          </div>
        </header>

        <div className="w-full flex-col sm:flex-row flex gap-4">
          <nav className="w-full sm:w-1/5 flex flex-col gap-4">
            <Heading level={2} className="mb-4 text-xl">
              {__('learn_categories_heading')}
            </Heading>

            <LearnCategoriesNav
              categories={categories}
              currentCategory={category as string}
            />
          </nav>

          <section className="w-full sm:w-4/5 flex flex-col gap-8">
            <Heading level={2} className="text-xl">
              {capitalizeFirstLetter(category as string)} {__('learn_courses')}
            </Heading>

            {error && <ErrorMessage error={error} />}
            {isLoading && <Spinner />}
            {lessons && lessons.size === 0 && (
              <Heading level={1}>{__('generic_coming_soon')}</Heading>
            )}

            <LessonsList lessons={lessons} />

            {lessons && totalLessons > LESSONS_PER_PAGE && (
              <Pagination
                loadPage={(page: number) => {
                  setPage(page);
                }}
                page={page}
                limit={LESSONS_PER_PAGE}
                total={totalLessons}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
};

LearnCategoryPage.getInitialProps = async () => {
  try {
    const [generalRes, learningHubRes] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/learningHub').catch(() => {
        return null;
      }),
    ]);
    const generalConfig = generalRes?.data?.results?.value || null;
    const learningHubConfig = learningHubRes?.data?.results?.value || null;

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
