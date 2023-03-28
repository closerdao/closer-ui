import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import api, { formatSearch } from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Search = ({ articles, error, keyword, tags }) => (
  <>
    <Head>
      <title>{keyword}</title>
    </Head>
    <div className="main-content fullwidth intro">
      <section className="article limit-width">
        <h1>{decodeURIComponent(keyword) || 'Search'}</h1>
        {error ? (
          <div className="validation-error">{error}</div>
        ) : (
          <p className="mb-3">
            Found {articles.length} article
            {articles.length !== 1 && 's'} about <i>{keyword}</i>.
          </p>
        )}
        <div className="grid md:grid-cols-2">
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
            <div className="Loading">{__('generic_loading')}</div>
          )}
        </div>
      </section>
      <section className="mt-8">
        <h2>{__('search_keyword_related')}</h2>
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
            <span className="Loading">{__('generic_loading')}</span>
          )}
        </p>
      </section>
    </div>
  </>
);

Search.getInitialProps = async ({ req, query }) => {
  try {
    const rawKeyword =
      (req && req.url.replace('/search/', '')) || (query && query.keyword);
    const keyword =
      typeof decodeURIComponent !== 'undefined'
        ? decodeURIComponent(rawKeyword)
        : rawKeyword;
    const search = formatSearch({ tags: { $elemMatch: { $eq: keyword } } });
    const [tags, articles] = await Promise.all([
      api.get(`/distinct/article/tags?where=${search}`),
      api.get(`/article?where=${search}&limit=50`),
    ]);

    return {
      keyword,
      tags: tags?.data?.results,
      articles: articles?.data?.results,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

export default Search;
