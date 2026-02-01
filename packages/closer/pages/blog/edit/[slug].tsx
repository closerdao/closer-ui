import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import BlogEditor from '../../../components/BlogEditor';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { HOME_PAGE_CATEGORY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface BlogConfig {
  enabled: boolean;
}

interface Props {
  article: any;
  error?: string;
  blogConfig: BlogConfig | null;
}

const Article = ({ article, error, blogConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isContentCreator = user?.roles.includes('content-creator');

  const isBlogEnabled = blogConfig?.enabled !== false;

  const photo = article && article?.photo;

  const fullImageUrl = photo?.startsWith('http')
    ? photo
    : `${cdn}${photo}-max-lg.jpg`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/article/${article._id}`);
      router.push('/blog');
    } catch (err) {
      console.error('Error deleting article:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isBlogEnabled) {
    return <FeatureNotEnabled feature="blog" />;
  }

  if (!article) {
    return <PageNotFound error={error} />;
  }

  if (!isAdmin && !isContentCreator && article.createdBy !== user?._id) {
    return <PageNotFound error="User may not access" />;
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

      <main className="main-content w-full max-w-5xl px-4 md:px-8">
        <div className="mb-8 flex items-center justify-between py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>{t('blog_title')}</span>
            </Link>
            {article.category === HOME_PAGE_CATEGORY && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>←</span>
                <span>{t('blog_home_button')}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('blog_editor_delete')}
            </button>
            <Link
              href={`/blog/${article.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t('blog_view_article')}
            </Link>
          </div>
        </div>

        <BlogEditor
          initialData={article}
          onSave={(savedArticle) => router.push(`/blog/${savedArticle.slug}`)}
        />

        {showDeleteConfirm && (
          <Modal
            closeModal={() => setShowDeleteConfirm(false)}
            className="md:w-[400px] md:h-auto"
          >
            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-bold">
                {t('edit_model_delete_confirm_title')}
              </h3>
              <p className="text-gray-600">
                {t('edit_model_delete_confirm_message')}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  {t('generic_cancel')}
                </Button>
                <Button
                  className="bg-red-600 text-white border-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  isEnabled={!isDeleting}
                >
                  {isDeleting ? t('generic_deleting') : t('blog_editor_delete')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
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

    const [articleRes, blogRes, messages] = await Promise.all([
      api.get(`/article/${slug}`),
      api.get('/config/blog').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const article = articleRes.data?.results;
    const blogConfig = blogRes?.data?.results?.value;
    return {
      article,
      blogConfig,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      blogConfig: null,
      messages: null,
    };
  }
};

export default Article;
