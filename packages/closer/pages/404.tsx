import Head from 'next/head';
import Link from 'next/link';

import Heading from '../components/ui/Heading';

import { loadLocaleData } from '../utils/locale.helpers';

const Page404 = ({ error }: { error?: string }) => {
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

export async function getStaticProps({ locale }: { locale?: string }) {
  const messages = await loadLocaleData(
    locale || 'en',
    process.env.NEXT_PUBLIC_APP_NAME || 'tdf',
  );
  return {
    props: { messages },
  };
}

export default Page404;