import Head from 'next/head';
import Link from 'next/link';

import {  Heading, Card, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const HomePage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('dataroom_page_title')}</title>
        <meta name="description" content={t('dataroom_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-accent-light to-accent-alt-light min-h-[60vh] flex items-center">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Heading
                  className="text-4xl md:text-6xl mb-6 text-white drop-shadow-lg"
                  data-testid="page-title"
                  display
                  level={1}
                >
                  {t('dataroom_hero_title')}
                </Heading>
                <p className="text-xl text-black mb-8 leading-relaxed">
                  {t('dataroom_hero_subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <LinkButton
                    href="https://calendly.com/samueldelesque"
                    target="_blank"
                    className="bg-accent text-white hover:bg-accent-dark"
                  >
                    {t('dataroom_executive_cta_secondary_1')}
                  </LinkButton>
                </div>
              </div>
              <div className="relative">
                <img
                  src="/images/landing/top-view.jpeg"
                  className="rounded-2xl shadow-2xl"
                  alt={t('dataroom_img_alt')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Investment Highlights */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-accent to-accent-alt bg-clip-text text-transparent">
                {t('dataroom_investment_highlights_title')}
              </Heading>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Traditional Dream Factory offers impact investors a unique opportunity to support regenerative community development while earning competitive returns. Your investment drives environmental restoration, regenerative agriculture, and innovative governance models.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">{t('dataroom_private_debt_amount')}</div>
                <h3 className="text-xl font-bold mb-2">{t('dataroom_private_debt_title')}</h3>
                <p className="text-gray-600">{t('dataroom_private_debt_description')}</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">{t('dataroom_token_sales_amount')}</div>
                <h3 className="text-xl font-bold mb-2">{t('dataroom_token_sales_title')}</h3>
                <p className="text-gray-600">{t('dataroom_token_sales_description')}</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">{t('dataroom_land_portfolio_amount')}</div>
                <h3 className="text-xl font-bold mb-2">{t('dataroom_land_portfolio_title')}</h3>
                <p className="text-gray-600">{t('dataroom_land_portfolio_description')}</p>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_asset_purchase_title')}</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-accent pl-4">
                    <div className="font-semibold">{t('dataroom_buildings_portfolio_title')}</div>
                    <div className="text-2xl font-bold text-gray-700">{t('dataroom_buildings_portfolio_amount')}</div>
                    <div className="text-sm text-gray-600">{t('dataroom_buildings_portfolio_description')}</div>
                  </div>
                  <div className="border-l-4 border-accent pl-4">
                    <div className="font-semibold">{t('dataroom_land_acquisition_title')}</div>
                    <div className="text-2xl font-bold text-gray-700">{t('dataroom_land_acquisition_amount_550k')}</div>
                    <div className="text-sm text-gray-600">{t('dataroom_land_acquisition_description')}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_impact_investment_benefits_title')}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_impact_benefit_1')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_impact_benefit_3')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_impact_benefit_4')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_impact_benefit_2')}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>



        {/* Track Record & Development Status */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-accent to-accent-alt bg-clip-text text-transparent">
                {t('dataroom_track_record_title')}
              </Heading>
              <p className="text-lg text-gray-600 mb-8">
                {t('dataroom_track_record_subtitle')}{' '}
                <Link href="/roadmap" className="text-blue-600 underline hover:text-blue-800 font-semibold">
                  {t('dataroom_detailed_roadmap')}
                </Link>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div>
                <Heading level={3} className="text-2xl mb-6 text-gray-800">
                  {t('dataroom_completed_milestones_title')}
                </Heading>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_1_title')}</strong> {t('dataroom_milestone_1_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_2_title')}</strong> {t('dataroom_milestone_2_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_3_title')}</strong> {t('dataroom_milestone_3_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_4_title')}</strong> {t('dataroom_milestone_4_content')}
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <Heading level={3} className="text-2xl mb-6 text-gray-800">
                  {t('dataroom_growth_opportunities_title')}
                </Heading>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-alt rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_opportunity_1_title')}</strong> {t('dataroom_opportunity_1_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-alt rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_opportunity_2_title')}</strong> {t('dataroom_opportunity_2_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-alt rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_opportunity_3_title')}</strong> {t('dataroom_opportunity_3_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-alt rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_opportunity_4_title')}</strong> {t('dataroom_opportunity_4_content')}
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_building_permits_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_building_permits_content')}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_zoning_phase_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_zoning_phase_content')}
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Development Timeline */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-accent to-accent-alt bg-clip-text text-transparent">
                {t('dataroom_timeline_title')}
              </Heading>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {t('dataroom_timeline_subtitle')}
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Co-living Track */}
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('dataroom_coliving_track_title')}</h3>
                  <div className="w-20 h-0.5 bg-gray-300 mx-auto"></div>
                </div>
                
                {/* Planning & Permits */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">📋</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-emerald-800">{t('dataroom_coliving_planning_title')}</h4>
                    <p className="text-sm text-emerald-700 mt-1">{t('dataroom_coliving_planning_desc')}</p>
                  </div>
                </div>

                {/* Existing Facilities */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🏢</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-emerald-800">{t('dataroom_coliving_existing_title')}</h4>
                    <p className="text-sm text-emerald-700 mt-1">{t('dataroom_coliving_existing_desc')}</p>
                  </div>
                </div>

                {/* In Progress */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🔨</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800">{t('dataroom_coliving_current_title')}</h4>
                    <p className="text-sm text-blue-700 mt-1">{t('dataroom_coliving_current_desc')}</p>
                  </div>
                </div>

                {/* Next Milestone */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🍽️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800">{t('dataroom_coliving_next_title')}</h4>
                    <p className="text-sm text-amber-700 mt-1">{t('dataroom_coliving_next_desc')}</p>
                    <p className="text-sm font-medium text-amber-600 mt-1">{t('dataroom_coliving_next_funding')}</p>
                  </div>
                </div>

                {/* Major Build Phase */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-accent bg-gradient-to-r from-accent/10 to-accent/5 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🏗️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-accent">{t('dataroom_coliving_major_title')}</h4>
                    <p className="text-sm text-gray-700 mt-1">{t('dataroom_coliving_major_desc')}</p>
                    <p className="text-sm font-medium text-accent mt-1">{t('dataroom_coliving_major_funding')}</p>
                  </div>
                </div>

                {/* Completion */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🎯</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800">Full Hospitality Operation</h4>
                    <p className="text-sm text-purple-700 mt-1">{t('dataroom_coliving_completion')}</p>
                  </div>
                </div>
              </div>

              {/* Co-housing Track */}
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('dataroom_cohousing_track_title')}</h3>
                  <div className="w-20 h-0.5 bg-gray-300 mx-auto"></div>
                </div>
                
                {/* Land Option Secured */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🏞️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-emerald-800">{t('dataroom_cohousing_land_title')}</h4>
                    <p className="text-sm text-emerald-700 mt-1">{t('dataroom_cohousing_land_desc')}</p>
                  </div>
                </div>

                {/* PIP Submitted */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">📄</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800">{t('dataroom_cohousing_pip_title')}</h4>
                    <p className="text-sm text-blue-700 mt-1">{t('dataroom_cohousing_pip_desc')}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">{t('dataroom_cohousing_response')}</p>
                  </div>
                </div>

                {/* Land Closing */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🤝</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800">Land Closing</h4>
                    <p className="text-sm text-amber-700 mt-1">{t('dataroom_cohousing_closing')}</p>
                  </div>
                </div>

                {/* Infrastructure Phase */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-accent bg-gradient-to-r from-accent/10 to-accent/5 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🛣️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-accent">{t('dataroom_cohousing_infrastructure_title')}</h4>
                    <p className="text-sm text-gray-700 mt-1">{t('dataroom_cohousing_infrastructure_desc')}</p>
                  </div>
                </div>

                {/* Construction Phase */}
                <div className="flex items-start space-x-4 p-5 border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100/50 shadow-sm">
                  <div className="flex-shrink-0 text-2xl">🏠</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800">{t('dataroom_cohousing_construction_title')}</h4>
                    <p className="text-sm text-purple-700 mt-1">{t('dataroom_cohousing_construction_desc')}</p>
                    <p className="text-sm font-medium text-purple-600 mt-1">{t('dataroom_cohousing_first_houses')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Credits & Monitoring */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-accent to-accent-alt bg-clip-text text-transparent">
                {t('dataroom_environmental_credits_title')}
              </Heading>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_carbon_tracking_title')}</h3>
                <p className="text-gray-600">{t('dataroom_carbon_tracking_content')}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_biodiversity_monitoring_title')}</h3>
                <p className="text-gray-600">{t('dataroom_biodiversity_monitoring_content')}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{t('dataroom_ecological_monitoring_title')}</h3>
                <p className="text-gray-600">{t('dataroom_ecological_monitoring_content')}</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Use of Funds */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-accent to-accent-alt bg-clip-text text-transparent">
                {t('dataroom_use_of_funds_title')}
              </Heading>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                {t('dataroom_use_of_funds_description')}
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              {/* Sources Table */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">{t('dataroom_sources_title')}</h3>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('dataroom_source')}</th>
                        <th className="px-4 py-3 text-right">{t('dataroom_amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-800">{t('dataroom_source_eu_grant')} <span className="text-orange-600 text-sm">(Not Guaranteed)</span></div>
                          <div className="text-xs text-gray-500 mt-1">55% grant on €1.2M construction budget</div>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-700">€660,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_bank_loans')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_bank_loans_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_bank_loans_amount')}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_private_loans')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_private_loans_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_private_loans_amount')}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_cohousing_deposits')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_cohousing_deposits_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_cohousing_deposits_amount')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_token_sales')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_token_sales_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€230,000</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-800">{t('dataroom_total_sources')}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">€2,127,500</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Uses Table */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">{t('dataroom_uses_title')}</h3>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('dataroom_use')}</th>
                        <th className="px-4 py-3 text-right">{t('dataroom_amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_land_acquisition')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_land_acquisition_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_land_acquisition_amount')}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_building_acquisition')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_building_acquisition_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_building_acquisition_amount')}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_co_living_suites')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_co_living_suites_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_co_living_suites_amount')}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_restaurant')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_restaurant_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_restaurant_amount')}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_architecture_engineering')}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('dataroom_architecture_engineering_note')}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{t('dataroom_architecture_engineering_amount')}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-800">{t('dataroom_total_uses')}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">€1,930,000</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-800">{t('dataroom_contingency_buffer')}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">~€197,500</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
        </div>


        {/* Documents Section */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4 bg-gradient-to-r from-accent to-accent-alt bg-clip-text text-transparent">
                {t('dataroom_documents_title')}
              </Heading>
              <p className="text-lg text-gray-600">
                {t('dataroom_documents_subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2021-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold mb-2">{t('dataroom_report_2021_title')}</h3>
                  <span className="text-accent font-semibold">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2022-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold mb-2">{t('dataroom_report_2022_title')}</h3>
                  <span className="text-accent font-semibold">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2024-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">💧</div>
                  <h3 className="text-xl font-bold mb-2">{t('dataroom_report_2024_title')}</h3>
                  <span className="text-accent font-semibold">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-16 bg-gradient-to-br from-accent-light to-accent-alt-light text-black">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Heading level={2} className="text-3xl md:text-4xl mb-6">
              {t('dataroom_cta_title')}
            </Heading>
            <p className="text-xl mb-8 opacity-90">
              {t('dataroom_cta_description')}
            </p>
            <div className="flex justify-center">
              <LinkButton
                href="https://calendly.com/samueldelesque"
                target="_blank"
                className="bg-accent text-white hover:bg-accent-dark px-8 py-3 text-lg"
              >
                {t('dataroom_executive_cta_secondary_1')}
              </LinkButton>
            </div>
            <div className="mt-8 text-sm opacity-75">
              <p>{t('dataroom_cta_tagline')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
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

export default HomePage;

