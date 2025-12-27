import Head from 'next/head';

import { Heading, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { Check, Droplets, Flame, Sprout, TreeDeciduous } from 'lucide-react';
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
              className="text-4xl md:text-6xl mb-6"
              display
              level={1}
            >
              {t('regen_ag_hero_title')}
            </Heading>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed mb-12">
              {t('regen_ag_hero_subtitle')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">1.2M L</div>
                <div className="text-xs text-gray-600">{t('regen_ag_metric_rainwater')}</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">1<span className="text-lg text-gray-500">/5</span></div>
                <div className="text-xs text-gray-600">{t('regen_ag_metric_lakes')}</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">4,000+</div>
                <div className="text-xs text-gray-600">{t('regen_ag_metric_trees')}</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">150+</div>
                <div className="text-xs text-gray-600">{t('regen_ag_metric_flora')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Heading level={2} className="mb-6 text-3xl">
              {t('regen_ag_approach_title')}
            </Heading>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t('regen_ag_approach_desc_1')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 border border-gray-200 rounded-xl">
              <TreeDeciduous className="w-8 h-8 text-accent mb-4" />
              <Heading level={3} className="mb-3 text-lg">
                {t('regen_ag_agroforestry_title')}
              </Heading>
              <p className="text-gray-600 text-sm">
                {t('regen_ag_agroforestry_desc')}
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <Droplets className="w-8 h-8 text-accent mb-4" />
              <Heading level={3} className="mb-3 text-lg">
                {t('regen_ag_water_title')}
              </Heading>
              <p className="text-gray-600 text-sm">
                {t('regen_ag_water_desc')}
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <Sprout className="w-8 h-8 text-accent mb-4" />
              <Heading level={3} className="mb-3 text-lg">
                {t('regen_ag_organic_title')}
              </Heading>
              <p className="text-gray-600 text-sm">
                {t('regen_ag_organic_desc')}
              </p>
            </div>
          </div>

          <img 
            src="/images/landing/land-plan.png" 
            alt={t('regen_ag_land_plan_alt')} 
            className="w-full h-auto rounded-xl"
          />
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <Heading level={2} className="mb-8 text-3xl text-center">
            {t('regen_ag_practices_title')}
          </Heading>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl mx-auto">
            {[
              { label: 'regen_ag_practice_tree_label', desc: 'regen_ag_practice_tree_desc' },
              { label: 'regen_ag_practice_water_label', desc: 'regen_ag_practice_water_desc' },
              { label: 'regen_ag_practice_biochar_label', desc: 'regen_ag_practice_biochar_desc' },
              { label: 'regen_ag_practice_notill_label', desc: 'regen_ag_practice_notill_desc' },
              { label: 'regen_ag_practice_cover_label', desc: 'regen_ag_practice_cover_desc' },
              { label: 'regen_ag_practice_compost_label', desc: 'regen_ag_practice_compost_desc' },
            ].map((practice, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm">
                  <strong>{t(practice.label)}:</strong> {t(practice.desc)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Heading level={2} className="mb-4 text-3xl text-center">
            {t('regen_ag_mushroom_title')}
          </Heading>
          <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
            {t('regen_ag_mushroom_intro')}
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-200 rounded-xl p-6">
              <Heading level={3} className="mb-3 text-lg">{t('regen_ag_mushroom_current_title')}</Heading>
              <p className="text-gray-600 text-sm mb-4">{t('regen_ag_mushroom_current_desc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t('regen_ag_mushroom_oyster')}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t('regen_ag_mushroom_shiitake')}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t('regen_ag_mushroom_reishi')}</span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <Heading level={3} className="mb-3 text-lg">{t('regen_ag_mushroom_extracts_title')}</Heading>
              <p className="text-gray-600 text-sm mb-4">{t('regen_ag_mushroom_extracts_desc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t('regen_ag_extract_lions_mane')}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t('regen_ag_extract_reishi')}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t('regen_ag_extract_turkey_tail')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid md:grid-cols-4 gap-6 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">300</div>
                <div className="text-xs text-gray-500">{t('regen_ag_mushroom_bucket_capacity')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">~250kg</div>
                <div className="text-xs text-gray-500">{t('regen_ag_mushroom_monthly_oyster')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">~60kg</div>
                <div className="text-xs text-gray-500">{t('regen_ag_mushroom_monthly_reishi')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">4</div>
                <div className="text-xs text-gray-500">{t('regen_ag_mushroom_channels')}</div>
              </div>
            </div>
            <p className="text-gray-500 text-xs text-center">
              {t('regen_ag_mushroom_distribution_summary')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <Heading level={2} className="mb-4 text-3xl text-center">
            {t('regen_ag_orchard_title')}
          </Heading>
          <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
            {t('regen_ag_orchard_intro')}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">~2,400</div>
              <div className="text-xs text-gray-500">{t('regen_ag_orchard_total_trees')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">4</div>
              <div className="text-xs text-gray-500">{t('regen_ag_orchard_zones')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">5-10</div>
              <div className="text-xs text-gray-500">{t('regen_ag_orchard_years')}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="p-4 text-center">
                <div className="text-lg mb-1">🌰</div>
                <div className="font-medium text-sm">{t('regen_ag_orchard_almond')}</div>
                <div className="text-xs text-gray-400">1,300+ trees</div>
                <div className="text-xs text-accent mt-1">→ ~6,000 kg butter/yr</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-lg mb-1">🫒</div>
                <div className="font-medium text-sm">{t('regen_ag_orchard_olive')}</div>
                <div className="text-xs text-gray-400">~300 trees</div>
                <div className="text-xs text-accent mt-1">→ ~700 L oil/yr</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-lg mb-1">🍈</div>
                <div className="font-medium text-sm">{t('regen_ag_orchard_fig')}</div>
                <div className="text-xs text-gray-400">~320 trees</div>
                <div className="text-xs text-accent mt-1">→ ~800 kg dried/yr</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-lg mb-1">🥜</div>
                <div className="font-medium text-sm">{t('regen_ag_orchard_carob')}</div>
                <div className="text-xs text-gray-400">~200 trees</div>
                <div className="text-xs text-accent mt-1">→ ~3,400 kg/yr</div>
              </div>
              <div className="p-4 text-center col-span-2 md:col-span-1">
                <div className="text-lg mb-1">🌳</div>
                <div className="font-medium text-sm">{t('regen_ag_orchard_walnut')}</div>
                <div className="text-xs text-gray-400">~240 trees</div>
                <div className="text-xs text-accent mt-1">→ ~4,800 kg/yr</div>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-xs text-center">
            {t('regen_ag_orchard_distribution_desc')} {t('regen_ag_orchard_self_sufficiency_note')}
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Heading level={2} className="mb-4 text-3xl text-center">
            {t('regen_ag_veggie_title')}
          </Heading>
          <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
            {t('regen_ag_veggie_intro')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">40</div>
              <div className="text-xs text-gray-500">{t('regen_ag_veggie_beds')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">~30</div>
              <div className="text-xs text-gray-500">{t('regen_ag_veggie_people')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">~20%</div>
              <div className="text-xs text-gray-500">{t('regen_ag_veggie_self_sufficiency')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">80%</div>
              <div className="text-xs text-gray-500">{t('regen_ag_veggie_target_2027')}</div>
            </div>
          </div>

          <p className="text-gray-500 text-xs text-center max-w-xl mx-auto">
            {t('regen_ag_veggie_method')}
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <Heading level={2} className="mb-8 text-3xl text-center">
            {t('regen_ag_cycles_title')}
          </Heading>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="border border-gray-200 rounded-xl p-6 bg-white">
              <Heading level={3} className="mb-3 text-lg">{t('regen_ag_chicken_title')}</Heading>
              <p className="text-gray-600 text-sm mb-4">{t('regen_ag_chicken_desc')}</p>
              <div className="flex gap-4 mb-3">
                <div>
                  <span className="text-xl font-bold text-gray-900">12</span>
                  <span className="text-xs text-gray-500 ml-1">{t('regen_ag_chicken_count')}</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">~10</span>
                  <span className="text-xs text-gray-500 ml-1">{t('regen_ag_eggs_daily')}</span>
                </div>
              </div>
              <p className="text-xs text-accent">{t('regen_ag_eggs_target')}</p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 bg-white">
              <Heading level={3} className="mb-3 text-lg">{t('regen_ag_worm_title')}</Heading>
              <p className="text-gray-600 text-sm mb-4">{t('regen_ag_worm_desc')}</p>
              <p className="text-xs text-gray-500">{t('regen_ag_worm_use')}</p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <Heading level={3} className="text-lg">{t('regen_ag_biochar_title')}</Heading>
              </div>
              <p className="text-gray-600 text-sm mb-4">{t('regen_ag_biochar_desc')}</p>
              <div className="flex gap-4">
                <div>
                  <span className="text-xl font-bold text-gray-900">50kW</span>
                  <span className="text-xs text-gray-500 ml-1">{t('regen_ag_biochar_heat')}</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">~30m³</span>
                  <span className="text-xs text-gray-500 ml-1">{t('regen_ag_biochar_annual')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{t('regen_ag_biochar_timeline')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-accent-light to-accent-alt-light">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heading level={2} className="mb-6 text-3xl">
            {t('regen_ag_impact_title')}
          </Heading>
          <p className="text-lg text-gray-800 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('regen_ag_impact_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton href="/pages/ecology" variant="primary">
              {t('regen_ag_cta_ecology')}
            </LinkButton>
            <LinkButton href="/dataroom" variant="secondary">
              {t('regen_ag_cta_impact')}
            </LinkButton>
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
