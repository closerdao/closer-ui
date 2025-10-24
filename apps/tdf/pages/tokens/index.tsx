import React from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { TokenInterface } from '../../components/TokenInteraction';

const TokensPage: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>TDF Token Explorer</title>
        <meta
          name="description"
          content="Interact with blockchain tokens in the TDF ecosystem"
        />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Token Explorer</h1>
        </div>
        
        <p className="mb-8">
          This page allows you to interact with various tokens on the blockchain.
          Connect your wallet to view token balances and interact with token contracts.
        </p>
        
        <TokenInterface className="mb-8" />
      </div>
    </Layout>
  );
};

TokensPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME);
    return {
      messages,
    };
  } catch (err) {
    return {
      error: err,
      messages: null,
    };
  }
};

export default TokensPage;
