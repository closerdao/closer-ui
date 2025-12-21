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
        <title>{t('team_page_title')}</title>
        <meta name="description" content={t('team_page_description')} />
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
              {t('team_hero_title')}
            </Heading>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('team_hero_subtitle')}
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
                <h3 className="font-semibold mb-2">{t('team_oasa_association_title')}</h3>
                <p className="text-sm text-gray-600">{t('team_oasa_association_desc')}</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗳️</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_tdf_dao_title')}</h3>
                <p className="text-sm text-gray-600">{t('team_tdf_dao_desc')}</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_executive_team_title')}</h3>
                <p className="text-sm text-gray-600">{t('team_executive_team_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-accent text-gray-800 text-sm px-4 py-1 rounded-full font-medium">{t('team_executive_team_label')}</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">{t('team_leadership_title')}</Heading>
              <p className="text-gray-600">{t('team_leadership_desc')}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-6 p-6 bg-gray-50 rounded-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent-alt rounded-full flex-shrink-0 flex items-center justify-center text-3xl">
                  👨‍💼
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Samuel Delesque</h3>
                  <p className="text-accent-dark font-medium">{t('team_samuel_role')}</p>
                  <p className="text-sm text-gray-600 mt-2">{t('team_samuel_desc')}</p>
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
                  <p className="text-blue-600 font-medium">{t('team_peter_role')}</p>
                  <p className="text-sm text-gray-600 mt-2">{t('team_peter_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-accent/20">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-white text-gray-800 text-sm px-4 py-1 rounded-full font-medium">{t('team_operations_label')}</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">{t('team_ground_teams_title')}</Heading>
              <p className="text-gray-600">{t('team_ground_teams_desc')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🏨</div>
                  <div>
                    <h3 className="text-xl font-semibold">{t('team_hospitality_team_title')}</h3>
                    <p className="text-sm text-gray-500">{t('team_hospitality_team_when')}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{t('team_hospitality_team_desc')}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-lg">🌟</div>
                    <div>
                      <p className="font-medium">{t('team_luna_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_luna_role')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">👨‍🍳</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_kitchen_lead')}</p>
                      <p className="text-sm text-gray-400">{t('team_position_open')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🍳</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_kitchen_support')}</p>
                      <p className="text-sm text-gray-400">{t('team_position_open')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🧹</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_housekeeping')}</p>
                      <p className="text-sm text-gray-400">{t('team_housekeeping_positions')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🔧</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_maintenance')}</p>
                      <p className="text-sm text-gray-400">{t('team_maintenance_position')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🌱</div>
                  <div>
                    <h3 className="text-xl font-semibold">{t('team_ecology_food_title')}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{t('team_ecology_food_desc')}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-lg">🌿</div>
                    <div>
                      <p className="font-medium">{t('team_ofer_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_land_steward')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-lg">🌿</div>
                    <div>
                      <p className="font-medium">{t('team_joao_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_land_steward')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🌿</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_land_steward')}</p>
                      <p className="text-sm text-gray-400">{t('team_land_steward_additional')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🤝</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_volunteers')}</p>
                      <p className="text-sm text-gray-400">{t('team_volunteers_positions')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🔨</div>
                  <div>
                    <h3 className="text-xl font-semibold">{t('team_build_team_title')}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{t('team_build_team_desc')}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center text-lg">🪚</div>
                    <div>
                      <p className="font-medium">{t('team_matthias_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_carpentry')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center text-lg">🪚</div>
                    <div>
                      <p className="font-medium">{t('team_julia_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_carpentry')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-xl">🍄</div>
                  <div>
                    <h3 className="text-xl font-semibold">{t('team_mushroom_farm_title')}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{t('team_mushroom_farm_desc')}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-lg">🔬</div>
                    <div>
                      <p className="font-medium">{t('team_richard_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_richard_role')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-lg">🍄</div>
                    <div>
                      <p className="font-medium">{t('team_tonya_name')}</p>
                      <p className="text-sm text-gray-500">{t('team_tonya_role')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm">🍄</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('team_mycology_assistants')}</p>
                      <p className="text-sm text-gray-400">{t('team_mycology_assistants_positions')}</p>
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
              <span className="bg-gray-100 text-gray-800 text-sm px-4 py-1 rounded-full font-medium">{t('team_partners_label')}</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">{t('team_partners_title')}</Heading>
              <p className="text-gray-600">{t('team_partners_desc')}</p>
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
                <p className="font-medium text-sm">SCARD</p>
                <p className="text-xs text-gray-500 mt-1">Engineering</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">White Rabbit</p>
                <p className="text-xs text-gray-500 mt-1">Development</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="font-medium text-sm">Kinterra</p>
                <p className="text-xs text-gray-500 mt-1">Regenerative systems sourcing</p>
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
                <p className="font-medium text-sm">Start PME</p>
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
              <span className="bg-accent text-gray-900 text-sm px-4 py-1 rounded-full font-medium">{t('team_governance_label')}</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2 text-white">{t('team_tdf_dao_title')}</Heading>
              <p className="text-gray-400">{t('team_dao_desc')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">👥</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_citizens_title')}</h3>
                <p className="text-sm text-gray-400">{t('team_citizens_desc')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">🏛️</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_citizen_assembly_title')}</h3>
                <p className="text-sm text-gray-400">{t('team_citizen_assembly_desc')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">💰</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_treasury_title')}</h3>
                <p className="text-sm text-gray-400">{t('team_treasury_desc')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">🪙</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_token_holders_title')}</h3>
                <p className="text-sm text-gray-400">{t('team_token_holders_desc')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">💪</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_sweat_holders_title')}</h3>
                <p className="text-sm text-gray-400">{t('team_sweat_holders_desc')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl">📍</span>
                </div>
                <h3 className="font-semibold mb-2">{t('team_presence_holders_title')}</h3>
                <p className="text-sm text-gray-400">{t('team_presence_holders_desc')}</p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-800 rounded-xl">
              <h3 className="font-semibold mb-4">{t('team_dao_governs_title')}</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span className="text-gray-300">{t('team_dao_governs_game_guide')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span className="text-gray-300">{t('team_dao_governs_land_plan')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span className="text-gray-300">{t('team_dao_governs_elections')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="bg-accent text-gray-800 text-sm px-4 py-1 rounded-full font-medium">{t('team_network_label')}</span>
              <Heading level={2} className="font-serif text-3xl mt-4 mb-2">{t('team_oasa_association_title')}</Heading>
              <p className="text-gray-600">{t('team_oasa_association_overview')}</p>
            </div>

            <div className="bg-accent/30 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t('team_oasa_mission_title')}</h3>
                  <p className="text-gray-700">{t('team_oasa_mission_desc')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t('team_oasa_principles_title')}</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>{t('team_oasa_principle_1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>{t('team_oasa_principle_2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>{t('team_oasa_principle_3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-dark mt-1">●</span>
                      <span>{t('team_oasa_principle_4')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-accent-dark/30">
                <h3 className="font-semibold text-lg mb-4">{t('team_oasa_governance_title')}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-medium">{t('team_oasa_board_title')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('team_oasa_board_desc')}</p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-medium">{t('team_oasa_assembly_title')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('team_oasa_assembly_desc')}</p>
                  </div>
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="font-medium">{t('team_oasa_guardians_title')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('team_oasa_guardians_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <Heading level={2} className="font-serif text-3xl mb-4">{t('team_join_title')}</Heading>
            <p className="text-gray-600 mb-8">
              {t('team_join_desc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/volunteer" className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                {t('team_join_view_positions')}
              </Link>
              <Link href="/volunteer" className="bg-white text-gray-900 px-8 py-4 rounded-lg font-medium border border-gray-200 hover:border-gray-400 transition-colors">
                {t('team_join_volunteer_program')}
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

