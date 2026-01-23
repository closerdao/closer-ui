import Head from 'next/head';
import Link from 'next/link';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { loadLocaleData } from '../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const RoadmapPage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Where Villages Connect — Closer Roadmap',
    description: 'How Closer is building the coordination infrastructure for regenerative communities—where your participation travels with you.',
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
    datePublished: '2026-01-01',
    dateModified: '2026-01-23',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/roadmap`,
    },
  };

  const phases = [
    {
      phase: 'Q1 2026',
      title: 'Passport Foundation',
      items: [
        'Passport data schema & email hash lookup',
        'Consent management system',
        'Basic cross-server sync protocol',
        'Federation hub at api.closer.earth',
      ],
      status: 'current',
    },
    {
      phase: 'Q2 2026',
      title: 'Identity & Benefits',
      items: [
        'Closer Login button for all communities',
        'Passport display UI components',
        'Benefit evaluation engine',
        'AI Agent framework & knowledge base',
      ],
      status: 'upcoming',
    },
    {
      phase: 'Q3 2026',
      title: 'Reputation & Governance',
      items: [
        'Multi-credential support',
        'Presence history sync (Proof of Presence)',
        'Reputation aggregation across communities',
        'Governance proposals & voting system',
      ],
      status: 'upcoming',
    },
    {
      phase: 'Q4 2026',
      title: 'Federation Expansion',
      items: [
        'Application marketplace launch',
        'Multi-hub federation architecture',
        'Regional nodes & backup/failover',
        'Third-party developer program',
      ],
      status: 'upcoming',
    },
    {
      phase: '2027+',
      title: 'Web3 Evolution',
      items: [
        'ZK-proof credential verification',
        'On-chain credential minting (Celo)',
        'Full Web3 passport upgrade path',
        '50+ villages, 10,000+ passport holders',
      ],
      status: 'future',
    },
  ];

  const milestones = [
    { 
      year: '2027', 
      villages: '50', 
      passports: '10,000', 
      headline: 'The network takes shape',
      description: 'Cross-community stays become normal. Your passport works at dozens of villages. Trust networks issue credentials that actually mean something.' 
    },
    { 
      year: '2030', 
      villages: '500', 
      passports: '100,000', 
      headline: 'Federation goes global',
      description: 'Multiple federation hubs operate across continents. Regional nodes. Thematic networks. The phrase "regenerative nomad" has infrastructure to support it.' 
    },
    { 
      year: '2035', 
      villages: '1,000+', 
      passports: '1M+', 
      headline: 'The default layer',
      description: 'The coordination infrastructure for land-based regenerative projects worldwide. AGI writes the code; humans govern the trust.' 
    },
  ];

  return (
    <>
      <Head>
        <title>Where Villages Connect — Closer Roadmap</title>
        <meta 
          name="description" 
          content="How Closer is building the coordination infrastructure for regenerative communities—where your participation travels with you. Passports, federation hubs, and AI agents." 
        />
        <meta name="keywords" content="village network, passport system, regenerative communities, decentralized identity, community coordination, ecovillage network, trust networks, web3 governance" />
        
        <meta property="og:title" content="Where Villages Connect — Closer Roadmap" />
        <meta property="og:description" content="How Closer is building the coordination infrastructure for regenerative communities—where your participation travels with you." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/roadmap`} />
        <meta property="og:site_name" content="Closer" />
        <meta property="article:published_time" content="2026-01-01T00:00:00Z" />
        <meta property="article:modified_time" content="2026-01-23T00:00:00Z" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Where Villages Connect — Closer Roadmap" />
        <meta name="twitter:description" content="How Closer is building the coordination infrastructure for regenerative communities—where your participation travels with you." />
        
        <link rel="canonical" href={`${SITE_URL}/roadmap`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      {/* Hero */}
      <article className="min-h-screen">
        <header className="pt-20 pb-16 md:pt-32 md:pb-24 px-6 border-b border-[#e5e5e7]">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm uppercase tracking-widest text-[#6e6e73] mb-6">
              Product Vision · January 2026
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-8 text-black">
              Where Villages Connect
            </h1>
            <p className="text-xl md:text-2xl text-[#6e6e73] leading-relaxed font-light">
              Closer is evolving from a platform into something more ambitious: 
              a federation where regenerative communities can find each other, 
              trust each other, and coordinate resources across boundaries. 
              Here&apos;s where we&apos;re going.
            </p>
          </div>
        </header>

        {/* Scarcity Thesis */}
        <section className="py-20 md:py-28 px-6 bg-[#fafafa]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl mb-8 text-black">
              The Scarcity Thesis
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl leading-relaxed text-[#1d1d1f] mb-6">
                We are entering an era of radical abundance. AGI writes code. Fusion provides energy. 
                Compute follows energy. The technical constraints that shaped the twentieth century 
                are dissolving.
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-[#1d1d1f] mb-10">
                But three things remain stubbornly scarce:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div>
                <h3 className="font-serif text-2xl mb-3 text-black">Trust</h3>
                <p className="text-[#6e6e73] leading-relaxed">
                  You can&apos;t prompt your way to genuine human connection. Trust is built 
                  through time, presence, and lived experience. It cannot be manufactured.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-2xl mb-3 text-black">Land</h3>
                <p className="text-[#6e6e73] leading-relaxed">
                  The planet isn&apos;t making more of it. Communities that steward land 
                  well—regenerating rather than extracting—will be the scarce resource 
                  of the coming decades.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-2xl mb-3 text-black">Coordination</h3>
                <p className="text-[#6e6e73] leading-relaxed">
                  The social infrastructure that allows communities to find each other, 
                  share resources, and make collective decisions. This is the bottleneck 
                  for regenerative transition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Architecture */}
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl mb-8 text-black">
              v4: The Architecture
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl leading-relaxed text-[#1d1d1f] mb-10">
                Closer v4 introduces three interconnected layers. Each can operate independently, 
                but together they create something larger than the sum of their parts.
              </p>
            </div>

            <div className="space-y-12 mt-12">
              <div className="border-l-2 border-[#5290DB] pl-8">
                <h3 className="font-serif text-2xl mb-4 text-black">Physical Nodes</h3>
                <p className="text-[#6e6e73] leading-relaxed mb-4">
                  Land-based projects running Closer software: ecovillages, co-living spaces, 
                  regenerative farms. Each manages its own bookings, events, memberships, 
                  and governance.
                </p>
                <p className="text-[#1d1d1f]">
                  Traditional Dream Factory in Portugal is the first. There will be hundreds.
                </p>
              </div>

              <div className="border-l-2 border-[#5290DB] pl-8">
                <h3 className="font-serif text-2xl mb-4 text-black">Trust Networks</h3>
                <p className="text-[#6e6e73] leading-relaxed mb-4">
                  Distributed communities that curate membership based on shared values, 
                  not geography. They issue portable credentials—<em>passports</em>—that 
                  travel with individuals across physical nodes.
                </p>
                <p className="text-[#1d1d1f]">
                  A Nomad Farm member arriving at TDF carries reputation from their home network.
                </p>
              </div>

              <div className="border-l-2 border-[#5290DB] pl-8">
                <h3 className="font-serif text-2xl mb-4 text-black">Federation Hubs</h3>
                <p className="text-[#6e6e73] leading-relaxed mb-4">
                  The connective tissue. <code className="text-sm bg-[#f5f5f7] px-2 py-1 rounded">api.closer.earth</code> is 
                  the first hub—it coordinates passport lookups, syncs credentials across 
                  communities, and enables cross-network discovery.
                </p>
                <p className="text-[#1d1d1f]">
                  But the architecture is federated: any community can become a hub. 
                  The protocol is the product, not the server.
                </p>
              </div>

              <div className="border-l-2 border-[#5290DB] pl-8">
                <h3 className="font-serif text-2xl mb-4 text-black">AI Agents</h3>
                <p className="text-[#6e6e73] leading-relaxed mb-4">
                  Each community can run an AI agent that serves as its collective memory—ingesting 
                  governance documents, meeting transcripts, and community knowledge.
                </p>
                <p className="text-[#1d1d1f]">
                  These agents don&apos;t replace human governance. They make it more accessible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Passport */}
        <section className="py-20 md:py-28 px-6 bg-[#fafafa]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl mb-8 text-black">
              Your Passport
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl leading-relaxed text-[#1d1d1f] mb-10">
                The passport is the portable identity layer that travels with you across 
                the Closer network. It carries your credentials, reputation, and access 
                rights from community to community.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="bg-white p-6 rounded-xl">
                <h4 className="font-medium mb-2 text-black">Credentials</h4>
                <p className="text-sm text-[#6e6e73]">
                  Citizenships, memberships, skills, attestations from trusted networks
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h4 className="font-medium mb-2 text-black">Presence History</h4>
                <p className="text-sm text-[#6e6e73]">
                  Verified stays across communities—proof you were actually there
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h4 className="font-medium mb-2 text-black">Participation Record</h4>
                <p className="text-sm text-[#6e6e73]">
                  Nights stayed, contributions made, vouches received—real primitives, not abstract scores
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h4 className="font-medium mb-2 text-black">Sweat Equity</h4>
                <p className="text-sm text-[#6e6e73]">
                  Hours contributed, skills offered—proof of work for the commons
                </p>
              </div>
            </div>

            <div className="mt-12 p-8 border border-[#5290DB] rounded-xl bg-[#5290DB]/5">
              <h4 className="font-serif text-xl mb-3 text-black">Privacy by Design</h4>
              <p className="text-[#6e6e73] leading-relaxed">
                Your data is yours. Email addresses are hashed before any cross-server queries. 
                Data sharing between servers is opt-in only. You control what other communities 
                can see about you.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-black">
              The Timeline
            </h2>
            <p className="text-lg text-[#6e6e73] mb-12">
              Building the coordination infrastructure for shared abundance.
            </p>

            <div className="relative">
              <div className="absolute left-3 md:left-4 top-0 bottom-0 w-px bg-[#e5e5e7]" />
              
              {phases.map((phase, index) => (
                <div key={index} className="relative pl-10 md:pl-14 pb-12">
                  <div className={`absolute left-0 md:left-1 w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${
                    phase.status === 'current' 
                      ? 'bg-[#5290DB] border-[#5290DB]' 
                      : phase.status === 'upcoming'
                      ? 'bg-white border-[#5290DB]'
                      : 'bg-white border-[#e5e5e7]'
                  }`} />
                  
                  <div>
                    <div className="flex items-baseline gap-4 mb-3">
                      <span className={`font-mono text-sm ${
                        phase.status === 'current' ? 'text-[#5290DB]' : 'text-[#6e6e73]'
                      }`}>
                        {phase.phase}
                      </span>
                      {phase.status === 'current' && (
                        <span className="text-xs text-[#5290DB] uppercase tracking-wide">Now</span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl mb-4 text-black">{phase.title}</h3>
                    <ul className="space-y-2">
                      {phase.items.map((item, i) => (
                        <li key={i} className="text-[#6e6e73] flex items-start gap-3">
                          <span className="text-[#5290DB] mt-1.5">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Long-term */}
        <section className="py-24 md:py-32 px-6 bg-[#1d1d1f] text-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-widest text-white/40 mb-4">
              Looking Ahead
            </p>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-white">
              The Long View
            </h2>
            <p className="text-xl text-white/60 mb-16 max-w-2xl">
              We&apos;re building infrastructure for the next fifty years. 
              Here&apos;s what the network could look like.
            </p>

            <div className="space-y-0">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`border-t border-white/10 py-12 ${index === milestones.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12">
                    <div>
                      <p className="font-serif text-5xl md:text-6xl text-[#5290DB]">{milestone.year}</p>
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl md:text-3xl mb-4 text-white">
                        {milestone.headline}
                      </h3>
                      <p className="text-white/70 text-lg leading-relaxed mb-6">
                        {milestone.description}
                      </p>
                      <div className="flex gap-8">
                        <div>
                          <p className="font-serif text-3xl text-white">{milestone.villages}</p>
                          <p className="text-sm text-white/40 uppercase tracking-wide">villages</p>
                        </div>
                        <div>
                          <p className="font-serif text-3xl text-white">{milestone.passports}</p>
                          <p className="text-sm text-white/40 uppercase tracking-wide">passports</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Federation */}
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl mb-12 text-black">
              Why Federation Matters
            </h2>

            <div className="space-y-12">
              <div>
                <h3 className="font-serif text-xl md:text-2xl mb-4 text-black">
                  No single point of capture
                </h3>
                <p className="text-[#6e6e73] leading-relaxed">
                  Villages don&apos;t pay rent to a platform. They run their own nodes. 
                  If <code className="text-sm bg-[#f5f5f7] px-2 py-1 rounded">api.closer.earth</code> disappeared 
                  tomorrow, communities would still function—they&apos;d just lose cross-network 
                  discovery until another hub emerged.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl md:text-2xl mb-4 text-black">
                  Trust is the real asset
                </h3>
                <p className="text-[#6e6e73] leading-relaxed">
                  The passport system creates a trust graph—who has stayed where, who vouches 
                  for whom, which networks have agreements with which spaces. This graph can&apos;t 
                  be copied by a competitor because it&apos;s built through lived experience 
                  across physical places.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl md:text-2xl mb-4 text-black">
                  Network effects without lock-in
                </h3>
                <p className="text-[#6e6e73] leading-relaxed">
                  More villages in the network means more places your passport works, 
                  which means more value in holding credentials. But any community can fork, 
                  run their own hub, or leave. The network effects come from coordination value, 
                  not switching costs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Future Token Note */}
        <section className="py-12 px-6 border-t border-[#e5e5e7]">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-[#6e6e73] leading-relaxed">
              <strong className="text-[#1d1d1f]">On governance tokens:</strong> As the federation grows, 
              launching a $CLOSER governance token could become a path for coordinating network-wide 
              decisions and funding commons infrastructure. This remains a future consideration, 
              not a current commitment.
            </p>
          </div>
        </section>

        {/* Closing */}
        <section className="py-20 md:py-28 px-6 bg-[#1d1d1f] text-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-serif text-2xl md:text-3xl leading-relaxed mb-12">
              This isn&apos;t a pitch for a startup. It&apos;s an invitation to build the commons together.
            </p>
            <p className="text-white/60 mb-12">
              AGI writes the code. Humans govern the trust. Physical places connected by digital commons.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/philosophy"
                className="px-6 py-3 border border-white/30 text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Read the philosophy
              </Link>
              <Link
                href="https://closer.gitbook.io/documentation"
                target="_blank"
                className="px-6 py-3 bg-white text-[#1d1d1f] rounded-full hover:bg-white/90 transition-colors"
              >
                Documentation
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  );
};

export default RoadmapPage;

RoadmapPage.getInitialProps = async (context: NextPageContext) => {
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
