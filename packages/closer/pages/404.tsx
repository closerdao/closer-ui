import Head from 'next/head';
import Link from 'next/link';

import Heading from '../components/ui/Heading';

import { GetStaticPropsContext, PreviewData } from 'next';
import { ParsedUrlQuery } from 'querystring';

import { useRouter } from 'next/router';
import { useEffect } from 'react';
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

export async function getStaticProps(
  context: GetStaticPropsContext<ParsedUrlQuery, PreviewData>,
) {
  const messages = await loadLocaleData(
    context?.locale,
    process.env.NEXT_PUBLIC_APP_NAME,
  );
  return {
    props: { messages },
  };
}

export default Page404;
