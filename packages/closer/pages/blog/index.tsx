import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import ArticleList from '../../components/ArticleList';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { User } from 'closer/contexts/auth/types';
import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { BLOG_POSTS_PER_PAGE, HOME_PAGE_CATEGORY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import { Article } from '../../types/blog';
import api, { cdn, formatSearch } from '../../utils/api';
import { estimateReadingTime, getFirstSentence } from '../../utils/blog.utils';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

interface BlogConfig {
  enabled: boolean;
}

interface Props {
  articles: Article[];
  numArticles: number;
  authors: User[];
  generalConfig: GeneralConfig;
  blogConfig: BlogConfig | null;
  page?: number;
  error?: string;
}

const Search = ({
  articles,
  page,
  numArticles,
  authors,
  generalConfig,
  blogConfig,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isContentCreator = user?.roles.includes('content-creator');

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const articlesWithAuthorInfo = articles.map((article) => {
    const author = authors.find((author) => author._id === article.createdBy);

    if (!author) {
      return {
        ...article,
        authorInfo: {
          screenname: '',
          photo: '',
          _id: '',
        },
      };
    }

    return {
      ...article,
      authorInfo: {
        screenname: author?.screenname,
        photo: author?.photo,
        _id: author?._id,
      },
    };
  });

  const latestArticle =
    Number(page) === 1 || !page ? articlesWithAuthorInfo[0] : null;

  const latestArticleImageUrl =
    (Number(page) === 1 || !page) &&
    latestArticle?.photo &&
    !latestArticle?.photo.startsWith('http')
      ? `${cdn}${latestArticle?.photo}-max-lg.jpg`
      : latestArticle?.photo;

  const loadPage = (pageNumber: number) => {
    router.push(`/blog?page=${pageNumber}`);
  };

  const isBlogEnabled = blogConfig?.enabled !== false;

  if (!isBlogEnabled) {
    return <FeatureNotEnabled feature="blog" />;
  }

  return (
    <>
      <Head>
        <title>{`${PLATFORM_NAME} ${t('blog_title')} - ${PLATFORM_NAME}`}</title>
        <meta
          name="description"
          content={`Read articles and stories from ${PLATFORM_NAME}. Community insights, regenerative living, and updates from our network.`}
        />
        <meta name="keywords" content={`${PLATFORM_NAME}, blog, articles, regenerative communities, community stories, ecovillage, intentional community`} />
        <meta property="og:title" content={`${PLATFORM_NAME} ${t('blog_title')}`} />
        <meta property="og:description" content={`Read articles and stories from ${PLATFORM_NAME}. Community insights, regenerative living, and updates from our network.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/blog`} />
        {latestArticleImageUrl && (
          <meta property="og:image" content={latestArticleImageUrl} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${PLATFORM_NAME} ${t('blog_title')}`} />
        <meta name="twitter:description" content={`Read articles and stories from ${PLATFORM_NAME}. Community insights, regenerative living, and updates from our network.`} />
        {latestArticleImageUrl && (
          <meta name="twitter:image" content={latestArticleImageUrl} />
        )}
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/blog`} />
      </Head>
      <main className="w-full flex flex-col items-center px-4 md:px-8">
        <section className="w-full max-w-5xl pt-12 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {t('blog_page_title')}
              </h1>
              <p className="text-gray-600 max-w-xl">
                {t('blog_page_description')}
              </p>
            </div>
            {(isAdmin || isContentCreator) && (
              <Link
                href="/blog/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('blog_write_article')}
              </Link>
            )}
          </div>
        </section>

        {(Number(page) === 1 || !page) && latestArticle && (
          <section className="w-full max-w-5xl mb-8">
            <Link href={`/blog/${latestArticle?.slug}`} className="group block">
              <article className="flex flex-col sm:flex-row gap-6 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="w-full sm:w-48 md:w-56 flex-shrink-0 aspect-[16/10] sm:aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {latestArticleImageUrl ? (
                    <Image
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      src={latestArticleImageUrl || ''}
                      alt={latestArticle?.title || ''}
                      width={224}
                      height={224}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex flex-col justify-center py-1">
                  <span className="text-xs font-medium text-accent uppercase tracking-wider mb-2">
                    {t('blog_featured')}
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-accent transition-colors mb-2">
                    {latestArticle?.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {latestArticle?.summary
                      ? latestArticle.summary
                      : getFirstSentence(latestArticle?.html)}
                  </p>
                  <div className="flex items-center gap-2">
                    {latestArticle?.authorInfo?.photo ? (
                      <Image
                        className="rounded-full"
                        src={`${cdn}${latestArticle.authorInfo.photo}-profile-sm.jpg`}
                        alt={latestArticle?.authorInfo?.screenname || ''}
                        width={28}
                        height={28}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="text-gray-400 w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{latestArticle?.authorInfo?.screenname}</span>
                      <span className="mx-1">·</span>
                      {dayjs(latestArticle?.updated).format('MMM D, YYYY')}
                      <span className="mx-1">·</span>
                      {estimateReadingTime(latestArticle?.html)} {t('blog_min_read')}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </section>
        )}

        <section className="w-full max-w-5xl py-12 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-8">
            {t('blog_latest_articles')}
          </h2>
          <ArticleList
            articlesWithAuthorInfo={articlesWithAuthorInfo}
            page={Number(page) || 1}
            numArticles={numArticles}
            loadPage={loadPage}
          />
        </section>
      </main>
    </>
  );
};

Search.getInitialProps = async (context: NextPageContext) => {
  const page = context.query.page;
  const search = formatSearch({ category: { $ne: HOME_PAGE_CATEGORY } });

  try {
    const [articles, numArticles, generalRes, blogRes, messages] = await Promise.all([
      api
        .get(
          `/article?limit=${
            Number(page) === 1 || !page
              ? BLOG_POSTS_PER_PAGE + 1
              : BLOG_POSTS_PER_PAGE
          }&sort_by=-created&where=${search}&page=${page}`,
        )
        .catch(() => {
          return null;
        }),
      api.get('/count/article').catch(() => {
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/blog').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const authorIds = articles?.data?.results.map(
      (article: Article) => article.createdBy,
    );

    const authorsRes = await api.get(
      `/user?where=${formatSearch({ _id: { $in: authorIds } })}`,
    );

    const authors = authorsRes.data?.results;
    const generalConfig = generalRes?.data?.results?.value;
    const blogConfig = blogRes?.data?.results?.value;

    return {
      articles: articles?.data?.results,
      numArticles: numArticles?.data?.results,
      authors,
      generalConfig,
      blogConfig,
      page,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      blogConfig: null,
      messages: null,
      authors: [],
      articles: [],
      page: null,
    };
  }
};

export default Search;
