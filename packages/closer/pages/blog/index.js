import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Heading from '../../components/ui/Heading';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const Search = ({ error, articles }) => {
  const { PLATFORM_NAME } = useConfig();
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Head>
        <title>{`${__('generic_search')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="main-content w-full max-w-6xl">
        <Heading className="mb-4">{PLATFORM_NAME} Blog</Heading>
        {isAuthenticated && (
          <div className="mb-4">
            <Link href="/blog/create" className="btn-primary">
              Write Article
            </Link>
          </div>
        )}
        <section className="grid md:grid-cols-2 gap-8">
          {error ? (
            <div className="validation-error">{error}</div>
          ) : articles ? (
            articles.map((article) => {
              return (
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
              );
            })
          ) : (
            <div className="Loading">{__('generic_loading')}</div>
          )}
        </section>
      </main>
    </>
  );
};

Search.getInitialProps = async () => {
  try {
    const [tags, articles] = await Promise.all([
      api.get('/distinct/article/tags?limit=20'),
      api.get('/article?limit=100&sort_by=-created'),
    ]);

    return {
      tags: tags.data?.results.slice(0, 30),
      articles: articles.data?.results,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

export default Search;
