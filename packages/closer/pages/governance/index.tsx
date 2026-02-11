import React from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { ProposalList } from 'closer/components/Governance';
import WalletAndVoting from 'closer/components/Governance/WalletAndVoting';

const GovernancePage: NextPage = () => {
  const t = useTranslations();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Closer';
  
  return (
    <>
      <Head>
        <title>{t('governance_title')} - {appName}</title>
        <meta
          name="description"
          content={t('governance_meta_description')}
        />
      </Head>
      <div className="min-h-screen bg-gray-50/70">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {t('governance_title')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('governance_meta_description')}
              </p>
            </div>
            <Link
              href="/governance/create"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {t('governance_create_proposal')}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProposalList className="mb-6" />
            </div>

            <div className="space-y-6">
              <WalletAndVoting />

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      {t('join_community_title')}
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      {t('join_community_description')}
                    </p>
                    <a
                      href="https://t.me/traditionaldreamfactor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t('join_community_telegram_button')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
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
