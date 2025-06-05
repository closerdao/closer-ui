import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const t = useTranslations();
  return (
    <div>
      <Head>
        <title>{t('playground_title')}</title>
        <meta name="description" content={t('playground_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section>
        <div className="max-w-6xl mx-auto w-full px-4 md:h-full py-32 text-xl md:text-2xl">
          <div className="max-w-prose">
            <Heading
              className="text-3xl sm:text-4xl md:text-5xl mb-6"
              data-testid="page-title"
              display
              level={1}
            >
              {t('playground_heading')}
            </Heading>
            <p className="mb-4">{t('playground_intro_1')}</p>
            <p className="mb-4">{t('playground_intro_2')}</p>
            <p className="mb-4">{t('playground_intro_3')}</p>
            <p className="mb-4">{t('playground_intro_4')}</p>
            <p className="mb-4">{t('playground_intro_5')}</p>
            <p className="mb-4">{t('playground_intro_6')}</p>
            <p className="mb-4">{t('playground_intro_7')}</p>
            <p className="mb-4">
              {' '}
              {t.rich('playground_intro_8', {
                strong: (chunks) => <b>{chunks}</b>,
              })}
            </p>
            <p className="mb-8">{t('playground_intro_9')}</p>
          </div>
          <div className="flex justify-start flex-col md:flex-row align-center mt-12 text-center">
            <Link
              href="/stay"
              className="bg-accent text-white rounded-full py-2.5 px-8 text-2xl"
              onClick={() =>
                event('click', {
                  category: 'HomePage',
                  label: t('playground_play_label'),
                })
              }
            >
              {t('playground_play_cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
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

export default HomePage;
