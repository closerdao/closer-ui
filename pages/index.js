import Head from 'next/head';

import React from 'react';

import Layout from '../components/Layout';

import { DEFAULT_TITLE, PLATFORM_NAME } from '../config';

const Index = () => {
  return (
    <Layout>
      <Head>
        <title>{PLATFORM_NAME}</title>
      </Head>
      <main className="homepage">
        <section className="text-center flex flex-column items-center justify-center pb-10">
          <div className="main-content">
            <h1 className="text-8xl font-normal leading-none">
              {PLATFORM_NAME}
            </h1>
            <p className="text-2xl mt-4">{DEFAULT_TITLE}</p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Index;
