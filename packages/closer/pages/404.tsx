import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import Heading from '../components/ui/Heading';

import { loadLocaleData } from '../utils/locale.helpers';

const Page404 = ({ error }: { error?: string }) => {
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    router.push('/notfound');
  }, []);

  return (
    <>
      <Head>
        <title>{t('page_not_found')}</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
        <Heading>{t('page_not_found')}</Heading>
        {error && (
          <Heading level={2} className="font-light italic my-4">
            {' '}
            {error}
          </Heading>
        )}
      </main>
    </>
  );
};

export async function getStaticProps() {
  const messages = await loadLocaleData(
    'en',
    process.env.NEXT_PUBLIC_APP_NAME || 'tdf',
  );
  return {
    props: { messages },
    revalidate: 86400, // 24 hours
  };
}

export default Page404;