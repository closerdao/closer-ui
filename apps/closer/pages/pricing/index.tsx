import Head from 'next/head';
import Link from 'next/link';

import { useContext } from 'react';

import { PromptGetInTouchContext } from 'closer/components/PromptGetInTouchContext';
import { GeneralConfig, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';

import { NextPageContext } from 'next';

interface Props {
  generalConfig: GeneralConfig | null;
}

const PricingPage = ({ generalConfig }: Props) => {
  const { setIsOpen } = useContext(PromptGetInTouchContext) as {
    setIsOpen: (open: boolean) => void;
  };

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const plans = [
    {
      name: 'Seed',
      price: '€990',
      period: 'one-time',
      feeNote: '5% transaction fee',
      description: 'Everything you need to run your community day-to-day',
      features: [
        'Booking system & calendar',
        'Event management & ticketing',
        'User management & profiles',
        'Payment processing & subscriptions',
        'Resource & space management',
        'Learning hub & knowledge sharing',
        'API access',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Plant',
      price: '€4,950',
      period: 'one-time',
      feeNote: '5% transaction fee',
      description: 'Build transparent, participatory community governance',
      features: [
        'Everything in Seed',
        'Native community tokens',
        'Proof of Presence tracking',
        'Proof of Sweat recognition',
        'Governance & voting systems',
        'Web3 integrations (Snapshot, Safe)',
        'Citizenship program & vouching',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Forest',
      price: 'Custom',
      period: '',
      feeNote: 'Tailored to your needs',
      description: 'Scale your regenerative impact across multiple locations',
      features: [
        'Everything in Plant',
        'Multi-site operations',
        'Cross-site token integration',
        'Network-wide analytics',
        'Custom AI agent',
        'Dedicated support',
      ],
      cta: 'Contact Us',
      highlighted: false,
    },
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      <Head>
        <title>Pricing — Closer</title>
        <meta
          name="description"
          content="Simple, transparent pricing for regenerative communities. Start free, scale as you grow."
        />
      </Head>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-[5vw]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Pricing</p>
          <h1 className="font-serif text-5xl md:text-7xl mb-6">
            Simple, <em className="italic">transparent</em> pricing
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto">
            One-time setup. Transaction fees that fund the commons. No monthly subscriptions.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 md:px-[5vw]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col relative ${
                  plan.highlighted
                    ? 'bg-white text-black ring-2 ring-[#79FAC1]'
                    : 'bg-[#1d1d1f] text-white'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#79FAC1] text-black text-xs font-medium px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="font-serif text-2xl mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-gray-600' : 'text-[#86868b]'}`}>
                  {plan.description}
                </p>
                <div className="mb-2">
                  <span className="text-4xl font-medium">{plan.price}</span>
                </div>
                <div className={`text-sm mb-6 ${plan.highlighted ? 'text-gray-500' : 'text-[#86868b]'}`}>
                  {plan.period && <span>{plan.period} setup fee</span>}
                  {plan.period && plan.feeNote && <span className="mx-1">·</span>}
                  <span>{plan.feeNote}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-[#79FAC1] mt-0.5">✓</span>
                      <span className={`text-sm ${plan.highlighted ? 'text-gray-700' : 'text-[#a1a1a6]'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsOpen(true)}
                  className={`w-full py-3 rounded-full text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commons Protocol Section */}
      <section className="py-32 px-6 md:px-[5vw] bg-[#1d1d1f]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-[#86868b] mb-4">Our Philosophy</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-8">
            Building a <em className="italic">commons</em> protocol
          </h2>
          <div className="space-y-6 text-lg text-[#a1a1a6] leading-relaxed">
            <p>
              Closer is more than software — it&apos;s an experiment in building digital infrastructure as a commons. 
              We believe the tools that help communities organize should belong to those communities, not be extracted from them.
            </p>
            <p>
              Our long-term vision is for Closer to become a <strong className="text-white">commons protocol</strong> where 
              transaction fees from the network flow back into development, benefiting all members. As the network grows, 
              the cost per community decreases while the shared infrastructure becomes more robust.
            </p>
            <p>
              Every community using Closer contributes to and benefits from this shared foundation. The more villages 
              that join, the more resilient and feature-rich the platform becomes — a true network effect in service 
              of regeneration rather than extraction.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-[#79FAC1] text-3xl mb-3">∞</div>
              <h4 className="font-serif text-xl mb-2">Shared Infrastructure</h4>
              <p className="text-sm text-[#86868b]">
                Every improvement benefits all communities. Bug fixes, new features, and security updates flow to everyone.
              </p>
            </div>
            <div>
              <div className="text-[#79FAC1] text-3xl mb-3">↻</div>
              <h4 className="font-serif text-xl mb-2">Circular Economics</h4>
              <p className="text-sm text-[#86868b]">
                Transaction fees fund development. As the network grows, per-community costs decrease while capabilities increase.
              </p>
            </div>
            <div>
              <div className="text-[#79FAC1] text-3xl mb-3">◇</div>
              <h4 className="font-serif text-xl mb-2">Community Governance</h4>
              <p className="text-sm text-[#86868b]">
                Moving toward shared ownership and decision-making. The communities using Closer will shape its future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 md:px-[5vw]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-4xl mb-12 text-center">Frequently asked questions</h2>
          <div className="space-y-8">
            <div>
              <h4 className="font-medium text-lg mb-2">How does the transaction fee work?</h4>
              <p className="text-[#86868b]">
                We charge 5% on bookings and purchases processed through Closer. This covers payment processing, 
                ongoing platform maintenance, and contributes to the commons infrastructure that benefits all communities.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2">Can I upgrade from Seed to Plant later?</h4>
              <p className="text-[#86868b]">
                Absolutely. You can upgrade anytime by paying the difference in setup fees. Your existing 
                data, bookings, and member information are preserved.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2">What payment methods do you accept?</h4>
              <p className="text-[#86868b]">
                We accept major credit cards, SEPA bank transfers, and cryptocurrency payments 
                for communities ready to embrace web3.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2">What&apos;s included in the setup?</h4>
              <p className="text-[#86868b]">
                Setup includes platform configuration, custom domain setup, initial training session, 
                data migration assistance, and 30 days of dedicated onboarding support.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2">What does &quot;commons protocol&quot; mean for pricing?</h4>
              <p className="text-[#86868b]">
                Transaction fees flow back into development, benefiting all communities in the network. 
                As more villages join, the shared infrastructure becomes more robust — a true network effect 
                in service of regeneration rather than extraction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 md:px-[5vw] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-5xl md:text-6xl mb-8">
            Ready to <em className="italic">start</em>?
          </h2>
          <p className="text-[#86868b] text-lg mb-12 max-w-xl mx-auto">
            Join the network of regenerative communities building the future together.
          </p>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <button
              onClick={() => setIsOpen(true)}
              className="px-7 py-3.5 text-base bg-white text-black hover:bg-gray-100 rounded-full transition-colors font-medium"
            >
              Get in touch
            </button>
            <Link
              href="/"
              className="px-7 py-3.5 text-base border border-white/30 text-white hover:border-white rounded-full transition-colors font-medium"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

PricingPage.getInitialProps = async (context: NextPageContext) => {
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

export default PricingPage;

