import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Heading from '../components/ui/Heading';

import { NextPage } from 'next';

import { __ } from '../utils/helpers';

const PageNotFound: NextPage<{ error?: string }> = ({ error }) => (
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

export default PageNotFound;