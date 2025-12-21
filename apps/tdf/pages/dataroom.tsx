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
      <section className="bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-4 font-medium">
                {t('dataroom_hero_label')}
              </p>
              <Heading
                className="text-3xl md:text-4xl mb-6 text-white font-normal leading-tight"
                data-testid="page-title"
                display
                level={1}
              >
                {t('dataroom_hero_subtitle')}
              </Heading>
              <p className="text-base text-gray-300 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
                {t('dataroom_hero_description')}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded border border-white/20 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-white mb-2 font-serif">€2.49M</div>
                  <div className="text-xs text-gray-300 font-light">{t('dataroom_stat_total_funding')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded border border-white/20 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-white mb-2 font-serif">€1.24M</div>
                  <div className="text-xs text-gray-300 font-light">{t('dataroom_stat_construction_budget')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded border border-white/20 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-white mb-2 font-serif">€521k</div>
                  <div className="text-xs text-gray-300 font-light">{t('dataroom_stat_revenue_target')}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded border border-white/20 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-white mb-2 font-serif">5ha</div>
                  <div className="text-xs text-gray-300 font-light">{t('dataroom_stat_land_stewardship')}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LinkButton
                  href="https://calendly.com/samueldelesque"
                  target="_blank"
                  variant="primary"
                  className="bg-white text-gray-900 hover:bg-gray-100 border-0"
                >
                  {t('dataroom_executive_cta_secondary_1')}
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Highlights */}
        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_investment_overview_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_investment_highlights_title')}
              </Heading>
              <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                {t('dataroom_investment_highlights_description')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4 font-normal text-gray-900">{t('dataroom_private_debt_amount')}</div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_private_debt_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_private_debt_description')}</p>
              </Card>
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4 font-normal text-gray-900">{t('dataroom_token_sales_amount')}</div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_token_sales_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_token_sales_description')}</p>
              </Card>
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4 font-normal text-gray-900">{t('dataroom_land_portfolio_amount')}</div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_land_portfolio_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_land_portfolio_description')}</p>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">{t('dataroom_asset_purchase_title')}</h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-gray-900 pl-5">
                    <div className="font-semibold text-sm text-gray-600 mb-2">{t('dataroom_buildings_portfolio_title')}</div>
                    <div className="text-3xl font-normal text-gray-900 mb-2">{t('dataroom_buildings_portfolio_amount')}</div>
                    <div className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_buildings_portfolio_description')}</div>
                  </div>
                  <div className="border-l-4 border-gray-900 pl-5">
                    <div className="font-semibold text-sm text-gray-600 mb-2">{t('dataroom_land_acquisition_title')}</div>
                    <div className="text-3xl font-normal text-gray-900 mb-2">{t('dataroom_land_acquisition_amount_550k')}</div>
                    <div className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_land_acquisition_description')}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">{t('dataroom_impact_investment_benefits_title')}</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_impact_benefit_1')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_impact_benefit_3')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_impact_benefit_4')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_impact_benefit_2')}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>

        {/* Track Record & Development Status */}
        <div className="py-24 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_track_record_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_track_record_title')}
              </Heading>
              <p className="text-base text-gray-700 mb-8 leading-relaxed font-light">
                {t('dataroom_track_record_subtitle')}{' '}
                <Link href="/roadmap" className="text-gray-900 underline hover:text-gray-700 font-medium">
                  {t('dataroom_detailed_roadmap')}
                </Link>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-16 mb-12">
              <div>
                <Heading level={3} className="text-xl mb-8 text-gray-900 font-semibold">
                  {t('dataroom_completed_milestones_title')}
                </Heading>
                <ul className="space-y-5">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_milestone_1_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_milestone_1_content')}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_milestone_2_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_milestone_2_content')}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_milestone_3_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_milestone_3_content')}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_milestone_4_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_milestone_4_content')}</span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <Heading level={3} className="text-xl mb-8 text-gray-900 font-semibold">
                  {t('dataroom_growth_opportunities_title')}
                </Heading>
                <ul className="space-y-5">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_opportunity_1_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_opportunity_1_content')}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_opportunity_2_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_opportunity_2_content')}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_opportunity_3_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_opportunity_3_content')}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="font-semibold text-gray-900">{t('dataroom_opportunity_4_title')}</strong>{' '}
                      <span className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_opportunity_4_content')}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('dataroom_building_permits_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  {t('dataroom_building_permits_content')}
                </p>
              </Card>
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('dataroom_zoning_phase_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  {t('dataroom_zoning_phase_content')}
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Development Timeline */}
        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_timeline_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_timeline_title')}
              </Heading>
              <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                {t('dataroom_timeline_subtitle')}
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Co-living Track */}
              <div className="space-y-4">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t('dataroom_coliving_track_title')}</h3>
                  <div className="w-16 h-0.5 bg-gray-300 mx-auto"></div>
                </div>
                
                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-900 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_coliving_planning_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_coliving_planning_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-900 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_coliving_existing_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_coliving_existing_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_coliving_current_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_coliving_current_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_coliving_next_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_coliving_next_desc')}</p>
                    <p className="text-sm font-medium text-gray-900 mt-2">{t('dataroom_coliving_next_funding')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_coliving_major_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_coliving_major_desc')}</p>
                    <p className="text-sm font-medium text-gray-900 mt-2">{t('dataroom_coliving_major_funding')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_full_hospitality_operation')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_coliving_completion')}</p>
                  </div>
                </div>
              </div>

              {/* Co-housing Track */}
              <div className="space-y-4">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t('dataroom_cohousing_track_title')}</h3>
                  <div className="w-16 h-0.5 bg-gray-300 mx-auto"></div>
                </div>
                
                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-900 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_cohousing_land_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_cohousing_land_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_cohousing_pip_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_cohousing_pip_desc')}</p>
                    <p className="text-sm font-medium text-gray-900 mt-2">{t('dataroom_cohousing_response')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_land_closing_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_cohousing_closing')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_cohousing_infrastructure_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_cohousing_infrastructure_desc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('dataroom_cohousing_construction_title')}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_cohousing_construction_desc')}</p>
                    <p className="text-sm font-medium text-gray-900 mt-2">{t('dataroom_cohousing_first_houses')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Credits & Monitoring */}
        <div className="py-24 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_environmental_impact_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_environmental_credits_title')}
              </Heading>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('dataroom_carbon_tracking_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_carbon_tracking_content')}</p>
              </Card>
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('dataroom_biodiversity_monitoring_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_biodiversity_monitoring_content')}</p>
              </Card>
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('dataroom_ecological_monitoring_title')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_ecological_monitoring_content')}</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Path to Profitability */}
        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('home_financial_section_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('home_financial_section_title')}
              </Heading>
              <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                {t('home_financial_section_subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-8 border border-gray-300">
                <Heading level={3} className="mb-8 text-lg font-semibold text-gray-900">
                  {t('home_financial_revenue_title')}
                </Heading>
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('home_financial_revenue_hospitality')}</span>
                    <span className="font-semibold text-gray-900">€369,659</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('home_financial_revenue_restaurant')}</span>
                    <span className="font-semibold text-gray-900">€45,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('home_financial_revenue_events')}</span>
                    <span className="font-semibold text-gray-900">€35,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('home_financial_revenue_energy')}</span>
                    <span className="font-semibold text-gray-900">€35,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('home_financial_revenue_agricultural')}</span>
                    <span className="font-semibold text-gray-900">€37,143</span>
                  </div>
                  <div className="flex justify-between items-center pt-5 border-t-2 border-gray-900">
                    <span className="font-semibold text-gray-900">{t('home_financial_revenue_total')}</span>
                    <span className="font-bold text-xl text-gray-900">€521,802</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 border border-gray-300">
                <Heading level={3} className="mb-8 text-lg font-semibold text-gray-900">
                  {t('home_financial_trajectory_title')}
                </Heading>
                <div className="flex items-end gap-3 h-48 mb-6">
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '15%' }}></div>
                    <span className="text-xs font-semibold text-gray-900">€78k</span>
                    <span className="text-xs text-gray-600 font-light">{t('home_financial_trajectory_2025')}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '39%' }}></div>
                    <span className="text-xs font-semibold text-gray-900">€200k</span>
                    <span className="text-xs text-gray-600 font-light">{t('home_financial_trajectory_2026')}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '58%' }}></div>
                    <span className="text-xs font-semibold text-gray-900">€300k</span>
                    <span className="text-xs text-gray-600 font-light">{t('home_financial_trajectory_2027')}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '78%' }}></div>
                    <span className="text-xs font-semibold text-gray-900">€400k</span>
                    <span className="text-xs text-gray-600 font-light">{t('home_financial_trajectory_2028')}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '100%' }}></div>
                    <span className="text-xs font-semibold text-gray-900">€514k</span>
                    <span className="text-xs text-gray-600 font-light">{t('home_financial_trajectory_2029')}</span>
                  </div>
                </div>
                <p className="text-sm text-center text-gray-700 font-light">
                  <strong className="text-gray-900 font-semibold">{t('home_financial_trajectory_profit')}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use of Funds */}
        <div className="py-24 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_financial_plan_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_use_of_funds_title')}
              </Heading>
              <p className="text-base text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                {t('dataroom_use_of_funds_description')}
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              {/* Sources Table */}
              <div>
                <h3 className="text-xl font-semibold mb-8 text-gray-900">{t('dataroom_sources_title')}</h3>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-900 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_source')}</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold">{t('dataroom_amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_eu_grant')} <span className="text-orange-600 text-xs font-normal">(Not Guaranteed)</span></div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_eu_grant_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€660,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_bank_loans')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_bank_loans_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{t('dataroom_bank_loans_amount')}</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_private_loans')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_private_loans_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{t('dataroom_private_loans_amount')}</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_cohousing_deposits')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_cohousing_deposits_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€500,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_token_sales')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_token_sales_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€230,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_current_balance')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_current_balance_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€160,000</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                      <tr>
                        <td className="px-6 py-4 font-bold text-gray-900">{t('dataroom_total_sources')}</td>
                        <td className="px-6 py-4 text-right font-bold text-lg text-gray-900">€2,487,500</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Uses Table */}
              <div>
                <h3 className="text-xl font-semibold mb-8 text-gray-900">{t('dataroom_uses_title')}</h3>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-900 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_use')}</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold">{t('dataroom_amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_use_land_acquisition')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_land_acquisition_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{t('dataroom_land_acquisition_amount')}</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_use_development_funds')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_development_funds_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{t('dataroom_development_funds_amount')}</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_use_building_acquisition')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_building_acquisition_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{t('dataroom_building_acquisition_amount')}</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_use_construction')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_construction_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€1,242,177.49</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                      <tr>
                        <td className="px-6 py-4 font-bold text-gray-900">{t('dataroom_total_uses')}</td>
                        <td className="px-6 py-4 text-right font-bold text-lg text-gray-900">€2,122,177.49</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Basis of Value Footnote */}
        <div className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-6 font-medium">
              {t('home_derisked_title')}
            </p>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed font-light">
              <p>
                <strong className="font-semibold text-gray-900">{t('home_derisked_property_title')}</strong>{' '}
                {t('home_derisked_property_desc')}
              </p>
              <p>
                <strong className="font-semibold text-gray-900">{t('home_derisked_capital_title')}</strong>{' '}
                {t('home_derisked_capital_desc')}
              </p>
              <p>
                <strong className="font-semibold text-gray-900">{t('home_derisked_liquidity_title')}</strong>{' '}
                {t('home_derisked_liquidity_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Investment Map */}
        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_investment_breakdown_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_investment_map_title')}
              </Heading>
              <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                {t('dataroom_investment_map_subtitle')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_investment_map_description')}</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">{t('dataroom_investment_map_phase')}</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">{t('dataroom_investment_map_total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_fiscal_initial')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€3,600.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_fiscal_monthly')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€15,480.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_fiscal_extra')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€520.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_architecture_finish')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€25,000.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_engineering_finish')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€10,000.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_construction_rooms')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€767,242.45</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_construction_kitchen')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_2')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€81,239.04</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_solar_200kw')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€60,000.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_locks_hardware')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€22,902.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_mobiliario_pyroheat')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_1_2')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€65,700.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_mobiliario_sensors')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_sem')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€40,614.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_mobiliario_windows')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_sem')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€18,000.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_mobiliario_doors')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_sem')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€4,200.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_studios')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€110,000.00</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_investment_map_construction_greenhouse')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{t('dataroom_investment_map_phase_3')}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€17,680.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                    <tr>
                      <td colSpan={2} className="px-6 py-5 font-bold text-gray-900 text-right">
                        {t('dataroom_investment_map_total')}:
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-xl text-gray-900">
                        €1,242,177.49
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="py-24 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_documentation_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-6 text-gray-900 font-normal">
                {t('dataroom_documents_title')}
              </Heading>
              <p className="text-base text-gray-700 leading-relaxed font-light">
                {t('dataroom_documents_subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2021-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_report_2021_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
              
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2022-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_report_2022_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
              
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2024-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">💧</div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_report_2024_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
              
              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2025-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_report_2025_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-24 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Heading level={2} className="text-3xl md:text-4xl mb-6 font-normal">
              {t('dataroom_cta_title')}
            </Heading>
            <p className="text-lg mb-10 text-gray-300 leading-relaxed font-light">
              {t('dataroom_cta_description')}
            </p>
            <div className="flex justify-center">
              <LinkButton
                href="https://calendly.com/samueldelesque"
                target="_blank"
                variant="primary"
                className="bg-white text-gray-900 hover:bg-gray-100 border-0"
              >
                {t('dataroom_executive_cta_secondary_1')}
              </LinkButton>
            </div>
            <div className="mt-10 text-sm text-gray-400 font-light">
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
