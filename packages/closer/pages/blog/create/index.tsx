import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import BlogEditor from '../../../components/BlogEditor';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface BlogConfig {
  enabled: boolean;
}

interface Props {
  blogConfig: BlogConfig | null;
}

const Create = ({ blogConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isContentCreator = user?.roles.includes('content-creator');

  const isBlogEnabled = blogConfig?.enabled !== false;

  if (!isBlogEnabled) {
    return <FeatureNotEnabled feature="blog" />;
  }

  if (!isAdmin && !isContentCreator) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('blog_write_article')}</title>
        <meta property="og:type" content="article" />
      </Head>

      <main className="main-content w-full max-w-5xl px-4 md:px-8">
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span>{t('blog_title')}</span>
          </Link>
        </div>

        <BlogEditor
          onSave={(article) => router.push(`/blog/${article.slug}`)}
        />
      </main>
    </>
  );
};

Create.getInitialProps = async (context: NextPageContext) => {
  try {
    const [blogRes, messages] = await Promise.all([
      api.get('/config/blog').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const blogConfig = blogRes?.data?.results?.value;
    return {
      blogConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      blogConfig: null,
      messages: null,
    };
  }
};

export default Create;
