import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import { Heading, Card, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Coins,
  FileText,
  Globe,
  Heart,
  Home,
  Leaf,
  Map,
  MapPin,
  Sprout,
  TreePine,
  Users,
  Vote,
  Wallet,
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const TOPICS = [
  { id: 'about', label: 'About TDF', icon: Home },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'token', label: '$TDF Token', icon: Coins },
  { id: 'governance', label: 'Governance', icon: Vote },
  { id: 'regeneration', label: 'Regeneration', icon: Leaf },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'oasa', label: 'OASA Network', icon: Globe },
  { id: 'faq', label: 'FAQ', icon: BookOpen },
];

const FAQ_ITEMS = [
  {
    question: 'What is Traditional Dream Factory?',
    answer:
      'Traditional Dream Factory (TDF) is a regenerative co-living village in Abela, Portugal. We combine web3 technology with sustainable living practices to create a community-owned space where members can live, work, and contribute to ecological restoration.',
  },
  {
    question: 'What is the $TDF token and how does it work?',
    answer:
      'The $TDF token is a utility token that grants holders access to TDF facilities. 1 $TDF = 1 night of accommodation. Tokens are staked and can be used to unlock stays at TDF. Token holders also participate in governance decisions through our DAO structure.',
  },
  {
    question: 'How can I visit TDF?',
    answer:
      'You can visit TDF by booking a stay through our platform. We offer various accommodation types including glamping tents, suites, and van parking. You can also attend events or apply for volunteer opportunities to experience the community.',
  },
  {
    question: 'What does "regenerative" mean at TDF?',
    answer:
      'Regenerative means going beyond sustainability—we aim to actively restore and improve the land. This includes rewilding, water restoration, soil building, agroforestry, and creating habitats for wildlife. Our goal is to leave the land better than we found it.',
  },
  {
    question: 'How is TDF governed?',
    answer:
      'TDF operates as a Decentralized Autonomous Organization (DAO) with governance based on three factors: $TDF tokens held, Proof of Presence (time spent at TDF), and Proof of Sweat (contributions to the community). This ensures those most engaged have the most voice.',
  },
  {
    question: 'What is OASA and how does it relate to TDF?',
    answer:
      'OASA is a Swiss association that serves as a land conservation network. TDF is the first village in the OASA network. OASA holds the land in trust, ensuring it can never be sold for profit and must always serve regenerative purposes.',
  },
  {
    question: 'Can I live at TDF permanently?',
    answer:
      'TDF is designed primarily for medium-term stays (weeks to months) rather than permanent residence. However, active community members can extend their stays, and we are developing co-housing options for those seeking longer-term arrangements.',
  },
  {
    question: 'How can I support TDF without visiting?',
    answer:
      'You can support TDF by purchasing $TDF tokens, which directly funds infrastructure development. You can also subscribe to our newsletter, follow our progress, share our mission, or participate in online governance discussions.',
  },
];

const LearnMorePage = () => {
  const t = useTranslations();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      <Head>
        <title>Learn More About TDF - Traditional Dream Factory</title>
        <meta
          name="description"
          content="Learn about Traditional Dream Factory (TDF), a regenerative co-living village in Portugal. Understand our mission, governance, $TDF token, and how to get involved."
        />
      </Head>

      <section className="bg-gradient-to-br from-accent-light/30 to-white py-16 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-widest text-accent-dark mb-4 font-medium">
              Knowledge Base
            </p>
            <Heading
              className="text-3xl md:text-5xl mb-6"
              display
              level={1}
            >
              Understanding Traditional Dream Factory
            </Heading>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Everything you need to know about our regenerative co-living
              village, the $TDF token, governance structure, and how to become
              part of our community.
            </p>

            <div className="flex flex-wrap gap-3">
              <LinkButton href="/stay" variant="primary">
                Book a Stay
              </LinkButton>
              <LinkButton href="/token" variant="secondary">
                Get $TDF Tokens
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => scrollToSection(topic.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-accent hover:bg-accent-light/30 rounded-lg transition-colors whitespace-nowrap"
              >
                <topic.icon className="w-4 h-4" />
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section id="about" className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
                  <Home className="w-6 h-6 text-accent-dark" />
                </div>
                <Heading level={2} className="text-2xl">
                  About TDF
                </Heading>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Traditional Dream Factory is a web3-powered regenerative
                  co-living space in Abela, Portugal. Founded in 2021, we are
                  pioneering a new model for community living that combines
                  modern technology with ancient wisdom about living in harmony
                  with the land.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our mission is to create positive loops in all interactions
                  between stakeholders—including nature, all life, and future
                  generations. We aim to prove that we can optimize resources
                  while nurturing a creative, thriving community that leaves a
                  positive trace on the environment.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  TDF is designed for 80-100 members who continuously return
                  year after year, deepening their connection with the land and
                  each other. It is a modern, comfortable space where friends
                  gather, dreams are pursued, and positive change is driven.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/blog"
                  className="text-sm font-medium text-accent hover:text-accent-dark inline-flex items-center gap-1"
                >
                  Read our blog <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/roadmap"
                  className="text-sm font-medium text-accent hover:text-accent-dark inline-flex items-center gap-1"
                >
                  View roadmap <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6 border-l-4 border-l-accent">
                <Heading level={4} className="mb-2 text-lg">
                  Key Facts
                </Heading>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="font-medium min-w-[100px]">Founded:</span>
                    <span>April 2021</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-medium min-w-[100px]">Location:</span>
                    <span>Abela, Alentejo, Portugal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-medium min-w-[100px]">Land Size:</span>
                    <span>25 hectares (62 acres)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-medium min-w-[100px]">Legal Structure:</span>
                    <span>DAO under OASA (Swiss Association)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-medium min-w-[100px]">Token Holders:</span>
                    <span>280+ community members</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-gray-50">
                <Heading level={4} className="mb-3 text-lg">
                  Annual Reports
                </Heading>
                <p className="text-sm text-gray-600 mb-4">
                  Read our detailed annual reports to understand our progress,
                  finances, and future plans.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['2025', '2024', '2022', '2021'].map((year) => (
                    <Link
                      key={year}
                      href={`/pdf/${year}-TDF-report.pdf`}
                      target="_blank"
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                    >
                      {year} Report
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="location" className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <Heading level={2} className="text-2xl">
              Location & Land
            </Heading>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  TDF is located in the village of <strong>Abela</strong>, in
                  the Alentejo region of Portugal. This rural area is
                  characterized by rolling hills, cork oak forests, and a
                  Mediterranean climate with hot, dry summers and mild winters.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The property was originally a chicken farm, which we purchased
                  in Spring 2021. Since then, we have been transforming it into
                  a regenerative oasis—rewilding degraded areas, restoring water
                  systems, and building sustainable infrastructure.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The land is surrounded by beautiful valleys, protected oak
                  trees, and a river that we are working to restore to
                  year-round flow through water retention techniques.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="p-5">
                  <Heading level={4} className="mb-2 text-base">
                    Getting Here
                  </Heading>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 1.5h from Lisbon Airport</li>
                    <li>• 2h from Faro Airport</li>
                    <li>• Car recommended for access</li>
                    <li>• Coordinates: 38°05&apos;N, 8°28&apos;W</li>
                  </ul>
                </Card>
                <Card className="p-5">
                  <Heading level={4} className="mb-2 text-base">
                    Climate
                  </Heading>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mediterranean climate</li>
                    <li>• Summer: 25-40°C (dry)</li>
                    <li>• Winter: 5-15°C (rainy season)</li>
                    <li>• 300+ sunny days/year</li>
                  </ul>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-5 bg-accent-light/30 border-accent/20">
                <Heading level={4} className="mb-3 text-base">
                  Current Facilities
                </Heading>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    10 Glamping accommodations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    6 Van parking spots
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Co-working space + Starlink
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Industrial kitchen
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Sauna & wellness area
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Event venue (100+ capacity)
                  </li>
                </ul>
              </Card>

              <Link
                href="/impact-map"
                className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Map className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-gray-900">
                      View Impact Map
                    </p>
                    <p className="text-sm text-gray-500">
                      Explore our land projects
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-accent transition-colors" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="token" className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Coins className="w-6 h-6 text-amber-600" />
            </div>
            <Heading level={2} className="text-2xl">
              The $TDF Token
            </Heading>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">
                The $TDF token is the utility token that powers the TDF
                ecosystem. It represents a commitment to our community and
                provides tangible benefits including accommodation access and
                governance rights.
              </p>

              <Card className="p-6 mb-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center text-gray-900 font-bold text-lg">
                    $TDF
                  </div>
                  <div>
                    <Heading level={3} className="text-xl text-white">
                      Token Utility
                    </Heading>
                    <p className="text-gray-400 text-sm">1 $TDF = 1 night</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Home className="w-3 h-3 text-accent" />
                    </span>
                    <span>
                      <strong>Accommodation Access:</strong> Use tokens to
                      unlock stays at TDF facilities
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Vote className="w-3 h-3 text-accent" />
                    </span>
                    <span>
                      <strong>Governance Rights:</strong> Vote on community
                      decisions and proposals
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Heart className="w-3 h-3 text-accent" />
                    </span>
                    <span>
                      <strong>Community Membership:</strong> Join a global
                      network of regenerators
                    </span>
                  </li>
                </ul>
              </Card>

              <div className="flex flex-wrap gap-3">
                <LinkButton href="/token" variant="primary">
                  Buy $TDF Tokens
                </LinkButton>
                <Link
                  href="/token/before-you-begin"
                  className="text-sm font-medium text-accent hover:text-accent-dark inline-flex items-center gap-1 py-2"
                >
                  Token guide <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <Heading level={4} className="mb-4 text-lg">
                  Token Mechanics
                </Heading>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Current Price</span>
                    <span className="font-medium">€256 per token</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Token Type</span>
                    <span className="font-medium">ERC-20 (Celo blockchain)</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Staking</span>
                    <span className="font-medium">Required for utility</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Total Holders</span>
                    <span className="font-medium">280+</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-amber-50 border-amber-200">
                <Heading level={4} className="mb-3 text-base text-amber-900">
                  Important Note
                </Heading>
                <p className="text-sm text-amber-800">
                  $TDF is a utility token, not a financial investment. The
                  primary purpose is to provide access to TDF facilities and
                  governance. Token value may fluctuate and there is no
                  guarantee of returns.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="governance" className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Vote className="w-6 h-6 text-purple-600" />
            </div>
            <Heading level={2} className="text-2xl">
              Governance & DAO
            </Heading>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className="text-gray-700 leading-relaxed mb-6">
                TDF operates as a Decentralized Autonomous Organization (DAO),
                legally recognized in Switzerland through OASA. Our governance
                model ensures that decision-making power is distributed among
                those who contribute to the community, rather than concentrated
                in the hands of a few.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <Card className="p-5 text-center border-t-4 border-t-accent">
                  <Wallet className="w-8 h-8 text-accent mx-auto mb-3" />
                  <Heading level={4} className="text-base mb-2">
                    $TDF Holdings
                  </Heading>
                  <p className="text-sm text-gray-600">
                    Governance weight based on tokens you hold
                  </p>
                </Card>
                <Card className="p-5 text-center border-t-4 border-t-blue-500">
                  <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <Heading level={4} className="text-base mb-2">
                    Proof of Presence
                  </Heading>
                  <p className="text-sm text-gray-600">
                    Weight based on time spent at TDF yearly
                  </p>
                </Card>
                <Card className="p-5 text-center border-t-4 border-t-amber-500">
                  <Heart className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <Heading level={4} className="text-base mb-2">
                    Proof of Sweat
                  </Heading>
                  <p className="text-sm text-gray-600">
                    Weight based on labor contributed to TDF
                  </p>
                </Card>
              </div>

              <Card className="p-6 bg-white">
                <Heading level={4} className="mb-4 text-lg">
                  Governance Principles
                </Heading>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      Decentralization
                    </p>
                    <p className="text-gray-600">
                      Decisions consider all stakeholders including nature and
                      future generations
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      Sociocracy 3.0
                    </p>
                    <p className="text-gray-600">
                      Consent-based decision making for operational matters
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      Transparency
                    </p>
                    <p className="text-gray-600">
                      All proposals and votes are recorded on-chain
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      Regenerative Culture
                    </p>
                    <p className="text-gray-600">
                      Working practices that sustain both people and planet
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Link
                href="/governance"
                className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      View Active Proposals
                    </p>
                    <p className="text-sm text-gray-500">
                      Participate in governance
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
                </div>
              </Link>

              <Link
                href="/citizenship"
                className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      TDF Citizenship
                    </p>
                    <p className="text-sm text-gray-500">
                      Become a full member
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
                </div>
              </Link>

              <Card className="p-5 bg-purple-50 border-purple-200">
                <Heading level={4} className="mb-2 text-base text-purple-900">
                  From Ownership to Stewardship
                </Heading>
                <p className="text-sm text-purple-800">
                  At TDF, we&apos;re exploring models where the land effectively
                  owns itself. The land belongs to OASA, while members have
                  rights to use facilities paired with duties to care for and
                  improve the land.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="regeneration" className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <Heading level={2} className="text-2xl">
              Regeneration & Ecology
            </Heading>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Regeneration is at the heart of everything we do at TDF. We go
                beyond sustainability—actively restoring degraded land,
                increasing biodiversity, and building resilient ecosystems that
                will thrive for generations.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Card className="p-5 bg-green-50 border-green-200">
                  <TreePine className="w-6 h-6 text-green-600 mb-3" />
                  <Heading level={4} className="text-base mb-2">
                    Reforestation
                  </Heading>
                  <p className="text-sm text-gray-700">
                    200+ native trees planted across food forests and
                    reforestation zones
                  </p>
                </Card>
                <Card className="p-5 bg-blue-50 border-blue-200">
                  <Sprout className="w-6 h-6 text-blue-600 mb-3" />
                  <Heading level={4} className="text-base mb-2">
                    Water Restoration
                  </Heading>
                  <p className="text-sm text-gray-700">
                    1.2M liters water retention capacity through swales and
                    ponds
                  </p>
                </Card>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">
                Our approach includes syntropic agroforestry, native species
                rewilding, greywater treatment systems, and comprehensive
                biodiversity monitoring. We work with partners like Open Forest
                Protocol to verify and track our ecological impact.
              </p>

              <div className="flex flex-wrap gap-3">
                <LinkButton href="/pages/ecology" variant="primary">
                  Ecology Deep Dive
                </LinkButton>
                <LinkButton href="/pages/regenerative-agriculture" variant="secondary">
                  Agriculture Practices
                </LinkButton>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <Heading level={4} className="mb-4 text-lg">
                  Ecological Metrics
                </Heading>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">25ha</div>
                    <div className="text-xs text-gray-600">Total Land</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">50%</div>
                    <div className="text-xs text-gray-600">Wild/Rewilded</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">40+</div>
                    <div className="text-xs text-gray-600">Bird Species</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">65+</div>
                    <div className="text-xs text-gray-600">Tree Species</div>
                  </div>
                </div>
              </Card>

              <Link
                href="/impact-map"
                className="block p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white hover:from-green-600 hover:to-green-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Map className="w-6 h-6" />
                  <div>
                    <p className="font-medium">Interactive Impact Map</p>
                    <p className="text-sm text-green-100">
                      Explore our regeneration projects
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <Heading level={2} className="text-2xl">
              Community & Participation
            </Heading>
          </div>

          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            TDF is more than a place—it&apos;s a community of dreamers, doers,
            and regenerators. There are many ways to participate, from short
            visits to becoming a full citizen.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-accent-dark" />
              </div>
              <Heading level={4} className="mb-2">
                Book a Stay
              </Heading>
              <p className="text-sm text-gray-600 mb-4">
                Visit TDF for a few days or weeks. Experience the community
                firsthand.
              </p>
              <Link
                href="/stay"
                className="text-sm font-medium text-accent hover:text-accent-dark"
              >
                View accommodations →
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <Heading level={4} className="mb-2">
                Volunteer
              </Heading>
              <p className="text-sm text-gray-600 mb-4">
                Contribute your skills in exchange for accommodation and meals.
              </p>
              <Link
                href="/volunteer"
                className="text-sm font-medium text-accent hover:text-accent-dark"
              >
                Apply to volunteer →
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-6 h-6 text-amber-600" />
              </div>
              <Heading level={4} className="mb-2">
                Get Tokens
              </Heading>
              <p className="text-sm text-gray-600 mb-4">
                Purchase $TDF tokens for accommodation access and governance
                rights.
              </p>
              <Link
                href="/token"
                className="text-sm font-medium text-accent hover:text-accent-dark"
              >
                Buy tokens →
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <Heading level={4} className="mb-2">
                Become a Citizen
              </Heading>
              <p className="text-sm text-gray-600 mb-4">
                Join as a full community member with extended rights and
                responsibilities.
              </p>
              <Link
                href="/citizenship"
                className="text-sm font-medium text-accent hover:text-accent-dark"
              >
                Learn about citizenship →
              </Link>
            </Card>
          </div>

          <Card className="p-6 bg-white">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <Heading level={4} className="mb-2 text-lg">
                  Join Our Events
                </Heading>
                <p className="text-gray-600">
                  TDF hosts regular events including workshops, retreats, and
                  community gatherings. Events are a great way to experience TDF
                  and meet the community.
                </p>
              </div>
              <LinkButton href="/events" variant="secondary">
                View upcoming events
              </LinkButton>
            </div>
          </Card>
        </div>
      </section>

      <section id="oasa" className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-600" />
            </div>
            <Heading level={2} className="text-2xl">
              OASA Network
            </Heading>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>OASA</strong> (Open Architecture for Shared Autonomy) is
                a Swiss association that functions as a web3-powered nature
                conservancy network. TDF is the first village in the OASA
                network.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                OASA&apos;s mission is to acquire 100,000 hectares of land
                globally to be held in conservation, supporting regenerative
                communities like TDF. The legal structure ensures that land can
                never be sold for private profit and must always serve
                regenerative purposes.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                By being part of OASA, TDF gains legal protection, shared
                resources, and connection to a growing network of regenerative
                villages worldwide.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://oasa.earth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                >
                  Visit OASA.earth
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
              <Heading level={4} className="mb-4 text-lg">
                OASA at a Glance
              </Heading>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-cyan-600" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Swiss Association
                    </p>
                    <p className="text-gray-600">
                      Legal framework providing protection and legitimacy
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-cyan-600" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      100,000 ha Mission
                    </p>
                    <p className="text-gray-600">
                      Goal to conserve land for regenerative communities
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <TreePine className="w-4 h-4 text-cyan-600" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Land Trust Model
                    </p>
                    <p className="text-gray-600">
                      Land held in perpetuity for ecological purposes
                    </p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gray-700" />
            </div>
            <Heading level={2} className="text-2xl">
              Frequently Asked Questions
            </Heading>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-5 pb-5 text-gray-600 border-t border-gray-100 pt-4">
                    {item.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Want to stay updated or have more questions?</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://t.me/traditionaldreamfactor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006699] text-white rounded-lg transition-colors text-sm font-medium"
              >
                Follow on Telegram
              </a>
              <Link
                href="/ask"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors text-sm font-medium"
              >
                Ask a question
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

LearnMorePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err) {
    return {
      messages: null,
    };
  }
};

export default LearnMorePage;
