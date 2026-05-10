import Head from 'next/head';
import Link from 'next/link';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Heading, Webinar } from 'closer';
import { CalendarDays, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

const WebinarPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('webinar_page_hero_title')}</title>
        <meta name="description" content={t('webinar_page_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/webinar"
          key="canonical"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.traditionaldreamfactory.com/webinar"
        />
        <meta property="og:title" content={t('webinar_page_hero_title')} />
        <meta
          property="og:description"
          content={t('webinar_page_meta_description')}
        />
        <meta
          property="og:image"
          content="https://cdn.oasa.co/tdf/tdf-invest-og.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('webinar_page_hero_title')} />
        <meta
          name="twitter:description"
          content={t('webinar_page_meta_description')}
        />
        <meta
          name="twitter:image"
          content="https://cdn.oasa.co/tdf/tdf-invest-og.jpg"
        />
      </Head>

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-8 md:pt-12 md:pb-10">
          <div className="max-w-3xl text-center mx-auto">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
              {t('webinar_page_hero_label')}
            </p>
            <Heading
              display
              level={1}
              className="text-3xl md:text-5xl font-normal text-gray-900 tracking-tight mb-4"
            >
              {t('webinar_page_hero_title')}
            </Heading>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              {t('webinar_page_hero_subtitle')}
            </p>
          </div>
        </div>
      </section>

      <Webinar
        id="webinar-signup"
        tags={['webinar-page', 'ad-landing', 'investor-webinar']}
        analyticsCategory="WebinarPage"
      />

      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-10 md:py-14">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3">
              <CalendarDays className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-gray-900">
                {t('webinar_page_highlight_1_title')}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('webinar_page_highlight_1_desc')}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3">
              <Users className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-gray-900">
                {t('webinar_page_highlight_2_title')}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('webinar_page_highlight_2_desc')}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-gray-900">
                {t('webinar_page_highlight_3_title')}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('webinar_page_highlight_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="max-w-2xl mb-10">
            <Heading level={2} className="text-2xl md:text-3xl font-normal mb-5">
              {t('webinar_page_agenda_title')}
            </Heading>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm md:text-base text-gray-700">
                  {t('webinar_page_agenda_item_1')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm md:text-base text-gray-700">
                  {t('webinar_page_agenda_item_2')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm md:text-base text-gray-700">
                  {t('webinar_page_agenda_item_3')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm md:text-base text-gray-700">
                  {t('webinar_page_agenda_item_4')}
                </p>
              </div>
            </div>
          </div>
          <div className="max-w-2xl p-6 md:p-7 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {t('webinar_page_highlight_3_desc')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#webinar-signup"
                className="inline-flex items-center justify-center px-5 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors text-sm font-medium"
              >
                {t('webinar_page_hero_primary_cta')}
              </Link>
              <Link
                href="/fundraiser"
                className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 hover:border-gray-400 text-gray-800 rounded-lg transition-colors text-sm font-medium"
              >
                {t('webinar_page_hero_secondary_cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WebinarPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      
    },
  };
}
