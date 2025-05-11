import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const ArtFaire = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('reg_village_title')}</title>
        <meta name="description" content={t('reg_village_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="max-w-6xl mx-auto">
        <div className="md:flex md:flex-row mb-8">
          <img
            src="/images/products/how-to-build-a-regenerative-village.jpg"
            className="mr-8 shadow rounded-lg w-[200px]"
            alt={t('reg_village_img_alt')}
          />
          <div className="max-w-prose">
            <Heading
              className="text-3xl mt-6 md:text-4xl"
              data-testid="page-title"
              display
              level={1}
            >
              {t('reg_village_heading')}
            </Heading>
            <p className="mb-6 text-2xl">{t('reg_village_subheading')}</p>
            <Link
              href="https://payhip.com/buy?link=OxFHQ"
              target="_blank"
              className="btn btn-primary"
              onClick={() =>
                event('click', {
                  category: 'HowToBuildARegenerativeVillage',
                  label: 'Buy',
                })
              }
            >
              {t('reg_village_buy_cta')}
            </Link>
          </div>
        </div>
        <div className="text-lg max-w-prose">
          <p className="mb-4">{t('reg_village_intro')}</p>
          <Heading className="mb-4" display level={3}>
            {t('reg_village_chapters_heading')}
          </Heading>
          <ul>
            <li className="mb-4">
              <Heading level={4}>{t('reg_village_chapter_1_title')}</Heading>
              <p>{t('reg_village_chapter_1_desc')}</p>
            </li>
            <li className="mb-4">
              <Heading level={4}>{t('reg_village_chapter_2_title')}</Heading>
              <p>{t('reg_village_chapter_2_desc')}</p>
            </li>
            <li className="mb-4">
              <Heading level={4}>{t('reg_village_chapter_3_title')}</Heading>
              <p>{t('reg_village_chapter_3_desc')}</p>
            </li>
            <li className="mb-4">
              <Heading level={4}>{t('reg_village_chapter_4_title')}</Heading>
              <p>{t('reg_village_chapter_4_desc')}</p>
            </li>
            <li className="mb-4">
              <Heading level={4}>{t('reg_village_chapter_5_title')}</Heading>
              <p>{t('reg_village_chapter_5_desc')}</p>
            </li>
            <li className="mb-4">
              <Heading level={4}>{t('reg_village_chapter_6_title')}</Heading>
              <p>{t('reg_village_chapter_6_desc')}</p>
            </li>
          </ul>
          <p className="mb-6 italic">{t('reg_village_price_note')}</p>
        </div>
      </section>
    </>
  );
};

ArtFaire.getInitialProps = async (context: NextPageContext) => {
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

export default ArtFaire;
