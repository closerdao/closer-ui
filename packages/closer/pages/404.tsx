import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect } from 'react';

import Heading from '../components/ui/Heading';

import { NextPage } from 'next';

import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';

const PageNotFound: NextPage<{ error?: string; back?: string }> = ({
  error,
  back,
}) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if ((!isAuthenticated || !user) && back) {
      redirectToLogin();
    }
  }, [isAuthenticated]);

  const redirectToLogin = () => {
    router.push(`/login?back=${back}`);
  };

  return (
    <>
      <Head>
        <title>{__('404_title')}</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
        <Heading>{__('404_title')}</Heading>
        {error && (
          <Heading level={2} className="font-light italic my-4">
            {' '}
            {error}
          </Heading>
        )}
        <p>
          <Link href="/" className="btn text-center">
            {__('404_go_back')}
          </Link>
        </p>
      </main>
    </>
  );
};

export default PageNotFound;
