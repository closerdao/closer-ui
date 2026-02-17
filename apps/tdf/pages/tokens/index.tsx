import Head from 'next/head';

import React from 'react';

import { TokenInterface } from '../../components/TokenInteraction';

import { useConfig } from 'closer/hooks/useConfig';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { twitterUrlToHandle } from 'closer/utils/app.helpers';
import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const TokensPage: NextPage = () => {
  const t = useTranslations();
  const config = useConfig();
  const twitterHandle = twitterUrlToHandle(config?.TWITTER_URL);
  return (
    <>
      <Head>
        <title>{t('tokens_page_title')}</title>
        <meta name="description" content={t('tokens_page_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/tokens"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.traditionaldreamfactory.com/tokens"
        />
        <meta property="og:title" content={t('tokens_page_title')} />
        <meta
          property="og:description"
          content={t('tokens_page_meta_description')}
        />
        <meta name="twitter:card" content="summary_large_image" />
        {twitterHandle && (
          <meta name="twitter:site" content={twitterHandle} />
        )}
        <meta name="twitter:title" content={t('tokens_page_title')} />
        <meta
          name="twitter:description"
          content={t('tokens_page_meta_description')}
        />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('tokens_page_heading')}</h1>
        </div>

        <p className="mb-8">{t('tokens_page_intro')}</p>

        <TokenInterface className="mb-8" />
      </div>
    </>
  );
};

TokensPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
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
