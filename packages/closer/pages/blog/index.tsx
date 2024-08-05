import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import ArticleList from '../../components/ArticleList';
import { LinkButton } from '../../components/ui';
import Heading from '../../components/ui/Heading';

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

interface Props {
  articles: Article[];
  numArticles: number;
  authors: User[];
  generalConfig: GeneralConfig;
  page?: number;
  error?: string;
}

const Search = ({
  articles,
  page,
  numArticles,
  authors,
  generalConfig,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isModerator = user?.roles.includes('moderator');

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

  return (
    <>
      <Head>
        <title>{`${t('generic_search')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="w-full flex flex-col items-center">
        <section className="flex justify-center  mb-6 max-w-[700px]">
          <Heading level={1} className="text-lg">
            {PLATFORM_NAME} {t('blog_title')}
          </Heading>
        </section>

        {(Number(page) === 1 || !page) && (
          <section className="flex items-center max-w-[700px] flex-col gap-[50px] mb-20">
            {latestArticleImageUrl ? (
              <div className="h-[280px] sm:h-[400px] md:h-[450px] w-full">
                <Image
                  className="object-cover h-full w-full "
                  src={latestArticleImageUrl || ''}
                  alt={latestArticle?.title || ''}
                  width={400}
                  height={300}
                />
              </div>
            ) : (
              <div className="h-4"></div>
            )}

            <div className="max-w-[700px] items-center text-center text-sm font-bold flex flex-col gap-8">
              <Heading className="text-center text-4xl" level={2}>
                <Link
                  className=" no-underline hover:text-accent"
                  href={`/blog/${latestArticle?.slug}`}
                >
                  {latestArticle?.title}
                </Link>
              </Heading>

              <div className="max-w-[500px] flex flex-col gap-10 uppercase">
                {latestArticle?.summary
                  ? latestArticle.summary
                  : getFirstSentence(latestArticle?.html)}

                <div className="flex-col sm:flex-row flex gap-y-6 gap-4 justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <Link
                      href={
                        latestArticle?.authorInfo?._id
                          ? `/members/${latestArticle?.authorInfo?._id}`
                          : '#'
                      }
                    >
                      {latestArticle?.authorInfo?.photo ? (
                        <Image
                          className="rounded-full"
                          src={`${cdn}${latestArticle.authorInfo.photo}-profile-sm.jpg`}
                          alt={latestArticle?.authorInfo?.screenname || ''}
                          width={50}
                          height={50}
                        />
                      ) : (
                        <div className="rounded-full overflow-hidden">
                          <FaUser className="text-neutral w-[50px] h-[50px] " />
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-col text-left">
                      <p>
                        <Link
                          className="text-accent font-normal text-lg no-underline normal-case"
                          href={
                            latestArticle?.authorInfo?._id
                              ? `/members/${latestArticle?.authorInfo?._id}`
                              : '#'
                          }
                        >
                          {latestArticle?.authorInfo?.screenname}
                        </Link>
                      </p>
                      <p className="font-normal normal-case">
                        {dayjs(latestArticle?.updated).format('MMMM DD, YYYY')}{' '}
                        &middot; {estimateReadingTime(latestArticle?.html)}{' '}
                        {t('blog_min_read')}
                      </p>
                    </div>
                  </div>
                  <LinkButton
                    isFullWidth={false}
                    href={`/blog/${latestArticle?.slug}`}
                    className="font-normal px-10 max-h-[30px]"
                  >
                    {t('blog_read_more')}
                  </LinkButton>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="pl-8 pr-4 flex flex-col items-center gap-10 bg-complimentary-light -ml-4 w-[calc(100vw+16px)] pb-12">
          <div className="flex flex-col gap-8 items-center pt-20">
            {(isAdmin || isModerator) && (
              <div className="mb-4">
                <LinkButton
                  size="small"
                  href="/blog/create"
                  className="bg-white text-black border-0 w-[200px]"
                >
                  {t('blog_write_article')}
                </LinkButton>
              </div>
            )}
            <Heading level={3} className="text-white text-3xl">
              {t('blog_latest_articles')}
            </Heading>
          </div>
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
    const [articles, numArticles, generalRes, messages] = await Promise.all([
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

    return {
      articles: articles?.data?.results,
      numArticles: numArticles?.data?.results,
      authors,
      generalConfig,
      page,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      messages: null,
      authors: [],
      articles: [],
      page: null,
    };
  }
};

export default Search;
