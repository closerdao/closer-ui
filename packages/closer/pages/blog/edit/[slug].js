import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

import React, { useState } from 'react';
import Editor from 'react-simple-wysiwyg';

import { useAuth } from '../../../contexts/auth';
import api, { cdn } from '../../../utils/api';
import PageNotFound from '../../404';

const Article = ({ article, error }) => {
  const { user, isAuthenticated } = useAuth();
  const [html, setHtml] = useState(article.html);
  const onChange = (e) => {
    setHtml(e.target.value);
  }

  const persist = async () => {
    await api.patch(`/article/${article._id}`, { html })
  }

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
      <section>
        { article.photo && <div className="relative w-full h-96 md:basis-1/2 md:w-96">
          <Image
            src={ fullImageUrl }
            alt={ article.title }
            fill={ true }
            className="bg-cover bg-center"
          />
        </div> }
        <div className="mb-4">
          <div><Link href="/blog">◀️ Blog</Link></div>
          <h1>{article.title}</h1>
          <h2 className="opacity-50 mb-4">
            {article.category}
          </h2>
          {isAuthenticated && user._id === article.createdBy && (
            <div>
              <button
                onClick={ () => persist() }
                className="btn-primary"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </section>
      <Editor value={html} onChange={onChange} />

      <section className="col right-col">
        <h3 className="mt-8">Posted</h3>
        <p>{createdAt}</p>
        <h3 className="mt-8">Tags</h3>
        <p className="tags">
          {article.tags &&
            article.tags.length > 0 &&
            article.tags.map((tag) => (
              <Link
                key={tag}
                as={`/blog/search/${tag}`}
                href="/blog/search/[keyword]"
                className="mr-4 mb-2 text-xs inline-flex items-center font-bold leading-sm uppercase text-black px-3 py-1 bg-gray-200 rounded-full"
              >
                {tag}
              </Link>
            ))}
        </p>
      </section>
    </>
  );
};

Article.getInitialProps = async ({ req, query }) => {
  try {
    const slug = (req && req.url.replace('/blog/edit/', '')) || (query && query.slug);
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