import Head from 'next/head';

import React from 'react';

import { DEFAULT_TITLE, PLATFORM_NAME } from '../config';

const Index = () => {
  return (
    <>
      <Head>
        <title>{PLATFORM_NAME}</title>
      </Head>
      <main className="flex flex-1 justify-center">
        <section className="text-center flex flex-column items-center justify-center pb-10">
          <div className="main-content">
            <h1 className="text-8xl font-normal leading-none">
              {PLATFORM_NAME}
            </h1>
            <p className="text-2xl mt-4">{DEFAULT_TITLE}</p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
