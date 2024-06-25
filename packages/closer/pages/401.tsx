import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Heading from '../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { loadLocaleData } from '../utils/locale.helpers';

const PageNotAllowed = ({ error }: { error?: string }) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Head>
        <title>{t('401_title')}</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose">
        <Heading>{t('401_title')}</Heading>
        {error && (
          <Heading level={2} className="font-light italic my-4">
            {error}
          </Heading>
        )}
        {!isAuthenticated && (
          <p>
            <Link
              href={`/login?back=${encodeURIComponent(router.asPath)}`}
              className="btn"
            >
              {t('401_signin')}
            </Link>
            .
          </p>
        )}
      </main>
    </>
  );
};

PageNotAllowed.getInitialProps = async (context: NextPageContext) => {
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

export default PageNotAllowed;
