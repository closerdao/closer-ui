import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { DEFAULT_BLOG_IMAGE_ID } from '../../../constants';
import { Article, Author } from '../../../types/blog';
import api, { cdn, formatSearch } from '../../../utils/api';
import { estimateReadingTime, getCleanString } from '../../../utils/blog.utils';
import { parseMessageFromError } from '../../../utils/common';
import { capitalizeFirstLetter } from '../../../utils/learn.helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface BlogConfig {
  enabled: boolean;
}

interface Props {
  articles: any[];
  error?: string;
  keyword: string;
  tags: string[];
  authors: Author[];
  blogConfig: BlogConfig | null;
}

const Search = ({ articles, keyword, tags, authors, blogConfig }: Props) => {
  const t = useTranslations();

  const isBlogEnabled = blogConfig?.enabled !== false;

  if (!isBlogEnabled) {
    return <FeatureNotEnabled feature="blog" />;
  }

  const articlesWithAuthorInfo = articles.map((article) => {
    const author = authors.find((author) => author._id === article.createdBy);
    return {
      ...article,
      authorInfo: {
        screenname: author?.screenname,
        photo: author?.photo,
        _id: author?._id,
      },
    };
  });

  return (
    <>
      <Head>
        <title>{keyword}</title>
      </Head>
      <main className="w-full flex flex-col items-center px-4 md:px-8">
        <section className="w-full max-w-5xl pt-8 pb-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <span>←</span>
            <span>{t('blog_title')}</span>
          </Link>
        </section>

        <section className="w-full max-w-5xl pb-12">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {capitalizeFirstLetter(decodeURIComponent(keyword)) || 'Search'}
            </h1>
            <p className="text-gray-600">
              {t('blog_found')} {articles.length} {t('blog_article')}
              {articles.length !== 1 && 's'} {t('blog_about')}{' '}
              <span className="font-medium">{keyword}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articlesWithAuthorInfo.map((article) => {
              const imageUrl =
                article.photo && !article.photo.startsWith('http')
                  ? `${cdn}${article?.photo}-post-md.jpg`
                  : article.photo;
              return (
                <article key={article.slug} className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="block"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <Image
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          src={imageUrl || ''}
                          alt={article?.title}
                          width={400}
                          height={250}
                        />
                      ) : (
                        <Image
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          src={`${cdn}${DEFAULT_BLOG_IMAGE_ID}-max-lg.jpg`}
                          alt={article?.title}
                          width={400}
                          height={250}
                        />
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-col flex-1 p-5">
                    <Link
                      href={`/blog/${article.slug}`}
                      className="block mb-3"
                    >
                      <h3 className="font-semibold text-gray-900 group-hover:text-accent transition-colors line-clamp-2">
                        {article?.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                      {getCleanString(article?.html).substring(0, 120)}...
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <Link
                        href={
                          article?.authorInfo?._id
                            ? `/members/${article?.authorInfo?._id}`
                            : '#'
                        }
                      >
                        {article?.authorInfo?.photo ? (
                          <Image
                            className="rounded-full"
                            src={`${cdn}${article.authorInfo.photo}-profile-sm.jpg`}
                            alt={article?.authorInfo?.screenname || ''}
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <FaUser className="text-gray-400 w-4 h-4" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 text-xs text-gray-500">
                        <p className="font-medium text-gray-700">
                          {article?.authorInfo?.screenname}
                        </p>
                        <p>
                          {dayjs(article?.updated).format('MMM D, YYYY')} · {estimateReadingTime(article?.html)} {t('blog_min_read')}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="w-full max-w-5xl py-12 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('search_keyword_related')}</h2>
          <div className="flex gap-2 items-center flex-wrap">
            {tags ? (
              tags.map((tag) => (
                <Link
                  key={tag}
                  as={`/blog/search/${tag}`}
                  href="/blog/search/[keyword]"
                  className="rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm text-gray-700 no-underline transition-colors"
                >
                  {tag}
                </Link>
              ))
            ) : (
              <span className="text-gray-500">{t('generic_loading')}</span>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

Search.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query, req } = context;
    const rawKeyword =
      (req && req.url && req.url.replace('/blog/search/', '')) ||
      (query && query.keyword);
    const keyword =
      typeof decodeURIComponent !== 'undefined'
        ? decodeURIComponent(rawKeyword as string)
        : rawKeyword;
    const search = formatSearch({ tags: { $elemMatch: { $eq: keyword } } });
    const [tags, articles, blogRes, messages] = await Promise.all([
      api.get(`/distinct/article/tags?where=${search}`),
      api.get(`/article?where=${search}&limit=50`),
      api.get('/config/blog').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const authorIds = articles?.data?.results.map(
      (article: Article) => article.createdBy,
    );

    const authorsRes = await api.get(
      `/user?where=${formatSearch({ _id: { $in: authorIds } })}`,
    );

    const authors = authorsRes.data?.results;
    const blogConfig = blogRes?.data?.results?.value;

    return {
      keyword,
      tags: tags?.data?.results,
      articles: articles?.data?.results,
      authors,
      blogConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      blogConfig: null,
      messages: null,
    };
  }
};

export default Search;
