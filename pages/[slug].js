import React, { useState, useEffect } from 'react';
import moment from 'moment'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router';
import Layout from '../components/layout'
import PageNotFound from './404'
import api, { formatSearch } from '../utils/api'

const Article = ({ article, author, error, signedIn }) => {
  if (
    !article ||
    (error && error.message.match(/status code 404/gi))
  ) {
    console.log('error', error, article)
    return <PageNotFound />
  }

  return (
    <Layout>
      <Head>
        <title>{article.title}</title>
        { article.summary && <meta name="description" content={article.summary} />}
        <meta property="og:title" content={article.title} />
        <meta property="og:type" content="article" />
        { article.summary && <meta property="og:description" content={article.summary} />}
        { article.photo && <meta property="og:image" content={article.photo} />}
      </Head>
      <main>
        { article.photo ?
          <section className="main-content fullwidth hero">
            <div className="background" />
            <h1>
              {article.title}
              { signedIn && <Link href={`/compose/${article.slug}`}><a className="edit-article">(Edit)</a></Link> }
            </h1>
          </section>:
          <section className="main-content intro article">
            <h1>
              {article.title}
              { signedIn && <Link href={`/compose/${article.slug}`}><a className="edit-article">(Edit)</a></Link> }
            </h1>
          </section>
        }
        <section className="main-content article" dangerouslySetInnerHTML={{ __html: article.html }} />


        <section className="main-content">
          <hr />
          Posted on <b>{moment(article.created).format('LL')}</b> by <b>{author?.screenname}</b>
        </section>

        { article.tags && article.tags.length > 0 &&
          <section className="main-content tags">
            { article.tags.map(tag => <Link key={tag} href={`/search/${tag}`}><a className="tag">{tag}</a></Link>) }
          </section>
        }
      </main>
    </Layout>
  );
}

Article.getInitialProps = async ({ req, query }) => {
  try {
    const slug = (req && req.url.slice(1)) || (query && query.slug);
    const res = await api.get(`/article/${slug}`);
    const author = res.data?.results?.createdBy && (await api.get(`/user/${res.data?.results?.createdBy}`));

    return {
      article: res.data?.results,
      author: author.data?.results
    }
  } catch (error) {
    return {
      error
    };
  }
}

export default Article;
