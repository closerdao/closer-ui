import React from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { ProposalList } from 'closer/components/Governance';
import WalletAndVoting from 'closer/components/Governance/WalletAndVoting';

const GovernancePage: NextPage = () => {
  const t = useTranslations();
  
  return (
    <>
      <Head>
        <title>{t('governance_title')} - TDF</title>
        <meta
          name="description"
          content={t('governance_meta_description')}
        />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('governance_title')}</h1>
          <Link
            href="/governance/create"
            className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded"
          >
            {t('governance_create_proposal')}
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProposalList className="mb-6" />
          </div>
          
          <div className="space-y-6">
            <WalletAndVoting />
          </div>
        </div>
      </div>
    </>
  );
};

export default GovernancePage;

GovernancePage.getInitialProps = async (context: NextPageContext) => {
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
