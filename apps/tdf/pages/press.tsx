import Head from 'next/head';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const PressPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('press_page_title')}</title>
        <meta name="description" content={t('press_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/press"
          key="canonical"
        />
      </Head>

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-24 md:py-36">
            <div className="max-w-4xl mx-auto text-center">
              <Heading
                className="mb-6 text-5xl md:text-6xl lg:text-7xl font-normal text-gray-900 tracking-tight leading-tight"
                display
                level={1}
              >
                {t('press_page_title')}
              </Heading>
              <p className="text-xl md:text-2xl text-gray-700 mb-16 leading-relaxed max-w-3xl mx-auto font-light">
                {t('press_page_intro')}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
                <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                  <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">{t('press_stats_articles_count')}</div>
                  <div className="text-xs text-gray-600 font-light">{t('press_stats_articles_label')}</div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                  <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">{t('press_stats_portuguese_count')}</div>
                  <div className="text-xs text-gray-600 font-light">{t('press_stats_portuguese_label')}</div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                  <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">{t('press_stats_spanish_count')}</div>
                  <div className="text-xs text-gray-600 font-light">{t('press_stats_spanish_label')}</div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                  <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">{t('press_stats_podcasts_count')}</div>
                  <div className="text-xs text-gray-600 font-light">{t('press_stats_podcasts_label')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Publications */}
        <section className="bg-gray-50 py-16 md:py-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs uppercase tracking-wider text-gray-600 mb-12 font-semibold">{t('press_featured_in')}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center">
                <span className="text-base font-serif font-bold text-gray-900">Expresso</span>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center">
                <span className="text-base font-serif font-bold text-gray-900">Forbes Portugal</span>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center">
                <span className="text-base font-serif font-bold text-gray-900">Diário de Notícias</span>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center">
                <span className="text-base font-serif font-bold text-gray-900">Jornal Económico</span>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center">
                <span className="text-base font-serif font-bold text-gray-900">EFE Verde</span>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center">
                <span className="text-base font-serif font-bold text-gray-900">Idealista</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Quote */}
        <section className="bg-gray-50 py-16 md:py-24 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center">
              <blockquote className="font-serif text-2xl md:text-3xl text-gray-900 leading-relaxed mb-6 italic">
                {t('press_featured_quote')}
              </blockquote>
              <p className="text-sm text-gray-600">
                — {t('press_featured_quote_author')}, <a href="https://openhubnews.com/ee-sam-delesque-traditional-dream-factory-portugal-la-regeneracion-es-nuestra-estrella-polar-la-convivencia-crea-cultura-y-la-blockchain-proporciona-la-columna-vertebral-organizativa/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">{t('press_featured_quote_source')}</a>
              </p>
            </div>
          </div>
        </section>

        {/* Highlight Coverage */}
        <section className="bg-white py-24 md:py-32 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium text-center">
                {t('press_highlight_title')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <a href="https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a" target="_blank" rel="noopener noreferrer" className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">Expresso</span>
                  <span className="text-xs text-gray-400">June 26, 2025</span>
                </div>
                <h3 className="font-medium text-base text-gray-900 leading-relaxed">{t('press_highlight_expresso_title')}</h3>
              </a>

              <a href="https://www.forbespt.com/portugal-e-o-setimo-destino-favorito-dos-nomadas-digitais/" target="_blank" rel="noopener noreferrer" className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">Forbes Portugal</span>
                  <span className="text-xs text-gray-400">August 26, 2025</span>
                </div>
                <h3 className="font-medium text-base text-gray-900 leading-relaxed">{t('press_highlight_forbes_title')}</h3>
              </a>

              <a href="https://www.dn.pt/edicao-impressa/alentejo-v%C3%AA-nascer-primeira-aldeia-regenerativa-da-europa-financiada-com-tokens" target="_blank" rel="noopener noreferrer" className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">Diário de Notícias</span>
                  <span className="text-xs text-gray-400">August 24, 2025</span>
                </div>
                <h3 className="font-medium text-base text-gray-900 leading-relaxed">{t('press_highlight_dn_title')}</h3>
              </a>

              <a href="https://efeverde.com/regenerar-para-avanzar-el-futuro-del-campo-pasa-por-la-innovacion-social-y-ecologica-por-samuel-delesque-traditional-dream-factory-tdf/" target="_blank" rel="noopener noreferrer" className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">EFE Verde</span>
                  <span className="text-xs text-gray-400">September 21, 2025</span>
                </div>
                <h3 className="font-medium text-base text-gray-900 leading-relaxed">{t('press_highlight_efe_title')}</h3>
              </a>

              <a href="https://www.idealista.pt/news/imobiliario/habitacao/2025/12/18/73120-primeira-aldeia-regenerativa-tokenizada-da-europa-nasce-no-alentejo" target="_blank" rel="noopener noreferrer" className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">Idealista</span>
                  <span className="text-xs text-gray-400">December 18, 2025</span>
                </div>
                <h3 className="font-medium text-base text-gray-900 leading-relaxed">{t('press_highlight_idealista_title')}</h3>
              </a>

              <a href="https://jornaleconomico.sapo.pt/noticias/48-dos-portugueses-sonham-trocar-a-cidade-pelo-campo/" target="_blank" rel="noopener noreferrer" className="block p-6 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">Jornal Económico</span>
                  <span className="text-xs text-gray-400">2025</span>
                </div>
                <h3 className="font-medium text-base text-gray-900 leading-relaxed">{t('press_highlight_jornal_title')}</h3>
              </a>
            </div>
          </div>
        </section>

        {/* Podcasts Section */}
        <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium text-center">
                {t('press_podcasts_title')}
              </p>
              <p className="text-sm text-gray-700 text-center max-w-2xl mx-auto font-light">{t('press_podcasts_subtitle')}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <a href="https://podcasts.apple.com/gb/podcast/ep-322-sam-delesque-regenerative-entrepreneur-developing/id1265643891?i=1000595309300" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-medium text-gray-900 mb-2">{t('press_podcast_green_planet_title')}</p>
                <p className="text-sm text-gray-600 font-light">{t('press_podcast_green_planet_date')}</p>
              </a>
              <a href="https://blog.refidao.com/building-regenerative-villages-with-samuel-delesque-season-3-episode-8/" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-medium text-gray-900 mb-2">{t('press_podcast_refi_title')}</p>
                <p className="text-sm text-gray-600 font-light">{t('press_podcast_refi_date')}</p>
              </a>
              <a href="https://www.cryptoaltruism.org/blog/crypto-altruism-podcast-episode84-oasa-using-web3-to-build-for-a-regenerative-future" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-medium text-gray-900 mb-2">{t('press_podcast_crypto_altruism_title')}</p>
                <p className="text-sm text-gray-600 font-light">{t('press_podcast_crypto_altruism_date')}</p>
              </a>
              <a href="https://theblockchainsocialist.com/a-regenerative-village-as-a-dao-in-portugal-traditional-dream-factory/" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-medium text-gray-900 mb-2">{t('press_podcast_blockchain_socialist_title')}</p>
                <p className="text-sm text-gray-600 font-light">{t('press_podcast_blockchain_socialist_date')}</p>
              </a>
              <a href="https://thenewmvt.com/podcast/sam-delesque/" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-medium text-gray-900 mb-2">{t('press_podcast_strangers_title')}</p>
                <p className="text-sm text-gray-600 font-light">{t('press_podcast_strangers_date')}</p>
              </a>
              <a href="https://podcasts.apple.com/ng/podcast/from-ownership-to-stewardship-samuel-delesque-founder/id1591874552?i=1000540529193" target="_blank" rel="noopener noreferrer" className="block p-6 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-medium text-gray-900 mb-2">{t('press_podcast_primal_title')}</p>
                <p className="text-sm text-gray-600 font-light">{t('press_podcast_primal_date')}</p>
              </a>
            </div>
          </div>
        </section>

        {/* Press Contact */}
        <section className="bg-white py-24 md:py-32 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Heading level={2} className="mb-4 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">{t('press_contact_title')}</Heading>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed font-light">
              {t('press_contact_description')}
            </p>
            <a href="mailto:press@traditionaldreamfactory.com" className="text-accent hover:text-accent-dark font-medium">
              press@traditionaldreamfactory.com
            </a>
          </div>
        </section>
      </main>
    </>
  );
};

PressPage.getInitialProps = async (context: NextPageContext) => {
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

export default PressPage;
