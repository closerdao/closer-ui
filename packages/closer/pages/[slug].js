import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import { useAuth } from '../contexts/auth.js';
import api, { cdn } from '../utils/api';
import PageNotFound from './404';

const Article = ({ article, error }) => {
  const { user, isAuthenticated } = useAuth();

  const fullImageUrl =
    article &&
    article.photo &&
    (!article.photo.startsWith('http')
      ? `${cdn}/${article.photo}-max-lg.jpg`
      : article.photo);

  const createdAt =
    article &&
    new Date(article.created).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (!article) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{article.title}</title>
        {article.summary && (
          <meta name="description" content={article.summary} />
        )}
        <meta property="og:title" content={article.title} />
        <meta property="og:type" content="article" />
        {article.summary && (
          <meta property="og:description" content={article.summary} />
        )}
        {fullImageUrl && (
          <meta key="og:image" property="og:image" content={fullImageUrl} />
        )}
        {fullImageUrl && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={fullImageUrl}
          />
        )}
      </Head>
      {article.photo ? (
        <section
          className={`main-content fullwidth hero ${
            article.photo ? 'hero-photo' : ''
          }`}
          style={{ backgroundImage: `url("${fullImageUrl}")` }}
        >
          <div className="background" />
          <div className="inner">
            <h2 className="category">
              <span>{article.category}</span>
            </h2>
            <h1>
              {article.title}
              {isAuthenticated && user._id === article.createdBy && (
                <Link
                  href={`/compose/${article.slug}`}
                  className="edit-article"
                >
                  (Edit)
                </Link>
              )}
            </h1>
          </div>
        </section>
      ) : (
        <section className="main-content intro article">
          <h2 className="category">
            <span>{article.category}</span>
          </h2>
          <h1>
            {article.title}
            {isAuthenticated && user._id === article.createdBy && (
              <Link href={`/compose/${article.slug}`} className="edit-article">
                (Edit)
              </Link>
            )}
          </h1>
        </section>
      )}
      <div className="main-content fullwidth">
        <div className="columns">
          <main className="col lg">
            <section
              className="article limit-width padding-right"
              dangerouslySetInnerHTML={{ __html: article.html }}
            />
          </main>
          <section className="col right-col">
            <h3>Posted</h3>
            <p>{createdAt}</p>
            <h3>Tags</h3>
            <p className="tags">
              {article.tags &&
                article.tags.length > 0 &&
                article.tags.map((tag) => (
                  <Link
                    key={tag}
                    as={`/search/${tag}`}
                    href="/search/[keyword]"
                    className="tag"
                  >
                    {tag}
                  </Link>
                ))}
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

Article.getInitialProps = async ({ req, query }) => {
  try {
    const slug = (req && req.url.slice(1)) || (query && query.slug);
    const res = await api.get(`/article/${slug}`);

    return {
      article: res.data?.results,
    };
  } catch (err) {
    return {
      error: err.message,
    };
  }
};

export default Article;
