import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const TeamPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>Team — Traditional Dream Factory</title>
        <meta name="description" content="Meet the team building Europe's first regenerative village" />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/team"
          key="canonical"
        />
      </Head>

      <main>
        <section className="bg-white border-b border-gray-200 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Heading
              className="mb-6 text-5xl md:text-6xl font-normal text-gray-900 tracking-tight leading-tight font-serif"
              display
              level={1}
            >
              Our Team
            </Heading>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A decentralized collective of builders, dreamers, and land stewards creating Europe's first regenerative village.
            </p>
          </div>
        </section>

        <section className="py-12 px-6 bg-gray-50 border-y border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h3 className="font-semibold mb-2">OASA Association</h3>
                <p className="text-sm text-gray-600">Swiss non-profit overseeing land conservation and governance across the network</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗳️</span>
                </div>
                <h3 className="font-semibold mb-2">TDF DAO</h3>
                <p className="text-sm text-gray-600">Community governance through token holders, citizens, and the citizen assembly</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold mb-2">Executive Team</h3>
                <p className="text-sm text-gray-600">Day-to-day operations, development, and strategic direction</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-accent text-gray-800 text-sm px-4 py-1 rounded-full font-medium">Executive Team</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">Leadership</Heading>
              <p className="text-gray-600">Strategic real estate development and operational direction given by the DAO.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-6 p-6 bg-gray-50 rounded-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent-alt rounded-full flex-shrink-0 flex items-center justify-center text-3xl">
                  👨‍💼
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Samuel Delesque</h3>
                  <p className="text-accent-dark font-medium">Executive Director</p>
                  <p className="text-sm text-gray-600 mt-2">Franco-Danish entrepreneur and former software engineer. Founded TDF with a vision of moving "from ownership to stewardship."</p>
                  <div className="flex gap-3 mt-3">
                    <a href="https://twitter.com/samdelesque" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="https://www.linkedin.com/in/samdelesque/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 p-6 bg-gray-50 rounded-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center text-3xl">
                  📊
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Peter Koll</h3>
                  <p className="text-blue-600 font-medium">Finance Ops</p>
                  <p className="text-sm text-gray-600 mt-2">Day-to-day financial operations, budgeting, and treasury management for TDF.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-accent/20">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-white text-gray-800 text-sm px-4 py-1 rounded-full font-medium">Operations</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">On-the-Ground Teams</Heading>
              <p className="text-gray-600">The people making magic happen every day at TDF.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🏨</div>
                  <div>
                    <h3 className="text-xl font-semibold">Hospitality Team</h3>
                    <p className="text-sm text-gray-500">Assembled over 2026</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">Run a profitable rural tourism operation with high guest satisfaction.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-lg">🌟</div>
                    <div>
                      <p className="font-medium">Luna Mangan</p>
                      <p className="text-sm text-gray-500">Hospitality Manager</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">👨‍🍳</div>
                    <div>
                      <p className="font-medium text-gray-700">Kitchen Lead</p>
                      <p className="text-sm text-gray-400">Position open</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🍳</div>
                    <div>
                      <p className="font-medium text-gray-700">Kitchen Support</p>
                      <p className="text-sm text-gray-400">Position open</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🧹</div>
                    <div>
                      <p className="font-medium text-gray-700">Housekeeping</p>
                      <p className="text-sm text-gray-400">2 positions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🔧</div>
                    <div>
                      <p className="font-medium text-gray-700">Maintenance</p>
                      <p className="text-sm text-gray-400">0.5x position</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🌱</div>
                  <div>
                    <h3 className="text-xl font-semibold">Ecology & Food Production</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">Produce food for 50+ people, increase soil fertility, and retain water (OASA metrics).</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-lg">🌿</div>
                    <div>
                      <p className="font-medium">Ofer Carmon</p>
                      <p className="text-sm text-gray-500">Land Steward</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-lg">🌿</div>
                    <div>
                      <p className="font-medium">Joao Baranov</p>
                      <p className="text-sm text-gray-500">Land Steward</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🌿</div>
                    <div>
                      <p className="font-medium text-gray-700">Land Steward</p>
                      <p className="text-sm text-gray-400">1 additional position</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🤝</div>
                    <div>
                      <p className="font-medium text-gray-700">Volunteers</p>
                      <p className="text-sm text-gray-400">2 rotating positions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🔨</div>
                  <div>
                    <h3 className="text-xl font-semibold">Internal Build Team</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">Create unique accommodations and beautify the land for human use.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center text-lg">🪚</div>
                    <div>
                      <p className="font-medium">Matthias Siino</p>
                      <p className="text-sm text-gray-500">Carpentry</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center text-lg">🪚</div>
                    <div>
                      <p className="font-medium">Julia Aust</p>
                      <p className="text-sm text-gray-500">Carpentry</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🍄</div>
                  <div>
                    <h3 className="text-xl font-semibold">Mushroom Farm</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">Produce edible mushrooms for 3 restaurants and medicinal products.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-lg">🔬</div>
                    <div>
                      <p className="font-medium">Richard Olson</p>
                      <p className="text-sm text-gray-500">Mycology Lead (0.25x)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-lg">🍄</div>
                    <div>
                      <p className="font-medium">Tonya Gorman</p>
                      <p className="text-sm text-gray-500">Mycology Ops (1x)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🍄</div>
                    <div>
                      <p className="font-medium text-gray-700">Mycology Assistants</p>
                      <p className="text-sm text-gray-400">2 positions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-gray-100 text-gray-800 text-sm px-4 py-1 rounded-full font-medium">Partners & Contractors</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">External Partners</Heading>
              <p className="text-gray-600">Professional partners and service providers supporting TDF and OASA.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl text-center border border-amber-200">
                <p className="font-medium text-sm">Coin Finance</p>
                <p className="text-xs text-gray-500 mt-1">Token & Web3</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl text-center border border-amber-200">
                <p className="font-medium text-sm">Lars Schlichting</p>
                <p className="text-xs text-gray-500 mt-1">Legal</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">CRU Architecture</p>
                <p className="text-xs text-gray-500 mt-1">Architecture</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">SCARD Engineering</p>
                <p className="text-xs text-gray-500 mt-1">Engineering</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">White Rabbit</p>
                <p className="text-xs text-gray-500 mt-1">Development</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">Kinterra</p>
                <p className="text-xs text-gray-500 mt-1">Land Planning</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">TBD Construction</p>
                <p className="text-xs text-gray-500 mt-1">Construction</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">CAAC Accounting</p>
                <p className="text-xs text-gray-500 mt-1">Accounting</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">Start PME Grant</p>
                <p className="text-xs text-gray-500 mt-1">Grant Support</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">Fieldfisher Law</p>
                <p className="text-xs text-gray-500 mt-1">Legal (PT)</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">Crédito Agrícola</p>
                <p className="text-xs text-gray-500 mt-1">Banking</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-gray-900 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-accent text-gray-900 text-sm px-4 py-1 rounded-full font-medium">Governance</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2 text-white">TDF DAO</Heading>
              <p className="text-gray-400">Decentralized governance through our token holder community.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">👥</span>
                </div>
                <h3 className="font-semibold mb-2">Citizens</h3>
                <p className="text-sm text-gray-400">Members who have completed the onboarding process and embody TDF values.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">🏛️</span>
                </div>
                <h3 className="font-semibold mb-2">Citizen Assembly</h3>
                <p className="text-sm text-gray-400">Regular gatherings to discuss proposals and shape the community direction.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">💰</span>
                </div>
                <h3 className="font-semibold mb-2">Treasury</h3>
                <p className="text-sm text-gray-400">Community-controlled funds for development and operations.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">🪙</span>
                </div>
                <h3 className="font-semibold mb-2">$TDF Token Holders</h3>
                <p className="text-sm text-gray-400">280+ holders with governance rights and accommodation access.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">💪</span>
                </div>
                <h3 className="font-semibold mb-2">$SWEAT Holders</h3>
                <p className="text-sm text-gray-400">Contributors rewarded with tokens for work on the project.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">📍</span>
                </div>
                <h3 className="font-semibold mb-2">$PRESENCE Holders</h3>
                <p className="text-sm text-gray-400">Proof of presence tokens earned through time spent at TDF.</p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-800 rounded-xl">
              <h3 className="font-semibold mb-4">What TDF DAO Governs</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span className="text-gray-300">Game Guide (living agreement)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span className="text-gray-300">Land Plan (build master plan)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span className="text-gray-300">Executive team elections</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-accent text-gray-800 text-sm px-4 py-1 rounded-full font-medium">Network</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">OASA Association</Heading>
              <p className="text-gray-600">The non-profit umbrella organization protecting land in perpetuity.</p>
            </div>

            <div className="bg-accent/30 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Mission</h3>
                  <p className="text-gray-700">Acquire & conserve 100k hectares worldwide, monitoring and increasing soil quality, water cycles, and biodiversity through regenerative practices.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Key Principles</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>Promote biodiversity & rewilding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>Promote local governance and equity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>Promote renewable resources</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>Avoid waste & pollution</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-accent-dark/30">
                <h3 className="font-semibold text-lg mb-4">Governance Bodies</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-medium">Board of Directors</p>
                    <p className="text-sm text-gray-600 mt-1">Strategic oversight and fiduciary responsibility</p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-medium">General Assembly</p>
                    <p className="text-sm text-gray-600 mt-1">All OASA members with voting rights</p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-medium">Guardians</p>
                    <p className="text-sm text-gray-600 mt-1">Land stewards protecting each project</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <Heading level={2} className="font-serif text-3xl mb-4">Join the Team</Heading>
            <p className="text-gray-600 mb-8">
              We're always looking for passionate people to join our regenerative community. Whether as a steward, volunteer, or contributor.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/volunteer" className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                View Open Positions
              </Link>
              <Link href="/volunteer" className="bg-white text-gray-900 px-8 py-4 rounded-lg font-medium border border-gray-200 hover:border-gray-400 transition-colors">
                Volunteer Program
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

TeamPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default TeamPage;

