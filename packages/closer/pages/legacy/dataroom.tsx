import Head from 'next/head';

import { useTranslations } from 'next-intl';

import CustomDataroom from '../../components/custom-pages/CustomDataroom';

const LegacyDataroomPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('dataroom_hero_subtitle')}</title>
        <meta name="description" content={t('dataroom_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/dataroom"
          key="canonical"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.traditionaldreamfactory.com/dataroom"
        />
        <meta property="og:title" content={t('dataroom_hero_subtitle')} />
        <meta
          property="og:description"
          content={t('dataroom_page_description')}
        />
        <meta
          property="og:image"
          content="https://cdn.oasa.co/tdf/tdf-invest-og.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('dataroom_hero_subtitle')} />
        <meta
          name="twitter:description"
          content={t('dataroom_page_description')}
        />
        <meta
          name="twitter:image"
          content="https://cdn.oasa.co/tdf/tdf-invest-og.jpg"
        />
      </Head>
      <CustomDataroom />
    </>
  );
};

export default LegacyDataroomPage;
