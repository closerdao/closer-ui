import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { ReactNode, useContext, useEffect, useState } from 'react';

import { CommunityMap } from '@/components';
import CloserChatWidget from '@/components/CloserChatWidget';
import { mergeVillageMapItems } from '@/utils/villageMap.utils';

import { GeneralConfig, getCachedConfig } from 'closer';
import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';
import { VillageMapItem } from 'closer/types/village';
import { fetchVillages } from 'closer/utils/village.utils';
import { parseMessageFromError } from 'closer/utils/common';

import { NextPageContext } from 'next';

interface Props {
  generalConfig: GeneralConfig | null;
}

const OASA_CONSTITUTION_URL =
  'https://oasa.earth/papers/oasa-constitution-2025/';

const PRINCIPLES = [
  {
    title: 'Soil',
    body: 'Life-filled and fertile — living cover year-round, no synthetics, fertility built biologically.',
  },
  {
    title: 'Water',
    body: 'Slowed, spread and sunk — rain captured in swales and ponds; greywater treated and reused.',
  },
  {
    title: 'Air',
    body: 'Clean and restorative — carbon locked into forests, soil and biochar; no open burning.',
  },
  {
    title: 'Waste',
    body: 'A non-waste mindset — compost, upcycle, recover every organic stream.',
  },
  {
    title: 'Rewilding',
    body: 'At least 50% of land wild — native species, food forests, biodiversity compounding.',
  },
  {
    title: 'Resources',
    body: 'Renewable and local — under 5% built, natural materials, plant-forward and seasonal.',
  },
  {
    title: 'Community',
    body: 'Equitable and open — consent-based decisions, open knowledge, strong local ties.',
  },
];

const STEPS = [
  {
    n: 'Step 1',
    title: 'Tell us about your community',
    body: 'Name, type, one line about what you’re building. We reserve your address and set up your space.',
  },
  {
    n: 'Step 2',
    title: 'Preview your platform',
    body: 'Pick a style, share your story, and see your pages come together before you commit.',
  },
  {
    n: 'Step 3',
    title: 'Go live & grow',
    body: 'Take bookings, host events, welcome members — and switch on token governance whenever you’re ready.',
  },
];

const FEATURES = [
  {
    title: 'Bookings & Stays',
    body: 'Guests, volunteers and residents — payments, calendars and check-ins.',
  },
  {
    title: 'Events & Ticketing',
    body: 'Workshops and gatherings with registration, payments and communication.',
  },
  {
    title: 'Memberships',
    body: 'Recurring subscriptions and tiers that sustain your operations.',
  },
  {
    title: 'Spaces & Inventory',
    body: 'Shared spaces, tools and equipment — availability and usage tracking.',
  },
  {
    title: 'Learning Hub',
    body: 'Document community wisdom, create courses, share and monetize skills.',
  },
  {
    title: 'Governance & Tokens',
    body: 'Proof of Presence, Proof of Sweat — optional, opt-in, whenever you’re ready.',
  },
];

const COMMUNITIES = [
  {
    name: 'Traditional Dream Factory',
    blurb: 'Regenerative community in Portugal',
    image: '/images/communities/tdf.jpg',
    href: 'https://www.traditionaldreamfactory.com/',
  },
  {
    name: 'Foz Da Cova',
    blurb: 'Mountain hamlet restoration',
    image: '/images/communities/foz.jpg',
    href: 'https://www.fozdacova.world',
  },
  {
    name: 'Earthbound',
    blurb: 'A regenerative & intentional community',
    image: '/images/communities/earthbound.jpg',
    href: 'https://www.earthbound.eco',
  },
  {
    name: 'Moos',
    blurb: 'Co-living and creative space',
    image: '/images/communities/moos.jpg',
    href: null,
  },
  {
    name: 'Lios',
    blurb: 'School of Ecological Imagination',
    image: '/images/communities/lios.jpg',
    href: 'https://experience.lios.io/',
  },
  {
    name: 'Per Auset',
    blurb: 'A restored village on the Nile',
    image: '/images/communities/per-auset.jpg',
    href: null,
  },
];

const FAQS = [
  {
    q: 'What actually makes a hub “regenerative”?',
    a: 'A regenerative system grows its resources over time instead of depleting them: more quantity of life (biomass, carbon), more diversity (biodiversity, resilience) and more quality (vibrant, connected ecosystems). In practice that means restoring water cycles, building soil and adding species — fewer inputs, same or more outputs, compounding returns. Closer gives you the operational tools; the land practice is yours.',
  },
  {
    q: 'Do I need to understand tokens or crypto?',
    a: 'No. Closer works fully without any of it — bookings, events, members, payments in euros. Token governance is optional and opt-in; most communities switch it on later, some never do.',
  },
  {
    q: 'What does “from ownership to stewardship” mean for me?',
    a: 'It’s the OASA model: instead of owning land to extract from it, you hold access and governance rights and commit to caring for it. Counterintuitively this creates more security — with no right to extract, no one can force a sell-off, so the project can endure for generations. Adopting it is entirely your choice; Closer supports it but doesn’t require it.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'It’s yours. Export everything — members, bookings, content — anytime via dashboard or API. Data sovereignty isn’t a feature, it’s the architecture: keeping extractive forces out is the whole point. Each community runs its own database and can localise all the way down.',
  },
  {
    q: 'How do I qualify for the OASA Village Fund?',
    a: 'Deploy your village on Closer and respect the OASA principles. Concretely: land (title or long-term lease) with a regeneration plan aligned with the Constitution’s seven principles; a binding stewardship commitment — the OASA trust model, or your own methodology disclosed openly; open books to the network; and running on Closer during the cohort (no lock-in — your data stays yours). Ten villages will be selected for the first cohort in fall 2026, with campaigns matched ~3x on Artizen and a token raise — governance and use rights, never equity — opening spring 2027.',
  },
  {
    q: 'How does Closer relate to OASA?',
    a: 'Closer is the community platform of the OASA network — the operating system its villages run on. OASA transitions land into perpetual commons; Closer gives those communities (and yours) the tools to operate and govern themselves, replicable across any land-based project in the world.',
  },
];

const Eyebrow = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`block text-xs font-bold uppercase tracking-[0.22em] text-[#0FA968] ${className}`}
  >
    {children}
  </span>
);

const HomePage = ({}: Props) => {
  const { setIsOpen } = useContext(PromptGetInTouchContext) as {
    setIsOpen: (open: boolean) => void;
  };
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mapProjects, setMapProjects] = useState<VillageMapItem[]>(() =>
    mergeVillageMapItems([]),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const apiProjects = await fetchVillages({ limit: 200 });
      if (!cancelled) {
        setMapProjects(mergeVillageMapItems(apiProjects));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openFunnel = () => setIsOpen(true);

  return (
    <div className="bg-[#FCFDFB] text-[#10201A] min-h-screen">
      <Head>
        <title>Closer — Launch a regenerative community</title>
        <meta
          name="description"
          content="Bookings, members, events and governance on your own domain. Steward your land under OASA principles and qualify for matched funding from the OASA Village Fund."
        />
        <meta
          name="keywords"
          content="regenerative communities, ecovillage, DAO, community management, booking system, land stewardship, OASA, village fund"
        />
        <meta
          property="og:title"
          content="Closer — Launch a regenerative community"
        />
        <meta
          property="og:description"
          content="Build your village, not your software. Bookings, members, events and governance on your own domain."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${
            process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'
          }`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Closer — Launch a regenerative community"
        />
        <meta
          name="twitter:description"
          content="Build your village, not your software. Bookings, members, events and governance on your own domain."
        />
        <link
          rel="canonical"
          href={`${
            process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'
          }`}
        />
      </Head>

      {/* HERO */}
      <section className="relative overflow-hidden text-center px-6 py-24 md:py-28 bg-[radial-gradient(circle_700px_at_50%_-220px,rgba(62,224,143,0.28),transparent),radial-gradient(circle_520px_at_88%_30%,rgba(62,224,143,0.12),transparent)]">
        <div className="max-w-5xl mx-auto">
          <a
            href="#fund"
            className="inline-block mb-8 text-[13px] bg-white border border-[#C2F0DA] rounded-full px-[18px] py-2 text-[#5C6E64] shadow-[0_2px_10px_rgba(15,169,104,0.08)] hover:border-[#0FA968] transition-colors"
          >
            🌱 <b className="text-[#0B7A4C]">OASA Village Fund</b> — first cohort
            of 10, fall 2026 →
          </a>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-[-0.01em]">
            Build your village,
            <br />
            <em className="italic text-[#0FA968]">not your software.</em>
          </h1>
          <p className="text-lg text-[#5C6E64] max-w-xl mx-auto mt-7 mb-9">
            Bookings, members, events and governance on your own domain.
            Steward your land under{' '}
            <b className="text-[#10201A] font-semibold">OASA principles</b> and
            qualify for matched funding.
          </p>
          <button
            onClick={openFunnel}
            className="inline-block px-8 py-4 rounded-xl font-semibold text-[15px] bg-[#3EE08F] text-[#07351F] shadow-[0_6px_20px_rgba(62,224,143,0.35)] hover:bg-[#5BEBA4] hover:-translate-y-0.5 transition-all"
          >
            Launch your community
          </button>
          <p className="mt-5 text-[13.5px] text-[#5C6E64]">
            Talk to us first · no credit card · live in minutes
          </p>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-[#3EE08F] text-[#0E1E16] py-3 overflow-hidden whitespace-nowrap font-bold text-[13.5px] tracking-[0.06em]">
        <span className="inline-block pr-12 animate-closer-marquee">
          BOOKINGS ✦ EVENTS ✦ MEMBERSHIPS ✦ MEMBER DIRECTORY ✦ YOUR OWN DOMAIN ✦
          WATER · SOIL · BIODIVERSITY ✦ GOVERNANCE WHEN YOU&rsquo;RE READY ✦
          OASA VILLAGE FUND ✦ BOOKINGS ✦ EVENTS ✦ MEMBERSHIPS ✦ MEMBER DIRECTORY
          ✦ YOUR OWN DOMAIN ✦ WATER · SOIL · BIODIVERSITY ✦&nbsp;
        </span>
      </div>

      {/* PRESS */}
      <div className="pt-14 pb-5 text-center px-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#5C6E64] font-semibold mb-5">
          From the OASA network — as seen in
        </div>
        <div className="flex gap-11 justify-center flex-wrap font-serif text-lg text-[#8A9A90] items-center">
          <span>Reuters</span>
          <span>The Japan Times</span>
          <span>Expresso</span>
          <span>O Jornal Económico</span>
        </div>
      </div>

      {/* WHY */}
      <section id="why" className="bg-[#0E1E16] text-[#EAF4EE] py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <Eyebrow className="!text-[#3EE08F]">Why regenerative hubs</Eyebrow>
          <h2 className="font-serif text-white text-4xl md:text-5xl mt-3 mb-6 max-w-3xl leading-[1.1]">
            The 21st-century crisis is local. So is{' '}
            <em className="italic text-[#3EE08F]">the solution.</em>
          </h2>
          <p className="text-lg text-[#BFD6C9] max-w-3xl leading-relaxed">
            As heat records break and 20th-century infrastructure buckles —
            rails warping, roads melting, grids shedding load exactly when
            people need them most — a quieter fact keeps showing up in the data:
            small pockets of restored land stay livable while everything around
            them fails. Not by luck. By{' '}
            <b className="text-white font-semibold">years of unglamorous work</b>{' '}
            — planting diverse canopy, slowing water with swales, building soil
            that holds rain like a sponge instead of shedding it like a roof.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="border border-[#3EE08F]/30 rounded-[18px] px-5 py-6 bg-[#3EE08F]/[0.06]"
              >
                <b className="font-serif text-2xl text-[#3EE08F] block leading-tight">
                  {p.title}
                </b>
                <span className="block text-[13px] text-[#BFD6C9] mt-2 leading-relaxed">
                  {p.body}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-[#7FA08F] mt-6 italic">
            The seven regenerative principles of the{' '}
            <a
              href={OASA_CONSTITUTION_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#3EE08F] underline underline-offset-[3px]"
            >
              OASA Constitution
            </a>{' '}
            — the minimum standard every OASA project upholds, and the bar for
            the Village Fund.
          </p>
        </div>
      </section>

      {/* KEYSTONE */}
      <section id="keystone" className="py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Eyebrow>The reframe</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-[1.1]">
              From owning land to{' '}
              <em className="italic text-[#0FA968]">stewarding</em> it.
            </h2>
            <p className="text-[#5C6E64] text-lg mt-5 leading-relaxed">
              For five hundred years our culture told one story: civilization on
              one side, wilderness on the other, human presence a subtraction
              from nature. That story is disabling — it leaves only
              &ldquo;dominate&rdquo; or &ldquo;leave alone,&rdquo; and both are
              separation. There is an older, third way: the human hand as a{' '}
              <b className="text-[#10201A] font-semibold">keystone</b> — the
              species whose presence makes the forest thick, the river clear,
              the soil deeper each year.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="border border-[#EADFD3] bg-[#FBF7F3] rounded-[22px] p-8">
              <div className="text-xs uppercase tracking-[0.14em] font-bold text-[#B47B4A] mb-4">
                The extractive default
              </div>
              <h3 className="font-serif text-2xl mb-3">Ownership as a drain</h3>
              <ul className="list-none">
                {[
                  'Land held to be used up — its value in what you take out',
                  'Nutrients exported, never cycled back; soil overdrawn',
                  'Water rushed downstream as flood, gone a week later',
                  'Diversity simplified for short-term yield, then collapse',
                  'Community sovereignty traded for corporate bottom lines',
                ].map((item) => (
                  <li
                    key={item}
                    className="relative py-2.5 pl-7 text-[14.5px] text-[#5C6E64] border-b border-black/5 last:border-0 before:content-['–'] before:absolute before:left-1.5 before:text-[#B47B4A] before:font-bold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[#C2F0DA] bg-white rounded-[22px] p-8">
              <div className="text-xs uppercase tracking-[0.14em] font-bold text-[#0FA968] mb-4">
                The regenerative game
              </div>
              <h3 className="font-serif text-2xl mb-3">Stewardship as a loop</h3>
              <ul className="list-none">
                {[
                  'Land held to grow the pie for future generations',
                  'Soil carbon built year over year — an account that refills',
                  'Water slowed, spread and sunk; the water table rises',
                  'Species added, resilience compounding over time',
                  'Sovereignty kept local: your data, your domain, your rules',
                ].map((item) => (
                  <li
                    key={item}
                    className="relative py-2.5 pl-7 text-[14.5px] text-[#5C6E64] border-b border-black/5 last:border-0 before:content-['→'] before:absolute before:left-0 before:text-[#0FA968] before:font-bold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="max-w-3xl mx-auto mt-16 text-center">
            <blockquote className="font-serif italic text-2xl md:text-[32px] leading-[1.4]">
              Keystone species don&rsquo;t dominate their ecosystems. They{' '}
              <em className="not-italic text-[#0FA968]">
                hold the arch open
              </em>{' '}
              so everything else can live inside it. The otter makes the kelp
              forest possible. The beaver makes the wetland. Humans have played
              exactly this role — when the culture told them to.
            </blockquote>
            <cite className="block mt-5 text-[13.5px] text-[#5C6E64] not-italic">
              — <em>Becoming Keystone</em>, Samuel Delesque
            </cite>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-[#E2FAEE] py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">
              Three steps. <em className="italic text-[#0FA968]">No developers.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="relative bg-white border border-[#C2F0DA] rounded-[22px] p-8 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,169,104,0.14)] transition-all"
              >
                <div className="absolute -top-4 left-7 bg-[#3EE08F] text-[#0E1E16] rounded-full px-4 py-1 font-bold text-[13.5px] shadow-[0_4px_12px_rgba(62,224,143,0.4)]">
                  {step.n}
                </div>
                <h3 className="font-serif text-xl mt-2 mb-2.5">{step.title}</h3>
                <p className="text-[14.5px] text-[#5C6E64]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-14">
            <Eyebrow>Everything included</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">
              One platform,{' '}
              <em className="italic text-[#0FA968]">every tool</em> your
              community needs.
            </h2>
            <p className="text-[#5C6E64] mt-4">
              Turn a secluded project into a functional, digital-native economy
              — hospitality and stays at the core, complemented by events, food,
              education, subscriptions and products.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[#C2F0DA] rounded-[18px] p-6 hover:border-[#0FA968] hover:-translate-y-0.5 transition-all"
              >
                <h3 className="font-semibold text-[15.5px] mb-2">{f.title}</h3>
                <p className="text-sm text-[#5C6E64]">{f.body}</p>
              </div>
            ))}
            <div className="bg-white border border-[#C2F0DA] rounded-[18px] p-6 hover:border-[#0FA968] hover:-translate-y-0.5 transition-all">
              <h3 className="font-semibold text-[15.5px] mb-2">Closer Agent</h3>
              <p className="text-sm text-[#5C6E64]">
                Sovereign AI that runs on your infrastructure, understands your
                domain, and serves your mission.{' '}
                <Link href="/agent" className="text-[#0B7A4C] underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDY */}
      <section className="bg-[#E2FAEE] py-20 md:py-24 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <Eyebrow>Proven in the field</Eyebrow>
          <h2 className="font-serif text-3xl md:text-5xl mt-3 mb-4 max-w-2xl mx-auto">
            <em className="italic text-[#0FA968]">Traditional Dream Factory</em>{' '}
            runs on Closer
          </h2>
          <p className="text-[#5C6E64] max-w-xl mx-auto">
            Europe&rsquo;s first tokenized regenerative ecovillage — a degraded
            poultry farm in Alentejo turned into an oasis of life. DAO-governed,
            built entirely on Closer, from land purchase to daily operations. In
            2025 its water table rose from 20m below ground to just 3m — trees
            surviving a six-month drought without a drop of borehole water.
          </p>
          <div className="flex justify-center gap-5 flex-wrap my-14">
            {[
              { n: '€1.5M+', l: 'Raised' },
              { n: '300+', l: 'Token holders' },
              { n: '5,000+', l: 'Trees planted' },
            ].map((s) => (
              <div
                key={s.l}
                className="bg-white border border-[#C2F0DA] rounded-[18px] px-9 py-6 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,169,104,0.14)] transition-all"
              >
                <b className="block font-serif text-4xl text-[#0FA968]">
                  {s.n}
                </b>
                <span className="text-xs uppercase tracking-[0.12em] text-[#5C6E64]">
                  {s.l}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="https://traditionaldreamfactory.com"
            target="_blank"
            className="text-[#0B7A4C] font-semibold text-[14.5px] hover:underline"
          >
            Visit traditionaldreamfactory.com →
          </Link>
        </div>
      </section>

      {/* NETWORK */}
      <section id="communities" className="py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Eyebrow>A growing network</Eyebrow>
          <p className="font-serif italic text-lg md:text-xl text-[#5C6E64] max-w-3xl mx-auto mt-4 leading-[2.1]">
            <b className="text-[#10201A] font-medium">
              Traditional Dream Factory
            </b>
            , Portugal · <b className="text-[#10201A] font-medium">Foz Da Cova</b>
            , mountain hamlet ·{' '}
            <b className="text-[#10201A] font-medium">Earthbound</b>, intentional
            community · <b className="text-[#10201A] font-medium">Moos</b>,
            Berlin · <b className="text-[#10201A] font-medium">Lios</b>,
            ecological imagination ·{' '}
            <b className="text-[#10201A] font-medium">Per Auset</b>, the Nile ·{' '}
            <span className="text-[#0FA968] border-b-2 border-[#3EE08F] pb-px">
              your community, next
            </span>
          </p>

          <div className="my-14">
            <div
              className="w-full h-[500px] rounded-2xl overflow-visible border border-[#C2F0DA] relative"
              style={{ zIndex: 10 }}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <CommunityMap projects={mapProjects} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/map" className="text-[#0FA968] font-medium hover:underline">
                Open full map
              </Link>
              <span className="text-[#5C6E64]">·</span>
              <Link
                href="/ambassadors"
                className="text-[#0FA968] font-medium hover:underline"
              >
                Become an Ambassador
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left">
            {COMMUNITIES.map((c) => {
              const inner = (
                <>
                  <div className="aspect-square overflow-hidden relative">
                    <Image
                      src={c.image}
                      alt={`${c.name} community`}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-1">{c.name}</h4>
                    <p className="text-xs text-[#5C6E64] line-clamp-2">
                      {c.blurb}
                    </p>
                  </div>
                </>
              );
              return c.href ? (
                <Link
                  key={c.name}
                  href={c.href}
                  target="_blank"
                  className="group bg-white border border-[#C2F0DA] rounded-xl overflow-hidden hover:border-[#0FA968] hover:shadow-lg transition-all"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={c.name}
                  className="bg-white border border-[#C2F0DA] rounded-xl overflow-hidden opacity-60"
                >
                  {inner}
                </div>
              );
            })}
          </div>

          <div className="mt-11 text-sm text-[#5C6E64] bg-[#E2FAEE] inline-block rounded-full px-7 py-3">
            Closer is the platform of{' '}
            <b className="text-[#10201A]">OASA</b> — diverting the world&rsquo;s
            most prized asset class, real estate, toward perpetual commons.{' '}
            <a
              href={OASA_CONSTITUTION_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#0FA968] font-semibold border-b border-[#C2F0DA]"
            >
              Read the constitution
            </a>
          </div>
        </div>
      </section>

      {/* VILLAGE FUND */}
      <section id="fund" className="bg-[#0E1E16] text-[#EAF6EF] py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Eyebrow className="!text-[#3EE08F]">
            OASA Village Fund · First cohort fall 2026
          </Eyebrow>
          <h2 className="font-serif text-white text-3xl md:text-5xl mt-3 leading-[1.1]">
            Deploy on Closer. Steward the land.{' '}
            <em className="italic text-[#3EE08F]">Get funded.</em>
          </h2>
          <p className="text-[#B9CFC2] text-[17px] max-w-3xl mt-5 leading-relaxed">
            Villages that run on Closer and respect the{' '}
            <b className="text-white">OASA principles</b> qualify for the OASA
            Village Fund — matched funding for the first cohort of{' '}
            <b className="text-white">10 villages</b>. Building a village is
            legally exhausting and financially punishing, and most attempts
            fail. The fund exists to change those odds for the builders with the
            stomach for it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-11">
            {[
              {
                n: '~3x',
                b: 'Your Artizen campaign draws from a donor-seeded matching pool plus endowment prizes — pre-raised money, matched until the pool is spent.',
              },
              {
                n: '10 villages',
                b: 'Selected for the first cohort, launching fall 2026 — with a token raise (governance & use rights, never equity) opening follow-on capital in spring 2027.',
              },
              {
                n: '1% of fees',
                b: 'Closer commits 1% of every platform transaction back into the fund. As the network grows, the fund refills itself.',
              },
            ].map((s) => (
              <div
                key={s.n}
                className="bg-white/5 border border-[#3EE08F]/25 rounded-[18px] p-6"
              >
                <b className="block font-serif text-3xl text-[#3EE08F] mb-1.5">
                  {s.n}
                </b>
                <span className="block text-[13.5px] text-[#B9CFC2] leading-relaxed">
                  {s.b}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-serif text-white text-lg mb-3.5">
                What qualifies you
              </h3>
              <ul className="list-none">
                {[
                  {
                    label: 'Land',
                    text: ' — title or long-term lease, and a regeneration plan aligned with the OASA Constitution’s seven principles.',
                  },
                  {
                    label: 'A binding stewardship commitment.',
                    text: ' The OASA trust model is one proven path — not required. Protect your land another way and you disclose your methodology openly.',
                  },
                  {
                    label: 'Open books',
                    text: ' — financial and ecological transparency to the OASA network, with annual reporting.',
                  },
                  {
                    label: 'Run on Closer for the cohort.',
                    text: ' No lock-in — your data and community stay yours, and you can leave after.',
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="relative text-sm text-[#C9DCD1] py-2 pl-6 border-b border-white/10 last:border-0 leading-relaxed before:content-['→'] before:absolute before:left-0 before:text-[#3EE08F] before:font-bold"
                  >
                    <b className="text-white">{item.label}</b>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-white text-lg mb-3.5">
                Reasons not to apply
              </h3>
              <ul className="list-none">
                {[
                  'You see the land as a real estate play with an exit.',
                  'You’re building toward an exit, not a legacy — stewardship is a constraint you’d rather escape.',
                  'You won’t open your books to the OASA network.',
                ].map((item) => (
                  <li
                    key={item}
                    className="relative text-sm text-[#C9DCD1] py-2 pl-6 border-b border-white/10 last:border-0 leading-relaxed before:content-['✕'] before:absolute before:left-0 before:top-[11px] before:text-[#E8A05D] before:font-bold before:text-xs"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[13.5px] text-[#8FA99A] border-l-[3px] border-[#3EE08F] pl-4 leading-relaxed">
                Consent-based governance causes friction. Co-ownership is
                legally complex. Novel financing means building the plane while
                flying it. We have the playbook — and OASA&rsquo;s legal counsel
                is at your disposal whichever structure you choose — but you
                need the resilience.
              </p>
            </div>
          </div>

          <div className="mt-9 flex gap-4 flex-wrap items-center">
            <button
              onClick={openFunnel}
              className="px-8 py-4 rounded-xl font-semibold text-[15px] bg-[#3EE08F] text-[#07351F] shadow-[0_6px_20px_rgba(62,224,143,0.35)] hover:bg-[#5BEBA4] hover:-translate-y-0.5 transition-all"
            >
              Launch &amp; apply for the fund
            </button>
            <a
              href={OASA_CONSTITUTION_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[13.5px] text-[#B9CFC2] underline underline-offset-[3px]"
            >
              Read the OASA Constitution →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="font-serif text-3xl md:text-[44px] mt-3">
              Before <em className="italic text-[#0FA968]">you ask</em>
            </h2>
          </div>
          <div>
            {FAQS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q} className="border-b border-[#C2F0DA]">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full text-left py-5 text-[16.5px] font-semibold flex justify-between items-center gap-4"
                  >
                    {item.q}
                    <span
                      className={`text-[#0FA968] text-2xl font-normal transition-transform shrink-0 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <p className="text-[#5C6E64] text-[15px] pb-5">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-28 px-6 bg-[radial-gradient(circle_600px_at_50%_130%,rgba(62,224,143,0.25),transparent)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-5xl md:text-7xl mb-5">
            Pick up your <em className="italic text-[#0FA968]">sovereignty.</em>
          </h2>
          <p className="text-[#5C6E64] mb-9 text-[15px]">
            Launch or join a community · live in minutes
          </p>
          <button
            onClick={openFunnel}
            className="px-8 py-4 rounded-xl font-semibold text-[15px] bg-[#3EE08F] text-[#07351F] shadow-[0_6px_20px_rgba(62,224,143,0.35)] hover:bg-[#5BEBA4] hover:-translate-y-0.5 transition-all"
          >
            Launch your community
          </button>
        </div>
      </section>

      <CloserChatWidget />
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const generalConfig = getCachedConfig('general');

    return {
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,

      error: parseMessageFromError(err),
    };
  }
};

export default HomePage;
