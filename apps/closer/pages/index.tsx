import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useContext } from 'react';

import HeroCloser from '@/components/HeroCloser';
import CloserEmailCollector from 'closer/components/CloserEmailCollector';
import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';
import Tag from 'closer/components/Tag';
import { Button } from 'closer/components/ui';
import Card from 'closer/components/ui/Card';
import Heading from 'closer/components/ui/Heading';

import { GeneralConfig, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import {
  BookOpenText,
  Calendar,
  CircleCheckBig,
  Globe,
  House,
  TicketCheck,
  Users,
} from 'lucide-react';
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

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta
          name="description"
          content="Manage guests, spaces, events and resources through one intuitive platform designed specifically for land-based projects"
        />
      </Head>

      <CloserEmailCollector />

      <HeroCloser />

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

      {/* Features Section */}
      <section id="features" className="features py-32  bg-white">
        <div className="features-container max-w-6xl mx-auto">
          <Heading
            level={2}
            className="features-title mb-8 text-3xl font-bold text-center"
          >
            Community Building Tools
          </Heading>
          <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Booking Icon */}

                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <Heading level={3} className=" mb-2 text-xl font-semibold">
                Booking & Stay Management
              </Heading>
              <p className="feature-desc">
                Streamline guest bookings, volunteer stays, and resident
                accommodations all in one system. Process payments, manage
                check-ins, and eliminate spreadsheet chaos with intuitive
                calendar views and automated notifications.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Event Icon */}

                <TicketCheck className="w-8 h-8 text-green-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Event Coordination & Ticketing
              </Heading>
              <p className="feature-desc">
                Create and manage workshops, gatherings, and educational events
                with ease. Our integrated ticketing system handles registration,
                payments, and attendee communication with a unified calendar
                view for your community&apos;s activities.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Resource Icon */}
                <House className="w-8 h-8 text-yellow-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Resource & Space Sharing
              </Heading>
              <p className="feature-desc">
                Manage your community&apos;s shared spaces, tools, and equipment
                through a flexible inventory system. Set availability, track
                usage, and organize resources with different access settings
                based on membership levels and pricing options.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Membership Icon */}
                <Users className="w-8 h-8 text-red-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Membership & Community Engagement
              </Heading>
              <p className="feature-desc">
                Create meaningful connections with member profiles, role
                management, and automated notifications. Manage subscriptions
                for recurring support and enable the community vouching system
                to build trust and belonging among members.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Learning Icon */}
                <BookOpenText className="w-8 h-8 text-violet-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Learning Hub & Knowledge Sharing
              </Heading>
              <p className="feature-desc">
                Preserve and share community wisdom through collaborative
                documentation, course creation, and skill-sharing initiatives.
                Create a living repository of your community&apos;s practices
                that can be shared, taught, and even monetized through
                subscription access.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Governance Icon */}
                <Globe className="w-8 h-8 text-teal-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Governance & Token System
              </Heading>
              <p className="feature-desc">
                Build toward community ownership with innovative features like
                Native Tokens, Proof of Presence, and Proof of Sweat. Start with
                basic tools and gradually transition to transparent governance
                and decentralized decision-making when your community is ready.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects/Communities Section */}
      <section id="communities" className="py-32">
        <div className="max-w-6xl mx-auto">
          <Heading
            level={2}
            className="section-title mb-4 text-3xl font-bold text-center"
          >
            Thriving Communities
          </Heading>
          <p className="section-subtitle text-center mb-8">
            Explore how diverse communities are using Closer to create
            meaningful connection and impact
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Cards - static for now, can be mapped from data */}
            <Card className="border border-transparent flex flex-col gap-4 w-full   hover:border-gray-400 hover:border">
              <Link
                href="https://www.traditionaldreamfactory.com/"
                target="_blank"
                className="w-full flex flex-col gap-4 "
              >
                <div className="w-full">
                  <Image
                    src="/images/communities/tdf.jpg"
                    alt="Traditional Dream Factory community"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full "
                  />
                </div>
                <div className=" flex flex-col ">
                  <Heading
                    level={3}
                    className="project-title mb-2 text-xl font-semibold"
                  >
                    Traditional Dream Factory
                  </Heading>
                  <p className="project-description mb-4">
                    A regenerative community in Portugal pioneering innovations
                    in governance and community living. Closer provides token
                    based fundraising and governance systems, in addition to the
                    management of guest stays, volunteer programs, and their
                    vibrant events calendar.
                  </p>
                  <div className="project-tags flex flex-wrap gap-2 mb-4">
                    <Tag color="neutral">Regenerative Living</Tag>
                    <Tag color="neutral">Token Governance</Tag>
                    <Tag color="neutral">Land Stewardship</Tag>
                    <Tag color="neutral">Learning hub</Tag>
                    <Tag color="neutral">Fundraising</Tag>
                  </div>
                </div>
              </Link>
            </Card>

            <Card className="border border-transparent flex flex-col gap-4 w-full   hover:border-gray-400 hover:border">
              <Link
                href="https://www.fozdacova.world"
                target="_blank"
                className="w-full flex flex-col gap-4 "
              >
                <div className="w-full">
                  <Image
                    src="/images/communities/foz.jpg"
                    alt="Foz Da Cova community"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full "
                  />
                </div>
                <div className=" flex flex-col ">
                  <Heading
                    level={3}
                    className="project-title mb-2 text-xl font-semibold"
                  >
                    Foz Da Cova
                  </Heading>
                  <p className="project-description mb-4">
                    A once-abandoned mountain hamlet near Coimbra, Portugal, Foz
                    da Cova is being re-awakened into a self-sustaining haven of
                    fresh spring water, creative studios, and ancient Roman
                    terraces. Closer streamlines their guest bookings, and an
                    ever-growing calendar of regenerative projects and events.
                  </p>
                  <div className="project-tags flex flex-wrap gap-2 mb-4">
                    <Tag color="neutral">Regenerative Living</Tag>
                    <Tag color="neutral">Land Stewardship</Tag>
                  </div>
                </div>
              </Link>
            </Card>
            <Card className="border border-transparent flex flex-col gap-4 w-full   hover:border-gray-400 hover:border">
              <Link
                href="https://www.earthbound.eco"
                target="_blank"
                className="w-full flex flex-col gap-4 "
              >
                <div className="w-full">
                  <Image
                    src="/images/communities/earthbound.jpg"
                    alt="Earthbound community"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full "
                  />
                </div>
                <div className=" flex flex-col ">
                  <Heading
                    level={3}
                    className="project-title mb-2 text-xl font-semibold"
                  >
                    Earthbound
                  </Heading>
                  <p className="project-description mb-4">
                    Earthbound is a 30-person ecovillage and rural think-tank in
                    southern Sweden, stewarding 73 ha of lake, ancient forest,
                    and heritage buildings. Their B&B and cultural hub advance a
                    holistic, locally rooted transition toward regenerative
                    living. Closer provides tools for their B&B management,
                    events, memberships and fundraising.
                  </p>
                  <div className="project-tags flex flex-wrap gap-2 mb-4">
                    <Tag color="neutral">Regenerative Living</Tag>
                    <Tag color="neutral">Land Stewardship</Tag>
                    <Tag color="neutral">Fundraising</Tag>
                  </div>
                </div>
              </Link>
            </Card>
            <Card className="border border-transparent flex flex-col gap-4 w-full  justify-between hover:border-gray-400 hover:border">
              <Link
                href="https://per-auset-git-develop-closerdao.vercel.app/"
                target="_blank"
                className="w-full flex flex-col gap-4 "
              >
                <div className="w-full">
                  <Image
                    src="/images/communities/per-auset.jpg"
                    alt="Per Auset community"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full "
                  />
                </div>
                <div className=" flex flex-col ">
                  <Heading
                    level={3}
                    className="project-title mb-2 text-xl font-semibold"
                  >
                    Per Auset
                  </Heading>
                  <p className="project-description mb-4">
                    Per Auset is a temple village and land regeneration project
                    on a sacred Nile island in southern Egypt, near the ancient
                    Temple of Isis. Blending heritage revival with daily
                    rituals, art, and eco-conscious living, it offers a space
                    for healing, creativity, and sacred remembrance. Closer
                    provides a platform for their space management, events, and
                    subscription plans.
                  </p>
                  <div className="project-tags flex flex-wrap gap-2 mb-4">
                    <Tag color="neutral">Regenerative Living</Tag>
                    <Tag color="neutral">Fundraising</Tag>
                    <Tag color="neutral">Land Stewardship</Tag>
                  </div>
                </div>
              </Link>
            </Card>
            <Card className="border border-transparent flex flex-col gap-4 w-full  justify-between hover:border-gray-400 hover:border">
              <Link
                href="https://www.moos.garden"
                target="_blank"
                className="w-full flex flex-col gap-4 "
              >
                <div className="w-full">
                  <Image
                    src="/images/communities/moos.jpg"
                    alt="Moos Berlin community"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full "
                  />
                </div>
                <div className=" flex flex-col ">
                  <Heading
                    level={3}
                    className="project-title mb-2 text-xl font-semibold"
                  >
                    Moos
                  </Heading>
                  <p className="project-description mb-4">
                    MOOS is a creative hub and community space across from
                    Berlin&apos;s Treptower Park, where interdisciplinary ideas
                    and people connect. With The Y Berlin as its design lab, it
                    explores how technology and intentional community can shape
                    more meaningful urban living. Closer helps them manage their
                    space, events, and fundraising efforts.
                  </p>
                  <div className="project-tags flex flex-wrap gap-2 mb-4">
                    <Tag color="neutral">Regenerative Living</Tag>
                    <Tag color="neutral">Fundraising</Tag>
                  </div>
                </div>
              </Link>
            </Card>
            <Card className="border border-transparent flex flex-col gap-4 w-full  justify-between hover:border-gray-400 hover:border">
              <Link
                href="https://experience.lios.io/"
                target="_blank"
                className="w-full flex flex-col gap-4 "
              >
                <div className="w-full">
                  <Image
                    src="/images/communities/lios.jpg"
                    alt="Lios Labs community"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full "
                  />
                </div>
                <div className=" flex flex-col ">
                  <Heading
                    level={3}
                    className="project-title mb-2 text-xl font-semibold"
                  >
                    Lios Labs
                  </Heading>
                  <p className="project-description mb-4">
                    Rooted in biomimicry, this non-profit lab prototypes new
                    models for culture and ecological learning—blending art,
                    ancestral wisdom, healing, science, and tech to spread
                    regenerative practices. Closer is a platform for hosting
                    their learning programs, events, and fundraising efforts.
                  </p>
                  <div className="project-tags flex flex-wrap gap-2 mb-4">
                    <Tag color="neutral">Regenerative Living</Tag>
                    <Tag color="neutral">Learning hub</Tag>
                    <Tag color="neutral">Fundraising</Tag>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Growth Path Section */}
      <section id="journey" className="py-32   bg-white">
        <div className="max-w-4xl mx-auto">
          <Heading
            level={2}
            className="section-title mb-4 text-3xl font-bold text-center"
          >
            Your Community&apos;s Growth Journey
          </Heading>
          <p className="section-subtitle text-center mb-8">
            Closer grows with you, from solving day-to-day operations to
            building regenerative governance systems
          </p>
          <div className="flex flex-col gap-12 mt-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-start relative">
              <div className="bg-neutral rounded-full w-16 h-16 flex items-center justify-center mr-6 mb-4 md:mb-0 z-10">
                <span className="text-2xl font-bold text-[#222]">1</span>
              </div>
              <div className="flex-1">
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  Streamline Operations
                </Heading>
                <p className="text-gray-600 mb-2">
                  Begin with the essentials: booking management, space
                  coordination, and event planning. Eliminate spreadsheet chaos
                  and reduce administrative overhead so you can focus on your
                  community&apos;s core mission.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag color="primary" size="small">
                    Booking System
                  </Tag>
                  <Tag color="primary" size="small">
                    Event Management
                  </Tag>
                  <Tag color="primary" size="small">
                    Resource Tracking
                  </Tag>
                </div>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-start relative">
              <div className="bg-neutral rounded-full w-16 h-16 flex items-center justify-center mr-6 mb-4 md:mb-0 z-10">
                <span className="text-2xl font-bold text-[#222]">2</span>
              </div>
              <div className="flex-1">
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  Build Community Engagement
                </Heading>
                <p className="text-gray-600 mb-2">
                  As your community grows, leverage Closer&apos;s membership and
                  knowledge-sharing tools to deepen connections and preserve
                  collective wisdom. Create subscription tiers and learning
                  resources that reinforce your community&apos;s values.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag color="primary" size="small">
                    Membership System
                  </Tag>
                  <Tag color="primary" size="small">
                    Learning Hub
                  </Tag>
                  <Tag color="primary" size="small">
                    Subscriptions
                  </Tag>
                </div>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-start relative">
              <div className="bg-neutral rounded-full w-16 h-16 flex items-center justify-center mr-6 mb-4 md:mb-0 z-10">
                <span className="text-2xl font-bold text-[#222]">3</span>
              </div>
              <div className="flex-1">
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  Evolve to Regenerative Governance
                </Heading>
                <p className="text-gray-600 mb-2">
                  When your community is ready, explore Closer&apos;s innovative
                  Web3 features—Native Tokens, Proof of Presence, and Proof of
                  Sweat—to create transparent governance systems that reward
                  active participation and care for your shared resources.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag color="primary" size="small">
                    Community Tokens
                  </Tag>
                  <Tag color="primary" size="small">
                    Proof of Presence
                  </Tag>
                  <Tag color="primary" size="small">
                    Decentralized Governance
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto">
          <Heading
            level={2}
            className="section-title mb-4 text-3xl font-bold text-center"
          >
            Choose Your Scale
          </Heading>
          <p className="section-subtitle text-center mb-20">
            Select the plan that best fits your community&apos;s size and needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {/* Seed Plan */}

            <Card className="bg-white border border-gray-100 p-8 flex flex-col justify-start">
              <div className="flex flex-col border-b h-[280px] justify-between">
                <div>
                  <Heading level={3} className="mb-2 text-2xl font-semibold">
                    Seed
                  </Heading>
                  <p className="text-gray-500 mb-4">
                    Perfect for small co-living spaces and communities.
                    Everything you need to run your community day-to-day
                  </p>
                </div>
                <div className="mb-4 space-y-2 h-[130px]">
                  <p className="text-5xl font-bold ">€990</p>
                  <p className="text-gray-500 text-sm">One-time setup fee</p>
                  <p className="text-gray-500 text-sm">
                    5% transaction fee on bookings and purchases*
                  </p>
                </div>
              </div>

              <ul className="list-none p-0 mb-4 w-full">
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Booking System & Calendar Management
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Event Management & Ticketing
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  User Management & Profiles
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Payment Processing & Subscriptions
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Resource & Space Management
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Learning Hub & Knowledge Sharing
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Private API Access
                </li>
              </ul>
            </Card>
            {/* Plant Plan */}
            <Card className="bg-white border-2 border-accent-alt p-8 flex flex-col justify-start relative shadow-lg">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r to-accent-alt from-accent text-white px-6 py-2 rounded-full font-semibold text-sm">
                Popular
              </div>

              <div className="flex flex-col border-b h-[280px] justify-between">
                <div>
                  <Heading level={3} className="mb-2 text-2xl font-semibold">
                    Plant
                  </Heading>
                  <p className="text-gray-500 mb-4">
                    Build transparent, participatory community governance
                  </p>
                </div>
                <div className="mb-4 space-y-2 h-[130px]">
                  <p className="text-5xl font-bold ">€4,950</p>
                  <p className="text-gray-500 text-sm">One-time setup fee</p>
                  <p className="text-gray-500 text-sm">
                    5% transaction fee on bookings and purchases*
                  </p>
                </div>
              </div>

              <ul className="list-none p-0 mb-4 w-full">
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Native Community Tokens
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Proof of Presence Tracking
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Proof of Sweat Recognition
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Governance & Voting Systems
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Web3 Integrations (Snapshot, Safe)
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Citizenship Program & Vouching
                </li>
              </ul>
            </Card>
            {/* Forest Plan */}
            <Card className="bg-white border border-gray-100 p-8 flex flex-col justify-start">
              <div className="flex flex-col border-b h-[280px] justify-between">
                <div>
                  <Heading level={3} className="mb-2 text-2xl font-semibold">
                    Forest
                  </Heading>
                  <p className="text-gray-500 mb-4">
                    Scale your regenerative impact across multiple locations
                  </p>
                </div>
                <div className="mb-4 space-y-2 h-[130px]">
                  <p className="text-3xl font-bold ">Contact us</p>
                  <p className="text-gray-500 text-sm">
                    Custom pricing based on your needs
                  </p>
                </div>
              </div>

              <ul className="list-none p-0 mb-4 w-full">
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Operate across multiple land projects
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Cross-Site Token Integration
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Network-Wide Analytics
                </li>
                <li className="flex mb-2 ">
                  <CircleCheckBig className="w-5 h-5 text-accent-alt  mr-2 mt-0.5" />
                  Custom AI agent
                </li>
              </ul>

              <p>Coming soon</p>
            </Card>
          </div>
          <p className="text-xs text-gray-400 mt-8">
            * Transaction fees can be reduced based on your community&apos;s
            verified regenerative practices. The more regenerative impact you
            create, the lower your fees become.
          </p>
        </div>
      </section>

      {/* Email Collector/CTA Section */}
      <section className="email-collector py-16 bg-white">
        <div className="email-container max-w-xl mx-auto text-center">
          <Heading level={2} className="email-title mb-4 text-3xl font-bold">
            Ready to Start Your Journey?
          </Heading>
          <p className="email-description mb-8">
            Join the growing network of regenerative communities powered by
            Closer.
          </p>
          <Button
            size="medium"
            className=" px-8 py-2 text-lg"
            variant="primary"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            Schedule a demo
          </Button>
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
