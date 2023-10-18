import Head from 'next/head';

import React from 'react';

const ImpactMapPage = () => {
  return (
    <>
      <Head>
        <title>
          Traditional Dream Factory | Regenerative coliving space in Alentejo,
          Portugal
        </title>
      </Head>
      <div className="absolute w-full">
        <img
          src="/images/graphics/impact.jpg"
          alt="TDF Impact Map"
          className="w-full"
        />
      </div>
    </>
  );
};

export default ImpactMapPage;
