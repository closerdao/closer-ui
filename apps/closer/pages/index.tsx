import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useContext, useEffect, useRef, useState } from 'react';

import HeroCloser from '@/components/HeroCloser';
import { CommunityMap } from '@/components';
import CloserEmailCollector from 'closer/components/CloserEmailCollector';
import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';

import { GeneralConfig, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';


import { NextPageContext } from 'next';

interface Props {
  generalConfig: GeneralConfig | null;
}

const HomePage = ({ generalConfig }: Props) => {
  const { setIsOpen } = useContext(PromptGetInTouchContext) as {
    setIsOpen: (open: boolean) => void;
  };

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const visionRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const communitiesRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState({
    vision: false,
    features: false,
    communities: false,
    benefits: false,
    pricing: false,
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const createObserver = (ref: { current: HTMLElement | null }, key: keyof typeof isVisible) => {
      if (!ref.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible((prev) => ({ ...prev, [key]: true }));
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      observer.observe(ref.current);
      observers.push(observer);
    };

    createObserver(visionRef, 'vision');
    createObserver(featuresRef, 'features');
    createObserver(communitiesRef, 'communities');
    createObserver(benefitsRef, 'benefits');
    createObserver(pricingRef, 'pricing');

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <div className="bg-white text-black min-h-screen">
      <Head>
        <title>Closer — Decentralized Autonomous Villages</title>
        <meta
          name="description"
          content="The operating system for regenerative communities. Manage guests, spaces, events and resources. Token-powered governance when you're ready."
        />
        <meta name="keywords" content="regenerative communities, DAO, decentralized autonomous villages, community management, booking system, event management, ecovillage, intentional community, web3 governance" />
        <meta property="og:title" content="Closer — Decentralized Autonomous Villages" />
        <meta property="og:description" content="The operating system for regenerative communities. Manage guests, spaces, events and resources. Token-powered governance when you're ready." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Closer — Decentralized Autonomous Villages" />
        <meta name="twitter:description" content="The operating system for regenerative communities. Manage guests, spaces, events and resources. Token-powered governance when you're ready." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <CloserEmailCollector />

      <HeroCloser />

      {/* Intro Section */}
      <section
        ref={visionRef}
        className={`py-32 md:py-48 bg-[#f5f5f7] text-black transition-opacity duration-1000 -mx-4 md:-mx-0 ${
          isVisible.vision ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <p className="font-serif text-3xl md:text-4xl leading-relaxed">
            Closer bridges <em className="italic">indigenous wisdom</em> with exponential technology. An integrated suite of tools that reduce operational complexity while increasing transparency, participation, and resilience — building{' '}
            <Link href="/philosophy/commons-exclosure" className="underline decoration-[#5290DB] hover:text-[#5290DB] transition-colors">
              commons exclosures
            </Link>{' '}
            that protect communities from extraction.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        id="features"
        className={`py-32 md:py-48 bg-white transition-opacity duration-1000 -mx-4 md:-mx-0 ${
          isVisible.features ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-[5vw]">
          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-12">Features</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Booking System</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Streamline guest bookings, volunteer stays, and resident accommodations. Process payments, manage check-ins with calendar views and automated notifications.
              </p>
            </div>
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Events & Ticketing</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Create workshops, gatherings, and educational events. Integrated ticketing handles registration, payments, and attendee communication.
              </p>
            </div>
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Subscriptions & Payments</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Manage memberships with recurring support. Create subscription tiers that reinforce your community&apos;s values and sustain operations.
              </p>
            </div>
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Inventory</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Manage shared spaces, tools, and equipment through a flexible system. Set availability, track usage by membership level.
              </p>
            </div>
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Learning Hub</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Preserve community wisdom through documentation, course creation, and skill-sharing. Create a living repository that can be taught and monetized.
              </p>
            </div>
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Governance & Tokens</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Native Tokens, Proof of Presence, Proof of Sweat. Reward participation, distribute decision-making, create sustainable economic models.
              </p>
            </div>
            <div className="p-8 border border-[#e5e5e7] rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-black">Closer Agent</h3>
              <p className="text-[#6e6e73] text-sm leading-relaxed">
                Turn community knowledge into living intelligence. Sovereign AI that runs on your infrastructure, understands your domain, and serves your mission.
                <span className="block mt-2 text-xs text-[#5290DB]">Currently in alpha</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-32 md:py-48 bg-[#f5f5f7] text-black -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-4">Case Study</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">Traditional Dream Factory</h2>
          <p className="text-lg text-[#6e6e73] max-w-2xl mb-12">
            Europe&apos;s first tokenized regenerative ecovillage. DAO-governed on Celo blockchain. Built entirely on Closer.
          </p>
          <div className="flex gap-16 flex-wrap mb-12">
            <div>
              <span className="block font-serif text-4xl">€1.2M+</span>
              <span className="block text-xs uppercase tracking-wider text-[#6e6e73] mt-1">Raised</span>
            </div>
            <div>
              <span className="block font-serif text-4xl">279+</span>
              <span className="block text-xs uppercase tracking-wider text-[#6e6e73] mt-1">Token Holders</span>
            </div>
            <div>
              <span className="block font-serif text-4xl">25ha</span>
              <span className="block text-xs uppercase tracking-wider text-[#6e6e73] mt-1">Land</span>
            </div>
            <div>
              <span className="block font-serif text-4xl">4,000+</span>
              <span className="block text-xs uppercase tracking-wider text-[#6e6e73] mt-1">Trees</span>
            </div>
          </div>
          <Link
            href="https://traditionaldreamfactory.com"
            target="_blank"
            className="text-[#5290DB] text-base hover:underline"
          >
            Visit traditionaldreamfactory.com →
          </Link>
        </div>
      </section>

      {/* Communities Map Section */}
      <section
        id="communities"
        ref={communitiesRef}
        className={`py-32 md:py-48 bg-white transition-opacity duration-1000 -mx-4 md:-mx-0 ${
          isVisible.communities ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-[5vw]">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-[#5290DB] mb-4">Network</p>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-black">
              A growing network
            </h2>
            <p className="text-lg text-[#6e6e73] max-w-2xl mx-auto">
              Regenerative communities around the world building the future of autonomous governance
            </p>
          </div>
          
          <div className="mb-16">
            <div className="w-full h-[500px] rounded-2xl overflow-visible border border-[#e5e5e7] relative" style={{ zIndex: 10 }}>
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <CommunityMap />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link
              href="https://www.traditionaldreamfactory.com/"
              target="_blank"
              className="group bg-white border border-[#e5e5e7] rounded-xl overflow-hidden hover:border-[#5290DB] hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src="/images/communities/tdf.jpg"
                  alt="Traditional Dream Factory community"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-1 text-black">Traditional Dream Factory</h4>
                <p className="text-xs text-[#6e6e73] line-clamp-2">
                  Regenerative community in Portugal
                </p>
              </div>
            </Link>

            <Link
              href="https://www.fozdacova.world"
              target="_blank"
              className="group bg-white border border-[#e5e5e7] rounded-xl overflow-hidden hover:border-[#5290DB] hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src="/images/communities/foz.jpg"
                  alt="Foz Da Cova community"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-1 text-black">Foz Da Cova</h4>
                <p className="text-xs text-[#6e6e73] line-clamp-2">
                  Mountain hamlet restoration
                </p>
              </div>
            </Link>

            <Link
              href="https://www.earthbound.eco"
              target="_blank"
              className="group bg-white border border-[#e5e5e7] rounded-xl overflow-hidden hover:border-[#5290DB] hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src="/images/communities/earthbound.jpg"
                  alt="Earthbound community"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-1 text-black">Earthbound</h4>
                <p className="text-xs text-[#6e6e73] line-clamp-2">
                  A regenerative & intentional community
                </p>
              </div>
            </Link>

            <div className="bg-[#fafafa] border border-[#e5e5e7] rounded-xl overflow-hidden opacity-60">
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src="/images/communities/moos.jpg"
                  alt="Moos community"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-1 text-black">Moos</h4>
                <p className="text-xs text-[#6e6e73] line-clamp-2">
                  Co-living and creative space
                </p>
              </div>
            </div>

            <Link
              href="https://experience.lios.io/"
              target="_blank"
              className="group bg-white border border-[#e5e5e7] rounded-xl overflow-hidden hover:border-[#5290DB] hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src="/images/communities/lios.jpg"
                  alt="Lios community"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-1 text-black">Lios</h4>
                <p className="text-xs text-[#6e6e73] line-clamp-2">
                  School of Ecological Imagination
                </p>
              </div>
            </Link>

            <div className="bg-[#fafafa] border border-[#e5e5e7] rounded-xl overflow-hidden opacity-60">
              <div className="aspect-square overflow-hidden relative">
                <Image
                  src="/images/communities/per-auset.jpg"
                  alt="Per Auset community"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-1 text-black">Per Auset</h4>
                <p className="text-xs text-[#6e6e73] line-clamp-2">
                  A restored village on the Nile
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section id="governance" className="py-32 md:py-48 bg-[#fafafa] text-center -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <h2 className="font-serif text-4xl md:text-6xl mb-8 text-black">
            Governance that <em className="italic">scales</em>
          </h2>
          <p className="text-[#6e6e73] max-w-2xl mx-auto mb-16">
            Equitably distribute decision-making power and create sustainable economic models. Start with basic tools, evolve to decentralized governance when ready.
          </p>
          <div className="flex justify-center gap-16 flex-wrap">
            <div className="max-w-[200px]">
              <h4 className="font-serif text-xl mb-2 text-black">Native Tokens</h4>
              <p className="text-sm text-[#6e6e73]">
                Community-specific tokens for access, voting, and value sharing
              </p>
            </div>
            <div className="max-w-[200px]">
              <h4 className="font-serif text-xl mb-2 text-black">Proof of Presence</h4>
              <p className="text-sm text-[#6e6e73]">
                Reward physical participation and on-site contribution
              </p>
            </div>
            <div className="max-w-[200px]">
              <h4 className="font-serif text-xl mb-2 text-black">Proof of Sweat</h4>
              <p className="text-sm text-[#6e6e73]">
                Recognize labor and active community building
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 md:py-48 bg-[#f5f5f7] text-black -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-4">Philosophy</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Commons that <em className="italic">thrive</em>
          </h2>
          <p className="text-lg text-[#6e6e73] mb-12 max-w-2xl">
            The &ldquo;tragedy of the commons&rdquo; is a myth. For millennia, communities have successfully governed shared resources through sophisticated institutions. We&apos;re encoding those proven principles for the digital age.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Link
              href="/philosophy/commons-governance"
              className="group p-8 bg-white rounded-2xl hover:shadow-lg transition-shadow"
            >
              <h3 className="font-serif text-2xl mb-3 group-hover:text-[#5290DB] transition-colors">
                Ostrom&apos;s 8 Principles
              </h3>
              <p className="text-[#6e6e73] text-sm">
                Nobel Prize-winning research documented 800+ cases of successful commons governance spanning centuries.
              </p>
            </Link>
            <Link
              href="/philosophy/commons-exclosure"
              className="group p-8 bg-white rounded-2xl hover:shadow-lg transition-shadow"
            >
              <h3 className="font-serif text-2xl mb-3 group-hover:text-[#5290DB] transition-colors">
                Commons Exclosure
              </h3>
              <p className="text-[#6e6e73] text-sm">
                Inverting enclosure: boundaries that keep extractive forces out while enabling community stewardship.
              </p>
            </Link>
            <Link
              href="/philosophy/digital-commons"
              className="group p-8 bg-white rounded-2xl hover:shadow-lg transition-shadow"
            >
              <h3 className="font-serif text-2xl mb-3 group-hover:text-[#5290DB] transition-colors">
                Digital Commons
              </h3>
              <p className="text-[#6e6e73] text-sm">
                Open source creates $8.8 trillion in value. Wikipedia. Blockchain governance. Commons proven at scale.
              </p>
            </Link>
            <Link
              href="/philosophy/shared-abundance"
              className="group p-8 bg-white rounded-2xl hover:shadow-lg transition-shadow"
            >
              <h3 className="font-serif text-2xl mb-3 group-hover:text-[#5290DB] transition-colors">
                Shared Abundance
              </h3>
              <p className="text-[#6e6e73] text-sm">
                The question isn&apos;t whether commons can work. The question is whether we will build the exclosures that protect them.
              </p>
            </Link>
          </div>
          <div className="flex gap-6 flex-wrap">
            <Link
              href="/philosophy"
              className="text-[#5290DB] text-base hover:underline"
            >
              Explore our philosophy →
            </Link>
            <Link
              href="/roadmap"
              className="text-[#5290DB] text-base hover:underline"
            >
              See our roadmap →
            </Link>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-32 md:py-48 bg-[#f5f5f7] text-black -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">RESTful API</h2>
          <p className="text-[#6e6e73] mb-8">Full programmatic access to your community data.</p>
          <div className="flex flex-wrap gap-3">
            {['Bookings', 'Events', 'Tickets', 'Users', 'Stays', 'Volunteers', 'Listings', 'Subscriptions', 'Lessons', 'Resources', 'Messages', 'Metrics', 'Products', 'Charges', 'Projects'].map((endpoint) => (
              <span
                key={endpoint}
                className="px-4 py-2 bg-white border border-[#e5e5e7] rounded-md font-mono text-xs text-[#6e6e73]"
              >
                {endpoint}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Section */}
      <section className="py-32 md:py-48 bg-white text-black -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#6e6e73] mb-4">
            <span className="w-1.5 h-1.5 bg-[#5290DB] rounded-full animate-pulse"></span>
            <span>Coming Soon</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Closer <em className="italic">Agent</em>
          </h2>
          <p className="text-lg text-[#6e6e73] mb-8 max-w-2xl">
            Turn your community&apos;s knowledge into living intelligence. A sovereign AI that runs on your infrastructure, understands your domain, and serves your mission—not a corporation&apos;s.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/agent"
              className="px-7 py-3.5 bg-black text-white rounded-full text-base hover:bg-gray-800 transition-colors font-medium"
            >
              Learn more
            </Link>
            <span className="px-7 py-3.5 border border-[#e5e5e7] text-[#6e6e73] rounded-full text-base font-medium">
              In alpha
            </span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      {/* <section className=" text-center py-[100px] ">
        <Heading
          level={1}
          className="mb-4 text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[#5290DB] to-[#79FAC1] bg-clip-text text-transparent"
        >
          Build Communities That Thrive
        </Heading>
        <p className="text-lg font-bold mb-4">
          Closer is the operating system for regenerative communities
        </p>
        <p className="text-lg max-w-3xl mx-auto mb-8">
          Manage guests, spaces, events and resources through one intuitive
          platform designed specifically for land-based projects
        </p>
      </section> */}

      {/* Video Section */}
      {/* <div className="video-section flex justify-center py-8 max-w-4xl mx-auto">
        <div className="relative video-thumbnail w-full h-[640px] bg-[url('/images/video-placeholder.jpg')] bg-cover bg-center rounded-xl flex items-center justify-center shadow-lg">
          <button className="play-button absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-4 shadow-md hover:scale-105 transition">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width={40}
              height={40}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 3L19 12L5 21V3Z" fill="#333" />
            </svg>
          </button>
        </div>
      </div> */}

      {/* CTA Section */}
      <section className="py-40 md:py-48 bg-[#f5f5f7] text-center -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <h2 className="font-serif text-5xl md:text-7xl mb-12 text-black">
            Build your <em className="italic">village</em>
          </h2>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <button
              onClick={() => {
                setIsOpen(true);
              }}
              className="px-7 py-3.5 text-base bg-black text-white hover:bg-gray-800 rounded-full transition-colors font-medium"
            >
              Get in touch
            </button>
            <Link
              href="https://closer.gitbook.io/documentation"
              target="_blank"
              className="px-7 py-3.5 text-base border border-[#d1d1d6] text-black hover:border-black rounded-full transition-colors font-medium"
            >
              Documentation
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
    const [generalRes] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,

      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,

      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default HomePage;