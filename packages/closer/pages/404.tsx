import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import Heading from '../components/ui/Heading';

import { NextPageContext } from 'next';

import { loadLocaleData } from '../utils/locale.helpers';

const Page404 = ({ error }: { error?: string }) => {
  const router = useRouter();

  useEffect(() => {
    router.push('/404');
  }, []);

  return (
    <>
      <Head>
        <title>Page not found</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
        <Heading>Page not found</Heading>
        {error && (
          <Heading level={2} className="font-light italic my-4">
            {' '}
            {error}
          </Heading>
        )}
        <p>
          <Link href="/" className="btn text-center">
            Take me home
          </Link>
        </p>
      </main>
    </>
  );
};

Page404.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale || 'en',
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

export default Page404;
