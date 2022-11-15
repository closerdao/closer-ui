import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Layout from '../../components/Layout';

import api, { formatSearch } from '../../utils/api';
import { __ } from '../../utils/helpers';

const Search = ({ articles, error, keyword, tags }) =>
  console.log(error, articles) || (
    <Layout>
      <Head>
        <title>{keyword}</title>
      </Head>
      <div className="main-content fullwidth intro">
        <div className="columns">
          <main className="col lg">
            <section className="article limit-width">
              <h1>{decodeURIComponent(keyword) || 'Search'}</h1>
              {error ? (
                <div className="validation-error">{error}</div>
              ) : (
                <p>
                  Found {articles.length} article
                  {articles.length !== 1 && 's'} about <i>{keyword}</i>.
                </p>
              )}
              <div className="article-previews two-col">
                {articles ? (
                  articles.map((article) => (
                    <div className="article-preview" key={article._id}>
                      <Link as={`/${article.slug}`} href="/[slug]">
                        <a role="button">
                          <span className="title">{article.title}</span>
                          {article.summary && (
                            <span className="summary">{article.summary}</span>
                          )}
                        </a>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="Loading">{__('generic_loading')}</div>
                )}
              </div>
            </section>
          </main>
          <section className="col">
            <h2>{__('search_keyword_related')}</h2>
            <p className="tags">
              {tags ? (
                tags.map((tag) => (
                  <Link
                    as={`/search/${encodeURIComponent(tag)}`}
                    href="/search/[keyword]"
                    key={tag}
                  >
                    <a className="tag">{tag}</a>
                  </Link>
                ))
              ) : (
                <span className="Loading">{__('generic_loading')}</span>
              )}
            </p>
            <h3>
              <Link href="/search">
                <a>{__('search_keyword_articles')}</a>
              </Link>
            </h3>
          </section>
        </div>
      </div>
    </Layout>
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
