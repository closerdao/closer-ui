import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useContext, useEffect, useRef, useState } from 'react';

import HeroCloser from '@/components/HeroCloser';
import { CommunityMap } from '@/components';
import CloserEmailCollector from 'closer/components/CloserEmailCollector';
import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';
import { Button } from 'closer/components/ui';

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
  const communitiesRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState({
    vision: false,
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
    createObserver(communitiesRef, 'communities');
    createObserver(benefitsRef, 'benefits');
    createObserver(pricingRef, 'pricing');

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <Head>
        <title>Closer — Decentralized Autonomous Villages</title>
        <meta
          name="description"
          content="The operating system for regenerative communities. Manage guests, spaces, events and resources. Token-powered governance when you're ready."
        />
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
            Closer bridges <em className="italic">indigenous wisdom</em> with exponential technology. An integrated suite of tools that reduce operational complexity while increasing transparency, participation, and resilience — working towards solving the tragedy of the commons.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={communitiesRef}
        id="features"
        className={`py-32 md:py-48 bg-black transition-opacity duration-1000 -mx-4 md:-mx-0 ${
          isVisible.communities ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-12">Platform</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            <div className="bg-black p-12">
              <h3 className="font-serif text-2xl mb-4">Booking System</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Streamline guest bookings, volunteer stays, and resident accommodations. Process payments, manage check-ins with calendar views and automated notifications.
              </p>
            </div>
            <div className="bg-black p-12">
              <h3 className="font-serif text-2xl mb-4">Events & Ticketing</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Create workshops, gatherings, and educational events. Integrated ticketing handles registration, payments, and attendee communication.
              </p>
            </div>
            <div className="bg-black p-12">
              <h3 className="font-serif text-2xl mb-4">Subscriptions & Payments</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Manage memberships with recurring support. Create subscription tiers that reinforce your community&apos;s values and sustain operations.
              </p>
            </div>
            <div className="bg-black p-12">
              <h3 className="font-serif text-2xl mb-4">Inventory</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Manage shared spaces, tools, and equipment through a flexible system. Set availability, track usage by membership level.
              </p>
            </div>
            <div className="bg-black p-12">
              <h3 className="font-serif text-2xl mb-4">Learning Hub</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Preserve community wisdom through documentation, course creation, and skill-sharing. Create a living repository that can be taught and monetized.
              </p>
            </div>
            <div className="bg-black p-12">
              <h3 className="font-serif text-2xl mb-4">Governance & Tokens</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Native Tokens, Proof of Presence, Proof of Sweat. Reward participation, distribute decision-making, create sustainable economic models.
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
            className="text-[#2d5a27] text-base hover:underline"
          >
            Visit traditionaldreamfactory.com →
          </Link>
        </div>
      </section>

      {/* Communities Map Section */}
      <section
        ref={communitiesRef}
        className={`py-32 md:py-48 bg-black transition-opacity duration-1000 -mx-4 md:-mx-0 ${
          isVisible.communities ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-[5vw]">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-4">Network</p>
            <h2 className="font-serif text-4xl md:text-5xl mb-6">
              A growing network
            </h2>
            <p className="text-lg text-[#86868b] max-w-2xl mx-auto">
              Regenerative communities around the world building the future of autonomous governance
            </p>
          </div>
          
          <div className="mb-16">
            <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-white/10">
              <CommunityMap />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link
              href="https://www.traditionaldreamfactory.com/"
              target="_blank"
              className="group bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
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
                <h4 className="text-sm font-medium mb-1 text-white">Traditional Dream Factory</h4>
                <p className="text-xs text-[#86868b] line-clamp-2">
                  Regenerative community in Portugal
                </p>
              </div>
            </Link>

            <Link
              href="https://www.fozdacova.world"
              target="_blank"
              className="group bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
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
                <h4 className="text-sm font-medium mb-1 text-white">Foz Da Cova</h4>
                <p className="text-xs text-[#86868b] line-clamp-2">
                  Mountain hamlet restoration
                </p>
              </div>
            </Link>

            <Link
              href="https://www.earthbound.eco"
              target="_blank"
              className="group bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
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
                <h4 className="text-sm font-medium mb-1 text-white">Earthbound</h4>
                <p className="text-xs text-[#86868b] line-clamp-2">
                  A regenerative & intentional community
                </p>
              </div>
            </Link>

            <Link
              href="https://www.moos.eco"
              target="_blank"
              className="group bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
            >
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
                <h4 className="text-sm font-medium mb-1 text-white">Moos</h4>
                <p className="text-xs text-[#86868b] line-clamp-2">
                  Co-living and creative space
                </p>
              </div>
            </Link>

            <Link
              href="https://www.lios.eco"
              target="_blank"
              className="group bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
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
                <h4 className="text-sm font-medium mb-1 text-white">Lios</h4>
                <p className="text-xs text-[#86868b] line-clamp-2">
                  Educational gathering and regenerative community
                </p>
              </div>
            </Link>

            <Link
              href="https://www.per-auset.com"
              target="_blank"
              className="group bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
            >
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
                <h4 className="text-sm font-medium mb-1 text-white">Per Auset</h4>
                <p className="text-xs text-[#86868b] line-clamp-2">
                  A restored village on the Nile
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section className="py-32 md:py-48 bg-black text-center -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <h2 className="font-serif text-4xl md:text-6xl mb-8">
            Governance that <em className="italic">scales</em>
          </h2>
          <p className="text-[#86868b] max-w-2xl mx-auto mb-16">
            Equitably distribute decision-making power and create sustainable economic models. Start with basic tools, evolve to decentralized governance when ready.
          </p>
          <div className="flex justify-center gap-16 flex-wrap">
            <div className="max-w-[200px]">
              <h4 className="font-serif text-xl mb-2">Native Tokens</h4>
              <p className="text-sm text-[#86868b]">
                Community-specific tokens for access, voting, and value sharing
              </p>
            </div>
            <div className="max-w-[200px]">
              <h4 className="font-serif text-xl mb-2">Proof of Presence</h4>
              <p className="text-sm text-[#86868b]">
                Reward physical participation and on-site contribution
              </p>
            </div>
            <div className="max-w-[200px]">
              <h4 className="font-serif text-xl mb-2">Proof of Sweat</h4>
              <p className="text-sm text-[#86868b]">
                Recognize labor and active community building
              </p>
            </div>
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
                className="px-4 py-2 bg-white rounded-md font-mono text-xs text-[#6e6e73]"
              >
                {endpoint}
              </span>
            ))}
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
      <section className="py-40 md:py-48 bg-black text-center -mx-4 md:-mx-0">
        <div className="max-w-4xl mx-auto px-6 md:px-[5vw]">
          <h2 className="font-serif text-5xl md:text-7xl mb-8">
            Build your <em className="italic">village</em>
          </h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="large"
              className="px-7 py-3.5 text-base bg-white text-black hover:bg-gray-100 rounded-full"
              onClick={() => {
                setIsOpen(true);
              }}
            >
              Get in touch
            </Button>
            <Link
              href="https://closer.gitbook.io/documentation"
              target="_blank"
              className="px-7 py-3.5 text-base border border-[#6e6e73] text-white hover:border-white rounded-full transition-colors inline-block"
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