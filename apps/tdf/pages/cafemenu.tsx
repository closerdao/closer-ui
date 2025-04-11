import Head from 'next/head';

import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

const ArtFaire = () => {
  return (
    <>
      <Head>
        <title>
          Abela Art Faire - a regenerative art faire in the Traditional Dream
          Factory, Abela, Portugal.
        </title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="-mt-4 max-w-6xl mx-auto py-6">

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase mb-6">CAFÉ MENU</h1>

        <div className="mb-16 text-gray-600 text-lg">
          Enjoy our selection of beverages in the heart of our regenerative village. All donations support our community&apos;s mission.
        </div>
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=6000" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Custom payment</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">??€</div>
              </div>
            </a>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Coffee & Tea</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=250" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Kombucha</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">2.50€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=250" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Cappuccino</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">2.50€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=300" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Flat White</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">3.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=350" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Latte</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">3.50€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=150" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Espresso</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">1.50€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=200" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Double Espresso</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">2.00€</div>
              </div>
            </a>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Drinks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=200" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Beer</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">2.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=400" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Rose</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">4.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=450" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Orange Wine</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">4.50€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=400" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Soleira - Light Red</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">4.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=300" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">White Wine</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">3.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=350" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">G&T - Single</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">3.50€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=500" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">G&T - Double</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">5.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=500" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Mezcal 50ml</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">5.00€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1700" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Organge wine bottle</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">17€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1300" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Rose wine bottle</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">13€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1600" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Soleira - Red wine bottle</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">16€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1100" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Vale das Eguas - Red wine bottle</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">11€</div>
              </div>
            </a>
            <a href="https://buy.stripe.com/cN2cPH24AfTJbMQ6ov?__prefilled_amount=1100" className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center relative overflow-hidden hover:border-pink-200">
                <div className="pink-gradient h-1 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="font-semibold text-xl text-gray-800 mb-2">Vale das Eguas - White wine bottle</div>
                <div className="inline-block bg-pink-50 text-pink-500 px-4 py-1 rounded-full font-medium">11€</div>
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
