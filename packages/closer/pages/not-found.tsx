import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import Heading from '../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { loadLocaleData } from '../utils/locale.helpers';

const PageNotFound = ({ error, back }: { error?: string; back?: string }) => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if ((!isAuthenticated || !user) && back) {
      redirectToLogin();
    }
  }, [isAuthenticated]);

  const redirectToLogin = () => {
    router.push(`/login?back=${back}`);
  };

  return (
    <>
      <Head>
        <title>{t('404_title')}</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
        <Heading>{t('404_title')}</Heading>
        {error && (
          <Heading level={2} className="font-light italic my-4">
            {' '}
            {error}
          </Heading>
        )}
        <p>
          <Link href="/" className="btn text-center">
            {t('404_go_back')}
          </Link>
        </p>
      </main>
    </>
  );
};

PageNotFound.getInitialProps = async (context: NextPageContext) => {
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

export default PageNotFound;
