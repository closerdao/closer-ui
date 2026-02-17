import Head from 'next/head';

import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const AskPage: NextPage = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('ask_page_title')}</title>
        <meta name="description" content={t('ask_page_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/ask"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.traditionaldreamfactory.com/ask"
        />
        <meta property="og:title" content={t('ask_page_title')} />
        <meta
          property="og:description"
          content={t('ask_page_meta_description')}
        />
      </Head>
      <main className="max-w-screen-md mx-auto px-4">
        <h1 className="text-3xl font-bold mt-6 mb-4">{t('ask_page_title')}</h1>
        <iframe
          title={t('ask_page_title')}
          className="w-full"
          src="https://app.gpt-trainer.com/gpt-trainer-widget/a9d70d04c6b64f328acd966ad87e4fb4"
          height="500px"
        ></iframe>
      </main>
    </>
  );
};

AskPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default AskPage;
