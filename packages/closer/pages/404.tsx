import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import Heading from '../components/ui/Heading';

import { GetStaticProps } from 'next';

import { loadLocaleData } from '../utils/locale.helpers';

interface Page404Props {
  error?: string;
  messages?: Record<string, string>;
}

const Page404 = ({ error }: Page404Props) => {
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

export const getStaticProps: GetStaticProps<Page404Props> = async () => {
  try {
    const messages = await loadLocaleData(
      'en',
      process.env.NEXT_PUBLIC_APP_NAME || 'tdf',
    );
    return {
      props: { messages },
      revalidate: 86400, // 24 hours
    };
  } catch (err) {
    console.error('Error loading locale data for 404 page:', err);
    return {
      props: { messages: {} },
    };
  }
};

export default Page404;
