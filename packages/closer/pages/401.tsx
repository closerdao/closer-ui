import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { FC } from 'react';

import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';

const PageNotAllowed: FC<{ error?: string }> = ({ error }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Head>
        <title>{__('401_title')}</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose">
        <h1>{__('401_title')}</h1>
        {error && <h2 className="font-light italic my-4">{error}</h2>}
        {!isAuthenticated && (
          <p>
            <Link
              href={`/login?back=${encodeURIComponent(router.asPath)}`}
              className="btn"
            >
              {__('401_signin')}
            </Link>
            .
          </p>
        )}
      </main>
    </>
  );
};

export default PageNotAllowed;