import React from 'react';
import Head from 'next/head';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import CitizenshipPage from 'closer/pages/citizenship';

const TDFCitizenshipPage = () => {
  return (
    <>
      <Head>
        <title>Become a Citizen of TDF</title>
        <meta name="description" content="Citizenship at Traditional Dream Factory: belonging, governance, and access through tokens." />
        <link rel="canonical" href="https://www.traditionaldreamfactory.com/citizenship" key="canonical" />
      </Head>

      <CitizenshipPage 
        appName="Traditional Dream Factory"
        customConfig={{
          citizenTarget: 300,
          apiEndpoint: '/users?roles=member'
        }}
      />
    </>
  );
};

export default TDFCitizenshipPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale, 'tdf'),
    },
  };
}


