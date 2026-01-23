import Head from 'next/head';
import Link from 'next/link';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../../components/ui/Heading';

import { loadLocaleData } from '../../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const SharedAbundancePage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Building Shared Abundance',
    description: 'From Swiss alpine villages to Balinese rice terraces, communities have governed shared resources for centuries. Now we build the exclosures that protect them.',
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
    mainEntityOfPage: `${SITE_URL}/philosophy/shared-abundance`,
    keywords: 'shared abundance, regenerative communities, commons success, Swiss commons, Valencia Water Tribunal, community governance',
  };

  const successStories = [
    {
      title: 'Swiss Alpine Commons',
      years: '700+',
      description:
        'Village communities governing alpine meadows, forests, and irrigation—continuously operating since at least the 1300s.',
    },
    {
      title: 'Valencia Water Tribunal',
      years: '1,000+',
      description:
        'Eight canal communities managing irrigation, meeting every Thursday at noon since approximately 960 CE.',
    },
    {
      title: 'Japanese Forest Commons',
      years: '400+',
      description:
        '59,209 community-based organizations managing customary forests since the Edo period.',
    },
    {
      title: 'Balinese Subak System',
      years: '1,000+',
      description:
        '1,559 associations coordinating rice cultivation through water temples since the 9th century.',
    },
  ];

  const outcomes = [
    {
      metric: '17-26%',
      description: 'Lower deforestation on indigenous lands vs non-protected areas',
      source: 'Nature Sustainability, 2021',
    },
    {
      metric: '90%',
      description: 'Of Amazon deforestation occurred outside indigenous territories',
      source: 'FAO/FILAC, 2021',
    },
    {
      metric: '26% → 45%',
      description: 'Nepal forest cover after community management (1992-2016)',
      source: 'NASA-funded Landsat research',
    },
    {
      metric: '100%',
      description: 'Foreclosure prevention by Portland Proud Ground CLT over 26 years',
      source: 'CLT research, 2022',
    },
  ];

  return (
    <>
      <Head>
        <title>Building Shared Abundance | Closer Philosophy</title>
        <meta
          name="description"
          content="From Swiss alpine villages to Balinese rice terraces, communities have governed shared resources for centuries. Now we build the exclosures that protect them."
        />
        <meta name="keywords" content="shared abundance, regenerative communities, commons success, Swiss commons, Valencia Water Tribunal, community governance, exclosures" />
        
        <meta property="og:title" content="Building Shared Abundance" />
        <meta property="og:description" content="From Swiss alpine villages to Balinese rice terraces, communities have governed shared resources for centuries." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/philosophy/shared-abundance`} />
        <meta property="og:site_name" content="Closer" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Building Shared Abundance" />
        <meta name="twitter:description" content="From Swiss alpine villages to Balinese rice terraces, communities have governed shared resources for centuries." />
        
        <link rel="canonical" href={`${SITE_URL}/philosophy/shared-abundance`} />
        
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
            {t('philosophy_shared_abundance_title')}
          </Heading>

          <p className="text-lg text-center text-foreground/80">
            {t('philosophy_shared_abundance_subtitle')}
          </p>
        </section>

        <section className="w-full max-w-[700px] px-4">
          <div className="rich-text">
            <Heading level={2} className="text-2xl mb-4">
              Centuries of Success
            </Heading>
            <p className="text-lg leading-relaxed mb-8">
              The evidence assembled refutes any claim that commons governance
              cannot function at scale or in modern contexts. Across
              civilizations, commons have operated successfully for
              centuries—often millennia—when institutional conditions support
              cooperation.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              {successStories.map((story, index) => (
                <div
                  key={index}
                  className="border border-divider rounded-lg p-5 hover:border-accent transition-colors"
                >
                  <p className="text-3xl font-bold text-accent mb-1">
                    {story.years}
                  </p>
                  <p className="text-xs text-foreground/50 uppercase tracking-wide mb-2">
                    years
                  </p>
                  <Heading level={3} className="text-lg mb-2">
                    {story.title}
                  </Heading>
                  <p className="text-sm text-foreground/70">
                    {story.description}
                  </p>
                </div>
              ))}
            </div>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Measurable Outcomes
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Modern empirical research enables systematic comparison between
              commons-managed, state-managed, and privately-managed
              resources—and the results consistently favor community governance.
            </p>

            <div className="space-y-4 mb-12">
              {outcomes.map((outcome, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-foreground/5 rounded-lg p-4"
                >
                  <span className="text-2xl font-bold text-accent min-w-[100px]">
                    {outcome.metric}
                  </span>
                  <div>
                    <p className="text-foreground">{outcome.description}</p>
                    <p className="text-xs text-foreground/50">{outcome.source}</p>
                  </div>
                </div>
              ))}
            </div>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              The Path Forward
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              What the evidence shows is that humans have repeatedly
              demonstrated capacity for sophisticated collective governance of
              shared resources—and that this capacity was systematically
              attacked, not organically abandoned.
            </p>

            <div className="bg-accent/10 border-l-4 border-accent p-6 my-8">
              <p className="text-lg">
                The contemporary opportunity is to rebuild that capacity with
                modern tools: cryptographic verification, programmable
                governance, transparent accounting, and composable institutional
                design.
              </p>
            </div>

            <p className="text-lg leading-relaxed mb-6">
              Ostrom&apos;s design principles—clearly defined boundaries,
              collective-choice arrangements, monitoring, graduated sanctions,
              conflict resolution mechanisms—are not abstract ideals but
              practical patterns that have governed resources across cultures
              and centuries.
            </p>

            <p className="text-lg leading-relaxed mb-6">
              What the digital age adds is the capacity to encode these
              principles in software, making them portable, auditable, and
              composable. A community in Portugal can adopt governance
              primitives tested in Kenya; a forest commons in Japan can share
              monitoring protocols with watershed stewards in California.
            </p>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              The Real Question
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Every sector facing automation, every ecosystem under extraction
              pressure, every community watching wealth drain to distant owners
              confronts the same structural question: will productive capacity
              concentrate further, or will we build the governance
              infrastructure for shared abundance?
            </p>

            <p className="text-lg leading-relaxed mb-6">
              The choice is not between efficiency and equity—commons governance
              has repeatedly demonstrated that distributed stewardship can match
              or exceed centralized management while distributing benefits more
              broadly.
            </p>

            <div className="bg-complimentary/10 rounded-lg p-8 my-10 text-center">
              <p className="text-2xl font-medium mb-4">
                The question is not whether commons can work at scale.
              </p>
              <p className="text-2xl font-bold text-accent">
                The question is whether we will build the exclosures that
                protect them.
              </p>
            </div>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Building Together
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              At Closer, we are building the infrastructure for shared
              abundance. Our regenerative villages unite technology, community,
              and nature through:
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex gap-3">
                <span className="text-accent font-bold text-xl">→</span>
                <span className="text-lg">
                  <strong>Web3 governance</strong> encoding Ostrom&apos;s
                  principles into transparent, participatory systems
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold text-xl">→</span>
                <span className="text-lg">
                  <strong>Token-based membership</strong> creating clear
                  boundaries while enabling global participation
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold text-xl">→</span>
                <span className="text-lg">
                  <strong>Regenerative land stewardship</strong> protecting
                  ecosystems from extractive pressures
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold text-xl">→</span>
                <span className="text-lg">
                  <strong>Community ownership models</strong> where benefits
                  circulate among participants
                </span>
              </li>
            </ul>

            <p className="text-lg leading-relaxed">
              The infrastructure for scaling self-governance now exists. Join us
              in building commons exclosures that protect communities and
              ecosystems—creating abundance rather than scarcity.
            </p>
          </div>
        </section>

        <section className="w-full max-w-[700px] px-4 pt-8 border-t border-divider">
          <Heading level={2} className="text-2xl mb-6">
            {t('philosophy_explore_more')}
          </Heading>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/philosophy/commons-governance"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_commons_governance_title')}
            </Link>
            <Link
              href="/philosophy/tragedy-myth"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_tragedy_myth_title')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default SharedAbundancePage;

SharedAbundancePage.getInitialProps = async (context: NextPageContext) => {
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
