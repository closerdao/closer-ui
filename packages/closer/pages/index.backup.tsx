import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import Heading from '../components/ui/Heading';

import { NextPage } from 'next';
import { event } from 'nextjs-google-analytics';

import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';

const Index: NextPage = () => {
  const { DEFAULT_TITLE, PLATFORM_NAME } = useConfig() || {};
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Head>
        <title>{PLATFORM_NAME}</title>
      </Head>
      <main className="flex flex-1 flex-col justify-center">
        <section className="text-center flex flex-column items-center justify-center pb-10">
          <div className="main-content">
            <Heading className="text-8xl font-normal leading-none">
              {PLATFORM_NAME}
            </Heading>
            <p className="text-2xl mt-4">{DEFAULT_TITLE}</p>
          </div>
        </section>
        <section className="mt-4">
          <Image
            width="615"
            height="503"
            alt="Closer Layers: Natural assets > Web3 governance and access > Regenerative Villages "
            src="/images/backgrounds/layers.png?3"
          />
          {!isAuthenticated && (
            <Link
              href="/signup"
              id="cta-signup"
              className="btn-primary text-3xl px-8 py-4 block text-center mx-auto mt-8 mb-6 rounded-full "
              onClick={() =>
                event('click', { category: 'HomePage', label: 'Signup' })
              }
            >
              Launch your web3 land based project
            </Link>
          )}
        </section>
      </main>
    </>
  );
};

export default Index;
