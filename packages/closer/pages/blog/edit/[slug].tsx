import Head from 'next/head';
import Link from 'next/link';
import router from 'next/router';

import EditModel from '../../../components/EditModel';
import { LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { HOME_PAGE_CATEGORY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import models from '../../../models';
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

  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isModerator = user?.roles.includes('moderator');

  const photo = article && article?.photo;

  const fullImageUrl = photo?.startsWith('http')
    ? photo
    : `${cdn}${photo}-max-lg.jpg`;
  const onUpdate = async (
    name: string,
    value: any,
    option?: any,
    actionType?: string,
  ) => {
    try {
      if (actionType === 'ADD' && name === 'visibleBy' && option?._id) {
        await api.post(`/moderator/article/${article._id}/add`, option);
      }
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  if (!article) {
    return <PageNotFound error={error} />;
  }

  if (!isAdmin && !isModerator && article.createdBy !== user?._id) {
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
      <main className="main-content w-full max-w-4xl flex flex-col gap-8">
        <section>
          <div className="flex gap-2">
            <div>
              <Link href="/blog" className="uppercase text-accent font-bold">
                ◀️ {t('blog_title')}
              </Link>
            </div>
            {article.category === HOME_PAGE_CATEGORY && (
              <Link href="/">◀️ {t('blog_home_button')}</Link>
            )}
          </div>
          <div className="flex justify-between items-center">
            <Heading>{t('blog_edit_article')}</Heading>
            <LinkButton
              href={`/blog/${article.slug}`}
              size="small"
              isFullWidth={false}
            >
              {t('blog_view_article')}
            </LinkButton>
          </div>
        </section>
        <section className=" w-full flex justify-center ">
          <div
            className={
              '"w-full relative bg-accent-light rounded-md w-full  min-h-[400px]" '
            }
          >
            <EditModel
              id={article._id}
              endpoint="/article"
              fields={models.article}
              initialData={article}
              onSave={(article) => router.push(`/blog/${article.slug}`)}
              onUpdate={onUpdate}
              allowDelete
              deleteButton="Delete article"
              onDelete={() => router.push('/blog')}
            />
          </div>
        </section>
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
