import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import ErrorPage from '../components/ErrorPage';
import { useAuth } from '../contexts/auth';

const PageNotFound = ({ error, back }: { error?: string; back?: string }) => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if ((!isAuthenticated || !user) && back) {
      router.push(`/login?back=${back}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <>
      <Head>
        <title>{t('404_title')}</title>
      </Head>
      <ErrorPage code="404" title={t('404_title')} error={error}>
        <Link href="/" className="btn-primary">
          {t('404_go_back')}
        </Link>
      </ErrorPage>
    </>
  );
};

PageNotFound.getInitialProps = async (context: NextPageContext) => {
  return {};
};

export default PageNotFound;
