import Head from 'next/head';
import Link from 'next/link';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../../components/ui/Heading';

import { loadLocaleData } from '../../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const CommonsExclosurePage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Commons Exclosure: Inverting the Enclosure',
    description: 'Where historical enclosure fenced communities out, exclosure fences extractive forces out—creating protected spaces for community stewardship.',
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
    mainEntityOfPage: `${SITE_URL}/philosophy/commons-exclosure`,
    keywords: 'commons exclosure, enclosure, land commons, community stewardship, regenerative communities, Ethiopia exclosures',
  };

  return (
    <>
      <Head>
        <title>Commons Exclosure — Inverting the Enclosure | Closer</title>
        <meta
          name="description"
          content="Where historical enclosure fenced communities out, exclosure fences extractive forces out—creating protected spaces for community stewardship and regeneration."
        />
        <meta name="keywords" content="commons exclosure, enclosure history, land commons, community stewardship, regenerative communities, Ethiopia exclosures, commons governance" />
        
        <meta property="og:title" content="Commons Exclosure — Inverting the Enclosure" />
        <meta property="og:description" content="Where historical enclosure fenced communities out, exclosure fences extractive forces out—creating protected spaces for community stewardship." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/philosophy/commons-exclosure`} />
        <meta property="og:site_name" content="Closer" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Commons Exclosure — Inverting the Enclosure" />
        <meta name="twitter:description" content="Where historical enclosure fenced communities out, exclosure fences extractive forces out." />
        
        <link rel="canonical" href={`${SITE_URL}/philosophy/commons-exclosure`} />
        
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
            {t('philosophy_commons_exclosure_title')}
          </Heading>

          <p className="text-lg text-center text-foreground/80">
            {t('philosophy_commons_exclosure_subtitle')}
          </p>
        </section>

        <section className="w-full max-w-[700px] px-4">
          <div className="rich-text">
            <Heading level={2} className="text-2xl mb-4">
              Inverting the Logic of Enclosure
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Historical enclosure—the process by which common lands were fenced
              off and privatized, particularly in England from the 15th through
              19th centuries—concentrated wealth by fencing resources{' '}
              <em>out</em> of collective access and into private hands.
            </p>

            <p className="text-lg leading-relaxed mb-6">
              The term <strong>&ldquo;commons exclosure&rdquo;</strong> inverts
              this logic entirely.
            </p>

            <div className="bg-accent/10 border-l-4 border-accent p-6 my-8">
              <p className="text-xl font-medium">
                Where enclosure fences communities <em>out</em>, exclosure
                fences extractive forces <em>out</em>—creating protected spaces
                where self-governed communities can steward shared assets for
                collective benefit rather than private accumulation.
              </p>
            </div>

            <p className="text-lg leading-relaxed mb-6">
              The boundary exists not to exclude commoners but to exclude the
              market pressures, speculative capital, and short-term profit
              imperatives that would otherwise drain value from community and
              ecosystem alike.
            </p>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Evidence from Ethiopia
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              The concept of commons exclosure is not speculative—it has been
              tested at scale. In Tigray, Northern Ethiopia, communities have
              established exclosures on formerly degraded grazing lands since
              the 1980s, closing areas to wood cutting and livestock grazing to
              promote natural regeneration.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-foreground/5 rounded-lg p-6">
                <p className="text-4xl font-bold text-accent mb-2">143,000</p>
                <p className="text-sm text-foreground/70">
                  hectares under exclosure in 1996
                </p>
              </div>
              <div className="bg-foreground/5 rounded-lg p-6">
                <p className="text-4xl font-bold text-accent mb-2">895,220</p>
                <p className="text-sm text-foreground/70">
                  hectares by 2011—a 6x expansion
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed mb-6">
              Crucially, these were governed not by state mandate but by village
              bylaws (&ldquo;Serit&rdquo;) devised and enforced by users
              themselves.
            </p>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Top-Down vs. Bottom-Up Governance
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              The Ethiopian case offers a natural experiment in governance
              design:
            </p>

            <div className="space-y-6 mb-8">
              <div className="border border-red-300 bg-red-50 dark:bg-red-950/30 rounded-lg p-6">
                <Heading level={3} className="text-lg mb-2 text-red-700 dark:text-red-400">
                  Derg Military Regime (1974–1991)
                </Heading>
                <p className="text-foreground/80">
                  Exclosures established through top-down authoritarian
                  approaches that disregarded local communities&apos; views.
                  Result: most exclosures established during 1985–1990 were
                  &ldquo;harvested or destroyed by 1995.&rdquo;
                </p>
              </div>

              <div className="border border-green-300 bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
                <Heading level={3} className="text-lg mb-2 text-green-700 dark:text-green-400">
                  Community Governance (Post-1991)
                </Heading>
                <p className="text-foreground/80">
                  Participatory management with locally devised bylaws,
                  democratic decision-making through public meetings, and
                  graduated sanctions enforced by community-appointed guards.
                  Result: exclosures not only survived but expanded six-fold.
                </p>
              </div>
            </div>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              The Architectural Insight
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              The key insight is architectural: profit maximization concentrates
              wealth precisely because it lacks accountability boundaries.
              Capital flows to wherever returns are highest, extracting value
              from communities and ecosystems without obligation to either.
            </p>

            <div className="bg-complimentary/10 border-l-4 border-complimentary p-6 my-8">
              <p className="text-lg">
                Commons exclosures introduce the boundaries that enable wealth
                to circulate <em>within</em> communities, building resilience
                and shared prosperity rather than draining localities to enrich
                global capital pools.
              </p>
            </div>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Digital Exclosures
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Regenerative land commons, community land trusts, and tokenized
              stewardship models are demonstrating that when communities
              establish clear boundaries, governance rules, and membership
              pathways, they can protect resources from market pressures while
              generating surplus that flows to participants rather than distant
              shareholders.
            </p>

            <p className="text-lg leading-relaxed mb-6">
              The Ethiopian exclosures regenerated degraded landscapes by
              keeping extractive pressures out. Digital commons exclosures can
              do the same for economic value—creating protected spaces where:
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Communities govern shared resources according to rules they
                  themselves devise
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Benefits circulate among participants rather than flowing to
                  external shareholders
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  The boundary between inside and outside is maintained through
                  cryptographic membership and transparent governance protocols
                </span>
              </li>
            </ul>

            <div className="bg-foreground/5 rounded-lg p-6 mt-10">
              <Heading level={3} className="text-xl mb-3">
                Closer&apos;s Approach
              </Heading>
              <p className="text-lg leading-relaxed">
                At Closer, we build digital exclosures around regenerative
                communities. Token holders have stakes but within governance
                structures that embed ecological accountability and collective
                benefits. The question isn&apos;t whether private ownership
                must be extractive—it&apos;s what institutional conditions make
                ownership regenerative versus extractive.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[700px] px-4 pt-8 border-t border-divider">
          <Heading level={2} className="text-2xl mb-6">
            {t('philosophy_explore_more')}
          </Heading>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/philosophy/shared-abundance"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_shared_abundance_title')}
            </Link>
            <Link
              href="/philosophy/digital-commons"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_digital_commons_title')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default CommonsExclosurePage;

CommonsExclosurePage.getInitialProps = async (context: NextPageContext) => {
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
