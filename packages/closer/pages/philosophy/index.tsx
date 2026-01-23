import Head from 'next/head';
import Link from 'next/link';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../../components/ui/Heading';

import { loadLocaleData } from '../../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const PhilosophyIndexPage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Philosophy — Closer',
    description: 'Explore the philosophical foundations behind Closer: commons governance, exclosures, digital commons, and building shared abundance for regenerative communities.',
    url: `${SITE_URL}/philosophy`,
    publisher: {
      '@type': 'Organization',
      name: 'Closer',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, url: `${SITE_URL}/philosophy/commons-governance` },
        { '@type': 'ListItem', position: 2, url: `${SITE_URL}/philosophy/tragedy-myth` },
        { '@type': 'ListItem', position: 3, url: `${SITE_URL}/philosophy/commons-exclosure` },
        { '@type': 'ListItem', position: 4, url: `${SITE_URL}/philosophy/digital-commons` },
        { '@type': 'ListItem', position: 5, url: `${SITE_URL}/philosophy/shared-abundance` },
      ],
    },
  };

  const topics = [
    {
      slug: 'commons-governance',
      title: t('philosophy_commons_governance_title'),
      description: t('philosophy_commons_governance_description'),
      icon: '⚖️',
    },
    {
      slug: 'tragedy-myth',
      title: t('philosophy_tragedy_myth_title'),
      description: t('philosophy_tragedy_myth_description'),
      icon: '🔍',
    },
    {
      slug: 'commons-exclosure',
      title: t('philosophy_commons_exclosure_title'),
      description: t('philosophy_commons_exclosure_description'),
      icon: '🛡️',
    },
    {
      slug: 'digital-commons',
      title: t('philosophy_digital_commons_title'),
      description: t('philosophy_digital_commons_description'),
      icon: '🌐',
    },
    {
      slug: 'shared-abundance',
      title: t('philosophy_shared_abundance_title'),
      description: t('philosophy_shared_abundance_description'),
      icon: '🌱',
    },
  ];

  return (
    <>
      <Head>
        <title>Philosophy — Closer | Commons Governance for Regenerative Communities</title>
        <meta name="description" content="Explore the philosophical foundations behind Closer: commons governance based on Elinor Ostrom's research, exclosures that protect communities, and building shared abundance." />
        <meta name="keywords" content="commons governance, Elinor Ostrom, tragedy of the commons, exclosure, digital commons, regenerative communities, shared abundance, decentralized governance" />
        
        <meta property="og:title" content="Philosophy — Closer" />
        <meta property="og:description" content="Explore the philosophical foundations behind Closer: commons governance, exclosures, and building shared abundance for regenerative communities." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/philosophy`} />
        <meta property="og:site_name" content="Closer" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Philosophy — Closer" />
        <meta name="twitter:description" content="Explore the philosophical foundations behind Closer: commons governance, exclosures, and building shared abundance." />
        
        <link rel="canonical" href={`${SITE_URL}/philosophy`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="w-full flex flex-col items-center gap-12 pb-20">
        <section className="flex flex-col items-center w-full max-w-[800px] gap-8 px-4">
          <Heading level={1} className="text-4xl text-center">
            {t('philosophy_title')}
          </Heading>

          <p className="text-lg text-center text-foreground/80 max-w-[600px]">
            {t('philosophy_intro')}
          </p>
        </section>

        <section className="w-full max-w-[800px] px-4">
          <div className="flex flex-col gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/philosophy/${topic.slug}`}
                className="group border border-divider rounded-xl p-6 hover:border-accent hover:bg-accent/5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{topic.icon}</span>
                  <div className="flex-1">
                    <Heading
                      level={2}
                      className="text-xl mb-2 group-hover:text-accent transition-colors"
                    >
                      {topic.title}
                    </Heading>
                    <p className="text-foreground/70">{topic.description}</p>
                  </div>
                  <span className="text-2xl text-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="w-full max-w-[800px] px-4 mt-8">
          <div className="bg-foreground/5 rounded-xl p-8 text-center">
            <Heading level={2} className="text-2xl mb-4">
              {t('philosophy_cta_title')}
            </Heading>
            <p className="text-foreground/70 mb-6 max-w-[500px] mx-auto">
              {t('philosophy_cta_description')}
            </p>
            <Link href="/subscriptions" className="btn-primary px-8 py-3">
              {t('philosophy_cta_button')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default PhilosophyIndexPage;

PhilosophyIndexPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return { messages };
  } catch (err) {
    return { error: err, messages: null };
  }
};
