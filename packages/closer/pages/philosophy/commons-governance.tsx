import Head from 'next/head';
import Link from 'next/link';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../../components/ui/Heading';

import { loadLocaleData } from '../../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const CommonsGovernancePage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: "Ostrom's Eight Principles for Commons Governance",
    description: 'Nobel Prize-winning research documented 800+ cases of successful commons governance spanning centuries. Learn the eight design principles that make commons work.',
    author: {
      '@type': 'Organization',
      name: 'Closer',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Closer',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/philosophy/commons-governance`,
    keywords: 'Elinor Ostrom, commons governance, design principles, collective action, community governance, decentralized governance',
  };

  const principles = [
    {
      number: 1,
      title: 'Clearly Defined Boundaries',
      description:
        'Between users and non-users, and around the resource itself. Communities must know who has rights and what is being governed.',
    },
    {
      number: 2,
      title: 'Congruence with Local Conditions',
      description:
        'Rules must fit local ecological and social conditions. What works in Swiss alpine villages differs from Balinese rice terraces.',
    },
    {
      number: 3,
      title: 'Collective-Choice Arrangements',
      description:
        'Those affected by rules must be able to participate in modifying them. Governance without voice becomes imposition.',
    },
    {
      number: 4,
      title: 'Monitoring',
      description:
        'People accountable to the community must observe resource conditions and user behavior. Transparency enables trust.',
    },
    {
      number: 5,
      title: 'Graduated Sanctions',
      description:
        'Penalties proportional to violation severity. First infractions warrant warnings; repeated violations escalate consequences.',
    },
    {
      number: 6,
      title: 'Conflict Resolution',
      description:
        'Low-cost, accessible mechanisms for resolving disputes locally. Justice delayed is justice denied.',
    },
    {
      number: 7,
      title: 'Recognized Autonomy',
      description:
        'External authorities must respect community self-governance. Top-down interference undermines local accountability.',
    },
    {
      number: 8,
      title: 'Nested Enterprises',
      description:
        'Larger-scale commons require multi-level coordination. Governance at appropriate scales without losing local agency.',
    },
  ];

  return (
    <>
      <Head>
        <title>Ostrom&apos;s Eight Principles — Commons Governance | Closer</title>
        <meta
          name="description"
          content="Nobel Prize-winning research documented 800+ cases of successful commons governance spanning centuries. Learn the eight design principles that make commons work."
        />
        <meta name="keywords" content="Elinor Ostrom, commons governance, eight principles, collective action, community governance, decentralized governance, shared resources" />
        
        <meta property="og:title" content="Ostrom's Eight Principles — Commons Governance" />
        <meta property="og:description" content="Nobel Prize-winning research documented 800+ cases of successful commons governance spanning centuries." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/philosophy/commons-governance`} />
        <meta property="og:site_name" content="Closer" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ostrom's Eight Principles — Commons Governance" />
        <meta name="twitter:description" content="Nobel Prize-winning research documented 800+ cases of successful commons governance spanning centuries." />
        
        <link rel="canonical" href={`${SITE_URL}/philosophy/commons-governance`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="w-full flex flex-col items-center gap-12 pb-20">
        <section className="flex flex-col items-center w-full max-w-[700px] gap-8 px-4">
          <Link
            href="/philosophy"
            className="self-start uppercase text-accent font-bold"
          >
            ◀️ {t('philosophy_back')}
          </Link>

          <Heading level={1} className="text-4xl text-center">
            {t('philosophy_commons_governance_title')}
          </Heading>

          <p className="text-lg text-center text-foreground/80">
            {t('philosophy_commons_governance_subtitle')}
          </p>
        </section>

        <section className="w-full max-w-[700px] px-4">
          <div className="rich-text mb-12">
            <p className="text-lg leading-relaxed mb-6">
              Elinor Ostrom, the first woman awarded the Nobel Prize in
              Economics (2009), compiled decades of field research across 800+
              cases of actual commons governance. Where theorists reasoned from
              hypotheticals, Ostrom documented institutions that successfully
              managed shared resources for centuries—often millennia.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Her central finding was that humans possess &ldquo;a much more
              complex motivational structure&rdquo; than purely self-interested
              actors. People regularly transcend narrow self-interest through
              trust, reciprocity, and locally-crafted norms—when institutional
              conditions support cooperation.
            </p>
            <p className="text-lg leading-relaxed">
              From Swiss alpine villages governing meadows since 1483, to the
              Valencia Water Tribunal operating since 960 CE, to 59,209 Japanese
              forest commons—Ostrom distilled eight design principles that
              characterize successful commons:
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {principles.map((principle) => (
              <div
                key={principle.number}
                className="border border-divider rounded-lg p-6 hover:border-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-bold text-accent">
                    {principle.number}
                  </span>
                  <div>
                    <Heading level={3} className="text-xl mb-2">
                      {principle.title}
                    </Heading>
                    <p className="text-foreground/80">{principle.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rich-text mt-12">
            <p className="text-lg leading-relaxed mb-6">
              Commons succeed not through naive communalism but through
              sophisticated governance architecture evolved over generations.
              These principles are not abstract ideals—they are practical
              patterns documented across cultures and centuries.
            </p>
            <p className="text-lg leading-relaxed">
              At Closer, we encode these principles into our governance
              structures: clear membership boundaries, participatory
              decision-making, transparent monitoring, and conflict resolution
              mechanisms. The digital age adds the capacity to make these
              patterns portable, auditable, and composable across communities
              worldwide.
            </p>
          </div>
        </section>

        <section className="w-full max-w-[700px] px-4 pt-8 border-t border-divider">
          <Heading level={2} className="text-2xl mb-6">
            {t('philosophy_explore_more')}
          </Heading>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/philosophy/tragedy-myth"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_tragedy_myth_title')}
            </Link>
            <Link
              href="/philosophy/commons-exclosure"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_commons_exclosure_title')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default CommonsGovernancePage;

CommonsGovernancePage.getInitialProps = async (context: NextPageContext) => {
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
