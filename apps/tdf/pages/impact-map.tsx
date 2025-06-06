import Head from 'next/head';

import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const ImpactMapPage = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('impact_map_title')}</title>
      </Head>
      <div className="absolute w-full">
        <img
          src="/images/graphics/impact.jpg"
          alt={t('impact_map_img_alt')}
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
