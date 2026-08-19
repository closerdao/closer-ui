import Head from 'next/head';

import React from 'react';

import { GovernanceWeightDashboard } from 'closer/components/Governance';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const GovernanceWeightPage: NextPage = () => {
  const t = useTranslations();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Closer';

  return (
    <>
      <Head>
        <title>{`${t('governance_weight_headline')} - ${appName}`}</title>
        <meta name="description" content={t('governance_weight_standfirst')} />
      </Head>
      <div className="min-h-screen bg-gray-50/70">
        <GovernanceWeightDashboard />
      </div>
    </>
  );
};

export default GovernanceWeightPage;

GovernanceWeightPage.getInitialProps = async (context: NextPageContext) => {
  try {
    return {};
  } catch (err) {
    return {
      error: err,
    };
  }
};
