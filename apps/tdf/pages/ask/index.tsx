import Head from 'next/head';

import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPage, NextPageContext } from 'next';

const AskPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ask TDF Anything</title>
      </Head>
      <iframe
        className="max-w-screen-md mx-auto"
        src="https://app.gpt-trainer.com/gpt-trainer-widget/a9d70d04c6b64f328acd966ad87e4fb4"
        width="100%"
        height="500px"
      ></iframe>
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
