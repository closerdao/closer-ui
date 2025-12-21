import Head from 'next/head';

import { Heading, Card, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const RegenerativeAgriculturePage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('regen_ag_page_title')}</title>
        <meta
          name="description"
          content={t('regen_ag_page_description')}
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/pages/regenerative-agriculture"
          key="canonical"
        />
      </Head>

      <section className="bg-gradient-to-br from-accent-light to-accent-alt-light min-h-[50vh] flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <Heading
              className="text-4xl md:text-6xl mb-6 text-white drop-shadow-lg"
              display
              level={1}
            >
              {t('regen_ag_hero_title')}
            </Heading>
            <p className="text-xl text-black max-w-3xl mx-auto leading-relaxed">
              {t('regen_ag_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
            <div>
              <Heading level={2} className="mb-6 text-3xl">
                {t('regen_ag_approach_title')}
              </Heading>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {t('regen_ag_approach_desc_1')}
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {t('regen_ag_approach_desc_2')}
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <img
                src="/images/maps/co-living.png"
                alt={t('regen_ag_img_alt')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6">
              <div className="text-4xl mb-4">🌳</div>
              <Heading level={3} className="mb-4 text-xl">
                {t('regen_ag_agroforestry_title')}
              </Heading>
              <p className="text-gray-600">
                {t('regen_ag_agroforestry_desc')}
              </p>
            </Card>

            <Card className="p-6">
              <div className="text-4xl mb-4">💧</div>
              <Heading level={3} className="mb-4 text-xl">
                {t('regen_ag_water_title')}
              </Heading>
              <p className="text-gray-600">
                {t('regen_ag_water_desc')}
              </p>
            </Card>

            <Card className="p-6">
              <div className="text-4xl mb-4">🌱</div>
              <Heading level={3} className="mb-4 text-xl">
                {t('regen_ag_organic_title')}
              </Heading>
              <p className="text-gray-600">
                {t('regen_ag_organic_desc')}
              </p>
            </Card>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-16">
            <Heading level={2} className="mb-6 text-3xl text-center">
              {t('regen_ag_practices_title')}
            </Heading>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-accent mr-3 mt-1">✓</span>
                    <span className="text-gray-700">
                      <strong>{t('regen_ag_practice_tree_label')}:</strong> {t('regen_ag_practice_tree_desc')}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-3 mt-1">✓</span>
                    <span className="text-gray-700">
                      <strong>{t('regen_ag_practice_water_label')}:</strong> {t('regen_ag_practice_water_desc')}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-3 mt-1">✓</span>
                    <span className="text-gray-700">
                      <strong>{t('regen_ag_practice_biochar_label')}:</strong> {t('regen_ag_practice_biochar_desc')}
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-accent mr-3 mt-1">✓</span>
                    <span className="text-gray-700">
                      <strong>{t('regen_ag_practice_notill_label')}:</strong> {t('regen_ag_practice_notill_desc')}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-3 mt-1">✓</span>
                    <span className="text-gray-700">
                      <strong>{t('regen_ag_practice_cover_label')}:</strong> {t('regen_ag_practice_cover_desc')}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-3 mt-1">✓</span>
                    <span className="text-gray-700">
                      <strong>{t('regen_ag_practice_compost_label')}:</strong> {t('regen_ag_practice_compost_desc')}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Heading level={2} className="mb-6 text-3xl">
              {t('regen_ag_impact_title')}
            </Heading>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
              {t('regen_ag_impact_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LinkButton
                href="/dataroom"
                variant="primary"
                className="bg-accent text-white hover:bg-accent-dark"
              >
                {t('regen_ag_cta_impact')}
              </LinkButton>
              <LinkButton
                href="/events"
                variant="secondary"
              >
                {t('regen_ag_cta_visit')}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

RegenerativeAgriculturePage.getInitialProps = async (context: NextPageContext) => {
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

export default RegenerativeAgriculturePage;

