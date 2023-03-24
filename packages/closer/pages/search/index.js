import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const Search = ({ tags, error, articles }) => {
  const { PLATFORM_NAME } = useConfig();
  return (
    <>
      <Head>
        <title>
          {__('generic_search')} {PLATFORM_NAME}
        </title>
      </Head>
      <div className="main-content fullwidth intro">
        <div className="columns">
          <main className="col lg">
            <section className="article limit-width">
              <h1 className="long">{__('generic_search')}</h1>
              <div className="article-previews two-col">
                {error ? (
                  <div className="validation-error">{error}</div>
                ) : articles ? (
                  articles.map((article) => {
                    return (
                      <div className="article-preview" key={article._id}>
                        <Link
                          as={`/${article.slug}`}
                          href="/[slug]"
                          role="button"
                        >
                          <span className="title">{article.title}</span>
                          {article.summary && (
                            <span className="summary">{article.summary}</span>
                          )}
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className="Loading">{__('generic_loading')}</div>
                )}
              </div>
            </section>
          </main>
          <section className="col">
            <h2>{__('search_related_content')}</h2>
            <p className="tags">
              {tags
                ? tags.map((tag) => (
                    <Link
                      as={`/search/${encodeURIComponent(tag)}`}
                      href="/search/[keyword]"
                      key={tag}
                      className="tag"
                    >
                      {tag}
                    </Link>
                  ))
                : !error && (
                    <span className="Loading">{__('generic_loading')}</span>
                  )}
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

Search.getInitialProps = async () => {
  try {
    const [tags, articles] = await Promise.all([
      api.get('/distinct/article/tags'),
      api.get('/article?limit=100'),
    ]);

    return {
      tags: tags.data?.results,
      articles: articles.data?.results,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

export default Search;
