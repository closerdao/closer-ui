import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import { __ } from '../utils/helpers';

const PageNotFound = ({ error }) => (
  <>
    <Head>
      <title>{__('404_title')}</title>
    </Head>
    <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
      <h1>{__('404_title')}</h1>
      {error && <h2 className="font-light italic my-4"> {error}</h2>}
      <p>
        <Link href="/" className="btn text-center">
          {__('404_go_back')}
        </Link>
      </p>
    </main>
  </>
);

export default PageNotFound;