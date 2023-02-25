import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Layout from '../components/Layout';

import { __ } from '../utils/helpers';

const PageNotFound = ({ error }) => (
  <Layout>
    <Head>
      <title>{__('404_title')}</title>
    </Head>
    <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
      <h1>{__('404_title')}</h1>
      {error && <h2 className="font-light italic my-4"> {error}</h2>}
      <p>
        <Link href="/">
          <a className="btn text-center">{__('404_go_back')}</a>
        </Link>
      </p>
    </main>
  </Layout>
);

export default PageNotFound;
