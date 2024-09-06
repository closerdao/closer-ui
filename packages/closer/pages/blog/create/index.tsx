import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import EditModel from '../../../components/EditModel';
import { Heading } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import models from '../../../models';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

const Create = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isModerator = user?.roles.includes('moderator');

  if (!isAdmin && !isModerator) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('blog_write_article')}</title>

        <meta property="og:type" content="article" />
      </Head>

      <main className="main-content w-full max-w-4xl flex flex-col gap-8">
        <section>
          <div>
            <Link href="/blog" className="uppercase text-accent font-bold">
              ◀️ {t('blog_title')}
            </Link>
          </div>
          <Heading>{t('blog_write_article')}</Heading>
        </section>
        <section className=" w-full flex justify-center ">
          <div
            className={
              '"w-full relative bg-accent-light rounded-md w-full  min-h-[400px]" '
            }
          >
            <EditModel
              endpoint="/article"
              fields={models.article}
              onSave={(article) => router.push(`/blog/${article.slug}`)}
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

Create.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default Create;
