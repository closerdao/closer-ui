import Head from 'next/head';
import Link from 'next/link';

import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import api, { formatSearch } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  articles: any[];
  error?: string;
  keyword: string;
  tags: string[];
}

const Search = ({ articles, error, keyword, tags }: Props) => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{keyword}</title>
      </Head>
      <div className="main-content fullwidth intro">
        <section className="article limit-width">
          <Heading>{decodeURIComponent(keyword) || 'Search'}</Heading>
          {error ? (
            <div className="validation-error">{error}</div>
          ) : (
            <p className="mb-3">
              Found {articles.length} article
              {articles.length !== 1 && 's'} about <i>{keyword}</i>.
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {articles ? (
              articles.map((article) => (
                <div className="card" key={article._id}>
                  <Link
                    as={`/blog/${article.slug}`}
                    href="/blog/[slug]"
                    role="button"
                  >
                    <h3 className="title">{article.title}</h3>
                    {article.summary && (
                      <p className="summary">{article.summary}</p>
                    )}
                  </Link>
                </div>
              ))
            ) : (
              <div className="Loading">{t('generic_loading')}</div>
            )}
          </div>
        </section>
        <section className="mt-8">
          <Heading level={2}>{t('search_keyword_related')}</Heading>
          <p className="tags">
            {tags ? (
              tags.map((tag) => (
                <Link
                  as={`/blog/search/${encodeURIComponent(tag)}`}
                  href="/blog/search/[keyword]"
                  key={tag}
                  className="mr-4 mb-2 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-gray-200 rounded-full"
                >
                  {tag}
                </Link>
              ))
            ) : (
              <span className="Loading">{t('generic_loading')}</span>
            )}
          </p>
        </section>
      </div>
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
    const [tags, articles, messages] = await Promise.all([
      api.get(`/distinct/article/tags?where=${search}`),
      api.get(`/article?where=${search}&limit=50`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    return {
      keyword,
      tags: tags?.data?.results,
      articles: articles?.data?.results,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      messages: null,
    };
  }
};

export default Search;
