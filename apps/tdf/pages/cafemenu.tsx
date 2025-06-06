import Head from 'next/head';

import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const ArtFaire = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('cafemenu_title')}</title>
        <meta name="description" content={t('cafemenu_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="-mt-4 max-w-6xl mx-auto py-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase mb-6">
          {t('cafemenu_heading')}
        </h1>
        <div className="mb-16 text-gray-600 text-lg">{t('cafemenu_intro')}</div>
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            {t('cafemenu_general_heading')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=6000"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_custom_payment')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  ??€
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            {t('cafemenu_coffee_tea_heading')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=250"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_kombucha')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  2.50€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=250"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_cappuccino')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  2.50€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=300"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_flat_white')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  3.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=350"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_latte')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  3.50€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=150"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_espresso')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  1.50€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=200"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_double_espresso')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  2.00€
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            {t('cafemenu_drinks_heading')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=200"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_beer')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  2.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=400"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_rose')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  4.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=450"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_orange_wine')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  4.50€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=400"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_soleira_light_red')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  4.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=300"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_white_wine')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  3.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=350"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_g_t_single')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  3.50€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=500"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_g_t_double')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  5.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=500"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_mezcal_50ml')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  5.00€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1700"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_organge_wine_bottle')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  17€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1300"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_rose_wine_bottle')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  13€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1600"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_soleira_red_wine_bottle')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  16€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1100"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_vale_das_eguas_red_wine_bottle')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  11€
                </div>
              </div>
            </a>
            <a
              href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1100"
              className="block group"
            >
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">
                  {t('cafemenu_vale_das_eguas_white_wine_bottle')}
                </div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">
                  11€
                </div>
              </div>
            </a>
          </div>
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
