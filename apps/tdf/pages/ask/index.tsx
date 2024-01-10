import Head from 'next/head';

import { NextPage } from 'next';

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

export default AskPage;
