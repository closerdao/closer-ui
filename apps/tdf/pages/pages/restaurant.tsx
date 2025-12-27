import Head from 'next/head';

import { Heading, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { ChefHat, UtensilsCrossed, Leaf, Users, Coffee, Sprout, Circle, Droplet, Apple } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const RestaurantPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('restaurant_page_title')}</title>
        <meta
          name="description"
          content={t('restaurant_page_description')}
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/pages/restaurant"
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
              {t('restaurant_hero_title')}
            </Heading>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto leading-relaxed mb-12">
              {t('restaurant_hero_subtitle')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">30</div>
                <div className="text-xs text-gray-600">{t('restaurant_metric_seats')}</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">100+</div>
                <div className="text-xs text-gray-600">{t('restaurant_metric_meals')}</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 col-span-2 md:col-span-1">
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">50km</div>
                <div className="text-xs text-gray-600">{t('restaurant_metric_radius')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Heading level={2} className="mb-6 text-3xl">
              {t('restaurant_vision_title')}
            </Heading>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              {t('restaurant_vision_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 border border-gray-200 rounded-xl">
              <ChefHat className="w-8 h-8 text-accent mb-4" />
              <Heading level={3} className="mb-3 text-lg">
                {t('restaurant_feature_throughput_title')}
              </Heading>
              <p className="text-gray-600 text-sm">
                {t('restaurant_feature_throughput_desc')}
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <Leaf className="w-8 h-8 text-accent mb-4" />
              <Heading level={3} className="mb-3 text-lg">
                {t('restaurant_feature_vegetarian_title')}
              </Heading>
              <p className="text-gray-600 text-sm">
                {t('restaurant_feature_vegetarian_desc')}
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <Users className="w-8 h-8 text-accent mb-4" />
              <Heading level={3} className="mb-3 text-lg">
                {t('restaurant_feature_community_title')}
              </Heading>
              <p className="text-gray-600 text-sm">
                {t('restaurant_feature_community_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Heading level={2} className="mb-6 text-3xl text-center">
              {t('restaurant_timeline_title')}
            </Heading>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">Mid 2026</div>
                  <div className="text-sm text-gray-600">{t('restaurant_timeline_test_run')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">2027</div>
                  <div className="text-sm text-gray-600">{t('restaurant_timeline_full_operation')}</div>
                </div>
              </div>
            </div>
            <Heading level={3} className="mb-4 text-2xl text-center">
              {t('restaurant_business_model_title')}
            </Heading>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {t('restaurant_business_model_desc')}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-gray-900 mb-2">~100</div>
                <div className="text-sm text-gray-600 mb-3">{t('restaurant_business_inhabitants')}</div>
                <p className="text-sm text-gray-700">
                  {t('restaurant_business_primary_demand')}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-accent mb-2">✓</div>
                <div className="text-sm text-gray-600 mb-3">{t('restaurant_business_external_capacity')}</div>
                <p className="text-sm text-gray-700">
                  {t('restaurant_business_derisk')}
                </p>
              </div>
            </div>
            <div className="mt-6 bg-accent-light/20 rounded-xl p-6 border border-accent/20">
              <p className="text-sm text-gray-700">
                {t('restaurant_business_cost_reduction')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <Heading level={2} className="mb-4 text-3xl text-center">
            {t('restaurant_sourcing_title')}
          </Heading>
          <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
            {t('restaurant_sourcing_intro')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Sprout className="w-8 h-8 text-accent" />
              </div>
              <div className="font-medium text-sm">{t('restaurant_source_mushrooms')}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Leaf className="w-8 h-8 text-accent" />
              </div>
              <div className="font-medium text-sm">{t('restaurant_source_veggies')}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Circle className="w-8 h-8 text-accent" />
              </div>
              <div className="font-medium text-sm">{t('restaurant_source_eggs')}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Droplet className="w-8 h-8 text-accent" />
              </div>
              <div className="font-medium text-sm">{t('restaurant_source_olive_oil')}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Apple className="w-8 h-8 text-accent" />
              </div>
              <div className="font-medium text-sm">{t('restaurant_source_fruits')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Heading level={2} className="mb-6 text-3xl text-center">
              {t('restaurant_philosophy_title')}
            </Heading>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {t('restaurant_philosophy_desc')}
            </p>
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-accent">
              <p className="text-gray-700 italic mb-4">
                {t('restaurant_philosophy_quote')}
              </p>
              <p className="text-sm text-gray-600">
                {t('restaurant_philosophy_inspiration')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Coffee className="w-8 h-8 text-accent" />
                <Heading level={2} className="text-3xl">
                  {t('restaurant_bakery_title')}
                </Heading>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('restaurant_bakery_desc')}
              </p>
              <p className="text-gray-600 text-sm">
                {t('restaurant_bakery_cafe_ovo')}
              </p>
            </div>
            <div>
            <img
                src="/images/landing/cafe-ovo.jpg"
                alt={t('restaurant_cafe_ovo_alt')}
                className="w-full h-auto rounded-xl shadow-md mb-4"
            />
            <div className="text-center">
                <p className="text-sm text-gray-700">
                {t('restaurant_cafe_ovo_desc')}
                </p>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-accent-light to-accent-alt-light">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heading level={2} className="mb-6 text-3xl">
            {t('restaurant_cta_title')}
          </Heading>
          <p className="text-lg text-gray-800 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('restaurant_cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton href="/pages/regenerative-agriculture" variant="primary">
              {t('restaurant_cta_agriculture')}
            </LinkButton>
            <LinkButton href="/stay" variant="secondary">
              {t('restaurant_cta_visit')}
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
};

RestaurantPage.getInitialProps = async (context: NextPageContext) => {
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

export default RestaurantPage;

