import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useState } from 'react';

import RichTextEditor from '../../../components/RichTextEditor';
import { Button } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { HOME_PAGE_CATEGORY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  article: any;
  error?: string;
}

const Article = ({ article, error }: Props) => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const [html, setHtml] = useState(article.html);
  const onChange = (value: string) => {
    setHtml(value);
  };

  const persist = async () => {
    await api.patch(`/article/${article._id}`, { html });
  };

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
      <main className="main-content w-full max-w-6xl">
        <section>
          {article.photo && (
            <div className="relative w-full h-96 md:basis-1/2 md:w-96">
              <Image
                src={fullImageUrl}
                alt={article.title}
                fill={true}
                className="bg-cover bg-center"
              />
            </div>
          )}
          <div className="mb-4">
            <div className="flex gap-2">
              <Link href="/blog">◀️ Blog</Link>
              {article.category === HOME_PAGE_CATEGORY && (
                <Link href="/">◀️ {t('blog_home_button')}</Link>
              )}
            </div>
            <Heading>{article.title}</Heading>
            <Heading level={2} className="opacity-50 mb-4">
              {article.category}
            </Heading>
            {isAuthenticated && user?.roles.includes('admin') && (
              <div>
                <Button
                  onClick={() => persist()}
                  type="primary"
                  isFullWidth={false}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </section>
        {/* <Editor value={html} onChange={onChange} /> */}
        <RichTextEditor value={html} onChange={onChange} />
      </main>
    </>
  );
};

Article.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query, req } = context;
    const slug =
      (req && req.url && req.url.replace('/blog/edit/', '')) ||
      (query && query.slug);

    const [articleRes, messages] = await Promise.all([
      api.get(`/article/${slug}`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const article = articleRes.data?.results;
    return {
      article,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default Article;
