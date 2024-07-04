import Head from 'next/head';

import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

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

ImpactMapPage.getInitialProps = async (context: NextPageContext) => {
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

export default ImpactMapPage;
