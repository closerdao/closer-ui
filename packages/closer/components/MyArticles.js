import React, { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import api, { formatSearch } from '../utils/api';
import { __ } from '../utils/helpers';
import Link from './ActiveLink';

const MyArticles = () => {
  const [error, setErrors] = useState(false);
  const [articles, setArticles] = useState(null);
  const [others, setOthers] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          return;
        }
        const [
          {
            data: { results: articles },
          },
          {
            data: { results: others },
          },
        ] = await Promise.all([
          api.get('/article', {
            params: {
              where: formatSearch({ createdBy: user._id }),
            },
          }),
          api.get('/article', {
            params: {
              where: formatSearch({
                createdBy: { $ne: user._id },
              }),
            },
          }),
        ]);
        setArticles(articles);
        setOthers(others);
      } catch (err) {
        setErrors(err.message);
      }
    })();
  }, [user]);

  if (!user) {
    return null;
  }
  return (
    <div>
      <h1>Hi {user.screenname}</h1>

      <div className="user-actions">
        <Link as="/compose/new" href="/compose/[slug]">
          <a className="button">{__('my_articles_new_article')}</a>
        </Link>
      </div>

      {error && <div className="validation-error">{error}</div>}

      <section className="margin-top">
        <h2>{__('my_articles_title')}</h2>
        {articles ? (
          articles.map((article) => (
            <div key={article._id}>
              <h3>
                <Link as={`/${article.slug}`} href="/[slug]">
                  <a>{article.title}</a>
                </Link>{' '}
                &nbsp;
              </h3>
              <p>{article.summary}</p>
            </div>
          ))
        ) : (
          <div className="Loading">{__('generic_loading')}</div>
        )}
      </section>

      <section className="margin-top">
        <h2>{__('my_articles_other')}</h2>
        {others ? (
          others.map((article) => (
            <div key={article._id}>
              <h3>
                <Link as={`/${article.slug}`} href="/[slug]">
                  <a>{article.title}</a>
                </Link>
              </h3>
              <p>{article.summary}</p>
            </div>
          ))
        ) : (
          <div className="Loading">{__('generic_loading')}</div>
        )}
      </section>
    </div>
  );
};

export default MyArticles;
