import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Heading, Card, LinkButton, Newsletter, useAuth } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { BarChart3, Building2, Check, Droplets, FileSpreadsheet, Landmark, Map, MapPin, Rocket, Sprout, Users, Wallet } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const HomePage = () => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const [isEmailUnlocked, setIsEmailUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unlocked = localStorage.getItem('signupCompleted') === 'true';
    setIsEmailUnlocked(unlocked);
  }, []);

  const isContentLocked = !isAuthenticated && !isEmailUnlocked;

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
        <div className="bg-gradient-to-br from-accent-light to-accent-alt-light border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
                {t('dataroom_hero_label')}
              </p>
              <Heading
                className="mb-4 text-4xl md:text-6xl"
                data-testid="page-title"
                display
                level={1}
              >
                {t('dataroom_hero_subtitle')}
              </Heading>
              <p className="text-base text-gray-700 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
                {t('dataroom_hero_description')}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
                <div className="bg-white/90 rounded border border-gray-200 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-gray-900 mb-2 font-serif">€450K</div>
                  <div className="text-xs text-gray-600 font-light">{t('dataroom_stat_total_funding')}</div>
                </div>
                <div className="bg-white/90 rounded border border-gray-200 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-gray-900 mb-2 font-serif">€1.24M</div>
                  <div className="text-xs text-gray-600 font-light">{t('dataroom_stat_construction_budget')}</div>
                </div>
                <div className="bg-white/90 rounded border border-gray-200 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-gray-900 mb-2 font-serif">€653k</div>
                  <div className="text-xs text-gray-600 font-light">{t('dataroom_stat_revenue_target')}</div>
                </div>
                <div className="bg-white/90 rounded border border-gray-200 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-normal text-gray-900 mb-2 font-serif">25ha</div>
                  <div className="text-xs text-gray-600 font-light">{t('dataroom_stat_land_stewardship')}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LinkButton
                  href="https://calendly.com/samueldelesque"
                  target="_blank"
                  variant="primary"
                  className="bg-gray-900 text-white hover:bg-gray-800 border-0"
                >
                  {t('dataroom_executive_cta_secondary_1')}
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        {!mounted ? (
          <div className="py-16 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <div className="h-32" />
              </div>
            </div>
          </div>
        ) : isContentLocked ? (
          <div className="py-16 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <Heading level={2} className="text-2xl md:text-3xl mb-4 text-gray-900 font-normal">
                  {t('dataroom_gate_title')}
                </Heading>
                <p className="text-base text-gray-700 mb-8 leading-relaxed font-light">
                  {t('dataroom_gate_description')}
                </p>
                <div className="flex justify-center">
                  <Newsletter
                    placement="dataroom"
                    className="sm:w-[420px] bg-white border border-gray-200 rounded-lg px-6"
                    ctaText={t('dataroom_gate_cta')}
                    showTitle={false}
                    onSuccess={() => setIsEmailUnlocked(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Loan Terms - Most Important for Lenders */}
            <div className="py-16 bg-white border-b border-gray-200">
              <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-10">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                    {t('dataroom_loan_terms_label')}
                  </p>
                  <Heading level={2} className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal">
                    {t('dataroom_loan_terms_title')}
                  </Heading>
                </div>
                
                <Card className="p-8 border-2 border-gray-900 rounded-lg bg-white mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">€450K</div>
                      <div className="text-sm text-gray-600 font-light">{t('dataroom_terms_amount')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">5%</div>
                      <div className="text-sm text-gray-600 font-light">{t('dataroom_terms_rate')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">4 yr</div>
                      <div className="text-sm text-gray-600 font-light">{t('dataroom_terms_term')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">€50K</div>
                      <div className="text-sm text-gray-600 font-light">{t('dataroom_terms_minimum')}</div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">{t('dataroom_terms_security_label')}</div>
                      <p className="text-sm text-gray-700 font-light">{t('dataroom_terms_security_desc')}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">{t('dataroom_terms_conversion_label')}</div>
                      <p className="text-sm text-gray-700 font-light">{t('dataroom_terms_conversion_desc')}</p>
                    </div>
                  </div>
                </Card>

                <p className="text-sm text-gray-600 text-center font-light">
                  {t('dataroom_terms_note')}
                </p>
              </div>
            </div>

            {/* Legal Structure */}
            <div className="py-10 bg-gray-50 border-b border-gray-200">
              <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-6">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
                    {t('dataroom_legal_structure_label')}
                  </p>
                  <Heading level={2} className="text-2xl md:text-3xl mb-2 text-gray-900 font-normal">
                    {t('dataroom_legal_structure_title')}
                  </Heading>
                </div>
                
                <div className="flex flex-col items-center gap-1 mb-6">
                  <div className="bg-white border border-gray-300 rounded-xl p-3 w-full max-w-[180px] text-center shadow-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Landmark className="w-4 h-4 text-blue-700" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">OASA Association</h3>
                    <p className="text-[10px] text-gray-500">Non-Profit • Switzerland</p>
                  </div>
                  
                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                    <span className="text-[10px] text-gray-500 px-1">holds equity in</span>
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-white border border-dashed border-emerald-400 rounded-xl p-3 w-[140px] text-center shadow-sm">
                      <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <h3 className="font-semibold text-xs text-gray-900">Land + Buildings</h3>
                      <p className="text-[9px] text-gray-500">25ha • Abela</p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                      <span className="text-[9px] text-gray-500 px-1">→</span>
                    </div>

                    <div className="bg-gray-900 text-white rounded-xl p-3 w-[160px] text-center shadow-md">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Building2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h3 className="font-semibold text-xs">Enseada Sonhadora S.A.</h3>
                      <p className="text-[9px] text-gray-300">SPV • Portugal</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                    <span className="text-[10px] text-gray-500 px-1">secures</span>
                    <div className="w-0.5 h-3 bg-gray-300"></div>
                  </div>

                  <div className="bg-accent border border-accent-dark rounded-xl p-3 w-full max-w-[180px] text-center shadow-sm">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <Wallet className="w-4 h-4 text-gray-900" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">Private Debt</h3>
                    <p className="text-[10px] text-gray-700">Your Investment • €450K</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 font-light text-center max-w-xl mx-auto">
                  {t('dataroom_legal_structure_desc')}
                </p>
              </div>
            </div>

            {/* The Opportunity - Simplified */}
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
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900">{t('dataroom_collateral_title')}</h3>
                    <div className="space-y-6">
                      <div className="border-l-4 border-gray-900 pl-5">
                        <div className="font-semibold text-sm text-gray-600 mb-2">{t('dataroom_land_acquisition_title')}</div>
                        <div className="text-3xl font-normal text-gray-900 mb-2">{t('dataroom_land_acquisition_amount_550k')}</div>
                        <div className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_collateral_land_desc')}</div>
                      </div>
                      <div className="border-l-4 border-gray-900 pl-5">
                        <div className="font-semibold text-sm text-gray-600 mb-2">{t('dataroom_buildings_portfolio_title')}</div>
                        <div className="text-3xl font-normal text-gray-900 mb-2">{t('dataroom_buildings_portfolio_amount')}</div>
                        <div className="text-sm text-gray-700 leading-relaxed font-light">{t('dataroom_collateral_buildings_desc')}</div>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{t('dataroom_collateral_total')}</span>
                        <span className="text-2xl font-semibold text-gray-900">~€1.0M+</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 font-light">{t('dataroom_collateral_note')}</p>
                    </div>
                  </Card>
                  <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900">{t('dataroom_why_now_title')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                          <Check className="w-4 h-4 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{t('dataroom_why_now_1')}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <Landmark className="w-4 h-4 text-blue-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{t('dataroom_why_now_2')}</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                          <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{t('dataroom_why_now_3')}</p>
                      </div>
                      <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mb-2">
                          <Users className="w-4 h-4 text-violet-700" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{t('dataroom_why_now_4')}</p>
                      </div>
                    </div>
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
                  {t('dataroom_revenue_composition_title')}
                </Heading>
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('dataroom_revenue_stream_commercial')}</span>
                    <span className="font-semibold text-gray-900">€371,828</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('dataroom_revenue_stream_community')}</span>
                    <span className="font-semibold text-gray-900">€135,778</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('dataroom_revenue_stream_unique')}</span>
                    <span className="font-semibold text-gray-900">€115,260</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-sm text-gray-700 font-light">{t('dataroom_revenue_stream_events_other')}</span>
                    <span className="font-semibold text-gray-900">€30,000</span>
                  </div>
                  <div className="flex justify-between items-center pt-5 border-t-2 border-gray-900">
                    <span className="font-semibold text-gray-900">{t('dataroom_revenue_total')}</span>
                    <span className="font-bold text-xl text-gray-900">€652,866</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 border border-gray-300">
                <Heading level={3} className="mb-8 text-lg font-semibold text-gray-900">
                  {t('dataroom_revenue_projection_title')}
                </Heading>
                <div className="flex items-end gap-4 h-44 mb-4">
                  <div className="flex-1 h-full flex items-end">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '77%' }}></div>
                  </div>
                  <div className="flex-1 h-full flex items-end">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '83%' }}></div>
                  </div>
                  <div className="flex-1 h-full flex items-end">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '89%' }}></div>
                  </div>
                  <div className="flex-1 h-full flex items-end">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '95%' }}></div>
                  </div>
                  <div className="flex-1 h-full flex items-end">
                    <div className="w-full bg-gray-900 rounded-t" style={{ height: '100%' }}></div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-gray-900">€653k</div>
                    <div className="text-xs text-gray-600 font-light">2028</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-gray-900">€701k</div>
                    <div className="text-xs text-gray-600 font-light">2029</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-gray-900">€752k</div>
                    <div className="text-xs text-gray-600 font-light">2030</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-gray-900">€801k</div>
                    <div className="text-xs text-gray-600 font-light">2031</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs font-semibold text-gray-900">€843k</div>
                    <div className="text-xs text-gray-600 font-light">2032</div>
                  </div>
                </div>
                <p className="text-sm text-center text-gray-700 font-light mt-6">
                  <strong className="text-gray-900 font-semibold">{t('dataroom_revenue_projection_note')}</strong>
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
                          <div className="font-semibold text-gray-900">{t('dataroom_source_bank_loans')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_bank_loans_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€700,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_private_loans')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_private_loans_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€450,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_token_sales')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_token_sales_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€400,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_source_current_cash')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_current_cash_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€160,000</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                      <tr>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{t('dataroom_total_sources')}</div>
                          <div className="text-xs text-emerald-700 mt-1 font-medium">{t('dataroom_grant_bonus')}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-lg text-gray-900">€1,710,000</div>
                          <div className="text-xs text-emerald-700 font-medium">+€660K</div>
                        </td>
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
                          <div className="font-semibold text-gray-900">{t('dataroom_use_building_acquisition')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_building_acquisition_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€216,000</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{t('dataroom_use_construction')}</div>
                          <div className="text-xs text-gray-600 mt-1.5 font-light">{t('dataroom_construction_breakdown_note')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">€1,168,628</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                      <tr>
                        <td className="px-6 py-4 font-bold text-gray-900">{t('dataroom_total_uses')}</td>
                        <td className="px-6 py-4 text-right font-bold text-lg text-gray-900">€1,384,628</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Repayment Plan */}
        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_repayment_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal">
                {t('dataroom_repayment_title')}
              </Heading>
              <p className="text-base text-gray-700 font-light">
                {t('dataroom_repayment_subtitle')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm mb-8">
              <table className="w-full">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_repayment_year')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_repayment_activity')}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">{t('dataroom_repayment_balance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">2026</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_repayment_2026')}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">€450,000</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">2027</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_repayment_2027')}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">~€400,000</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">2028</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_repayment_2028')}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">~€250,000</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">2029</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_repayment_2029')}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">~€100,000</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">2030</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_repayment_2030')}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-700">€0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600 text-center font-light">
              {t('dataroom_repayment_note')}
            </p>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="py-24 bg-gray-50 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_risks_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal">
                {t('dataroom_risks_title')}
              </Heading>
            </div>
            
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_risks_risk')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('dataroom_risks_mitigation')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{t('dataroom_risk_construction')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_risk_construction_mitigation')}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{t('dataroom_risk_financing')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_risk_financing_mitigation')}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{t('dataroom_risk_demand')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_risk_demand_mitigation')}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{t('dataroom_risk_operational')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_risk_operational_mitigation')}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{t('dataroom_risk_repayment')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-light">{t('dataroom_risk_repayment_mitigation')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-medium">
                {t('dataroom_team_label')}
              </p>
              <Heading level={2} className="text-3xl md:text-4xl mb-4 text-gray-900 font-normal">
                {t('dataroom_team_title')}
              </Heading>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dataroom_team_sam_name')}</h3>
                <p className="text-sm text-gray-600 mb-3">{t('dataroom_team_sam_role')}</p>
                <p className="text-sm text-gray-700 font-light">{t('dataroom_team_sam_bio')}</p>
              </Card>
              <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dataroom_team_peter_name')}</h3>
                <p className="text-sm text-gray-600 mb-3">{t('dataroom_team_peter_role')}</p>
                <p className="text-sm text-gray-700 font-light">{t('dataroom_team_peter_bio')}</p>
              </Card>
              <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dataroom_team_luna_name')}</h3>
                <p className="text-sm text-gray-600 mb-3">{t('dataroom_team_luna_role')}</p>
                <p className="text-sm text-gray-700 font-light">{t('dataroom_team_luna_bio')}</p>
              </Card>
              <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dataroom_team_builders_name')}</h3>
                <p className="text-sm text-gray-600 mb-3">{t('dataroom_team_builders_role')}</p>
                <p className="text-sm text-gray-700 font-light">{t('dataroom_team_builders_bio')}</p>
              </Card>
              <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dataroom_team_ofer_name')}</h3>
                <p className="text-sm text-gray-600 mb-3">{t('dataroom_team_ofer_role')}</p>
                <p className="text-sm text-gray-700 font-light">{t('dataroom_team_ofer_bio')}</p>
              </Card>
              <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dataroom_team_joao_name')}</h3>
                <p className="text-sm text-gray-600 mb-3">{t('dataroom_team_joao_role')}</p>
                <p className="text-sm text-gray-700 font-light">{t('dataroom_team_joao_bio')}</p>
              </Card>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">{t('dataroom_team_partners_title')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">CRU Architecture</p>
                  <p className="text-xs text-gray-500">Architecture</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">SCARD</p>
                  <p className="text-xs text-gray-500">Engineering</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">Coin Finance</p>
                  <p className="text-xs text-gray-500">Token & Web3</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">CAAC</p>
                  <p className="text-xs text-gray-500">Accounting</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">Fieldfisher</p>
                  <p className="text-xs text-gray-500">Legal (PT)</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">Lars Schlichting</p>
                  <p className="text-xs text-gray-500">Legal (CH)</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">Start PME</p>
                  <p className="text-xs text-gray-500">Grant Support</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">Crédito Agrícola</p>
                  <p className="text-xs text-gray-500">Banking</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">White Rabbit</p>
                  <p className="text-xs text-gray-500">Marketing & PR</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm text-gray-900">Kinterra</p>
                  <p className="text-xs text-gray-500">Regen Systems</p>
                </div>
              </div>
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
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_fiscal')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2+3</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€19,600</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_architecture')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2+3</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€25,000</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_engineering')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2+3</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€10,000</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_construction_rooms')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€767,242</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_kitchen')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">2</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€81,239</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_solar')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€52,065</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_smart_locks')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€22,902</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_heating')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">1+2</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€65,700</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_windows')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">—</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€22,200</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_greenhouse')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">3</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€17,680</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">{t('dataroom_map_studios')}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">3</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">€85,000</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                    <tr>
                      <td colSpan={2} className="px-6 py-5 font-bold text-gray-900 text-right">
                        {t('dataroom_investment_map_total')}:
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-xl text-gray-900">
                        €1,168,628
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
                <Link href="/dataroom/tdf-financial-plan.xlsx" target="_blank" className="block">
                  <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4 mx-auto">
                    <FileSpreadsheet className="w-7 h-7 text-violet-700" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_financial_plan_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_file')}</span>
                </Link>
              </Card>

              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link href="/dataroom/tdf-area-map.kml" target="_blank" className="block">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 mx-auto">
                    <Map className="w-7 h-7 text-emerald-700" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_area_map_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_file')}</span>
                </Link>
              </Card>

              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link href="/dataroom/tdf-architecture.pdf" target="_blank" className="block">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 mx-auto">
                    <Building2 className="w-7 h-7 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{t('dataroom_architecture_title')}</h3>
                  <span className="text-gray-900 font-medium text-sm underline">{t('dataroom_download_pdf')}</span>
                </Link>
              </Card>

              <Card className="p-8 text-center border border-gray-300 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <Link
                  href="/pdf/2021-TDF-report.pdf"
                  target="_blank"
                  className="block"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 mx-auto">
                    <BarChart3 className="w-7 h-7 text-blue-600" />
                  </div>
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
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                    <Sprout className="w-7 h-7 text-green-600" />
                  </div>
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
                  <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center mb-4 mx-auto">
                    <Droplets className="w-7 h-7 text-cyan-600" />
                  </div>
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
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4 mx-auto">
                    <Rocket className="w-7 h-7 text-orange-600" />
                  </div>
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
          </>
        )}
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
