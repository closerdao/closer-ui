import Head from 'next/head';
import Image from 'next/image';

import { Heading, LinkButton } from 'closer/components/ui';

import { PageNotFound, useAuth } from 'closer';
import api from 'closer/utils/api';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { Check, ChevronDown, Gift, Wallet, Calendar, Users, Sparkles } from 'lucide-react';
import { NextPageContext } from 'next';
import { useState } from 'react';

interface AirdropConfig {
  enabled: boolean;
  description?: string;
}

interface Props {
  airdropConfig: AirdropConfig | null;
}

const DEFAULT_AIRDROP_CONFIG: AirdropConfig = {
  enabled: true,
  description: 'Reward community members with token airdrops for participation.',
};

const AirdropPage = ({ airdropConfig }: Props) => {
  const { user } = useAuth();
  const [showHistoricDetails, setShowHistoricDetails] = useState(false);
  
  const config = airdropConfig || DEFAULT_AIRDROP_CONFIG;
  const isWeb3Enabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isAirdropEnabled = isWeb3Enabled && config.enabled;

  if (!isAirdropEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>$TDF Airdrops | Traditional Dream Factory</title>
        <meta name="description" content="Join the TDF community and qualify for future token airdrops. Connect your wallet, visit, volunteer, and participate to earn rewards." />
        <meta property="og:type" content="website" />
      </Head>

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-accent/5 via-purple-50 to-pink-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-accent/20 mb-6">
              <Gift className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-gray-700">Community Rewards Program</span>
            </div>
            
            <Heading
              level={1}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            >
              $TDF Airdrops
            </Heading>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              We reward our community with token airdrops. Connect your wallet, visit TDF, 
              and participate in governance to qualify for future drops.
            </p>

            {!user ? (
              <LinkButton href="/signup" variant="primary" className="px-8">
                Create account to get started
              </LinkButton>
            ) : !user.walletAddress ? (
              <LinkButton href={`/members/${user.slug}`} variant="primary" className="px-8">
                <Wallet className="w-4 h-4 mr-2" />
                Connect wallet to qualify
              </LinkButton>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <Check className="w-4 h-4" />
                <span className="font-medium">Wallet connected — you&apos;re eligible!</span>
              </div>
            )}
          </div>
        </section>

        {/* How to Qualify Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                How to qualify for future airdrops
              </Heading>
              <p className="text-gray-600 max-w-xl mx-auto">
                The more you engage with TDF, the more rewards you can earn. Here&apos;s how to increase your eligibility.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Connect your wallet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Link a Web3 wallet to your TDF account. This is required to receive any airdrop.
                </p>
                {user && !user.walletAddress && (
                  <LinkButton href={`/members/${user?.slug}`} variant="secondary" size="small">
                    Connect now
                  </LinkButton>
                )}
                {user?.walletAddress && (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <Check className="w-4 h-4" /> Connected
                  </span>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Visit TDF</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Book a stay at TDF. Nights spent on-site significantly boost your airdrop allocation.
                </p>
                <LinkButton href="/stay" variant="secondary" size="small">
                  Book a stay
                </LinkButton>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Volunteer</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Contribute your skills for at least 2 weeks. Volunteers receive bonus allocations.
                </p>
                <LinkButton href="/volunteer" variant="secondary" size="small">
                  Apply to volunteer
                </LinkButton>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Buy $TDF tokens</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Token holders who purchase through our sale contract are automatically eligible.
                </p>
                <LinkButton href="/token" variant="secondary" size="small">
                  Get $TDF
                </LinkButton>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Participate in governance</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vote on proposals through Snapshot. Active governance participants are rewarded.
                </p>
                <LinkButton href="https://snapshot.org/#/tdf.eth" target="_blank" variant="secondary" size="small">
                  View proposals
                </LinkButton>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Attend events</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Join TDF events and gatherings. Event participation counts toward your eligibility.
                </p>
                <LinkButton href="/events" variant="secondary" size="small">
                  View events
                </LinkButton>
              </div>
            </div>
          </div>
        </section>

        {/* Future Airdrops Notice */}
        <section className="py-16 bg-accent/5 border-y border-accent/10">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <Heading level={2} className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Future airdrops coming
            </Heading>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We&apos;re planning more community rewards. Start building your eligibility now by 
              engaging with TDF — every visit, vote, and contribution counts toward future drops.
            </p>
            <LinkButton href="/stay" variant="primary">
              Plan your visit
            </LinkButton>
          </div>
        </section>

        {/* Historic Airdrop Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <button
              onClick={() => setShowHistoricDetails(!showHistoricDetails)}
              className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">2024-2025 Airdrop</h3>
                  <p className="text-sm text-gray-500">Completed — View details</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showHistoricDetails ? 'rotate-180' : ''}`} />
            </button>

            {showHistoricDetails && (
              <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Rewards distributed</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Image src="/images/tdf-logo-small.png" alt="TDF" width={24} height={24} />
                      <span className="font-medium">111 $TDF tokens</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Image src="/images/celo-logo-small.png" alt="CELO" width={24} height={24} />
                      <span className="font-medium">555 $CELO tokens</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Image src="/images/carrot.png" alt="Carrots" width={24} height={24} />
                      <span className="font-medium">555 Carrots</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Distribution schedule</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Summer Solstice 2024 — 50%
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Fall Equinox 2024 — 12.5%
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Winter Solstice 2024 — 12.5%
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Spring Equinox 2025 — 12.5%
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Summer Solstice 2025 — 12.5%
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Qualification criteria</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Presence (nights stayed) — 30%</li>
                    <li>• $TDF purchased — 10%</li>
                    <li>• Governance participation — 10%</li>
                    <li>• Volunteering — 10%</li>
                    <li>• Social mentions — 10%</li>
                    <li>• Referrals — 10%</li>
                    <li>• Event participation — 10%</li>
                    <li>• Nominations — 10%</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 border-t border-gray-200">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <Heading level={2} className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to join the community?
            </Heading>
            <p className="text-gray-600 mb-8 leading-relaxed">
              The best way to qualify for future airdrops is to become an active part of TDF. 
              Visit us, contribute, and help build the regenerative village.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <LinkButton href="/stay" variant="primary">
                Book a stay
              </LinkButton>
              <LinkButton href="/token" variant="secondary">
                Get $TDF tokens
              </LinkButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

AirdropPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [airdropRes, messages] = await Promise.all([
      api.get('/config/airdrop').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    return {
      airdropConfig: airdropRes?.data?.results?.value || null,
      messages,
    };
  } catch (err: unknown) {
    return {
      airdropConfig: null,
      messages: null,
    };
  }
};

export default AirdropPage;
