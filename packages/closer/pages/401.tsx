import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import ErrorPage from '../components/ErrorPage';
import { useAuth } from '../contexts/auth';

const PageNotAllowed = ({ error }: { error?: string }) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const back = encodeURIComponent(router.asPath);

  return (
    <>
      <Head>
        <title>{t('401_title')}</title>
      </Head>
      <ErrorPage
        code="401"
        title={t('401_title')}
        error={error}
        message={isAuthenticated ? undefined : t('401_message')}
      >
        {isAuthenticated ? (
          // Signed in but still not allowed — logging in again won't help, so
          // the only useful way out is back to safety.
          <Link href="/" className="btn-primary">
            {t('404_go_back')}
          </Link>
        ) : (
          <>
            <Link href={`/login?back=${back}`} className="btn-primary">
              {t('401_signin')}
            </Link>
            <Link href={`/signup?back=${back}`} className="btn">
              {t('navigation_signup')}
            </Link>
          </>
        )}
      </ErrorPage>
    </>
  );
};

PageNotAllowed.getInitialProps = async (context: NextPageContext) => {
  return {};
};

export default PageNotAllowed;
