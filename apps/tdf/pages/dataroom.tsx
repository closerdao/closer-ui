import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import JoinWebinarPrompt from 'closer/components/JoinWebinarPrompt';

import { Button, Heading, Card, LinkButton } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const t = useTranslations();

  const joinWebinar = () => {
    setIsPromptOpen(true);
  };

  return (
    <>
      <Head>
        <title>{t('dataroom_title')}</title>
        <meta name="description" content={t('dataroom_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section>
        {isPromptOpen && (
          <JoinWebinarPrompt setIsPromptOpen={setIsPromptOpen} />
        )}
        
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
                  {t('dataroom_executive_summary_title')}
                </Heading>
                <p className="text-xl text-black mb-8 leading-relaxed">
                  We're raising secured private loans at 5% fixed for 4 years to complete Europe's first DAO-governed regenerative village. Your investment directly funds the completion of 14 co-living suites, a farm-to-table restaurant, and the acquisition of 25ha of land for regenerative agriculture and community development.
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
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                {t('dataroom_investment_highlights_title')}
              </Heading>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Traditional Dream Factory offers impact investors a unique opportunity to support regenerative community development while earning competitive returns. Your investment drives environmental restoration, regenerative agriculture, and innovative governance models.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">€400k</div>
                <h3 className="text-xl font-bold mb-2">{t('dataroom_private_debt_title')}</h3>
                <p className="text-gray-600">{t('dataroom_private_debt_description')}</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">~€400k</div>
                <h3 className="text-xl font-bold mb-2">{t('dataroom_token_sales_title')}</h3>
                <p className="text-gray-600">{t('dataroom_token_sales_description')}</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl mb-4">25ha</div>
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
                    <div className="text-2xl font-bold text-gray-700">{t('dataroom_land_acquisition_amount')}</div>
                    <div className="text-sm text-gray-600">{t('dataroom_land_acquisition_description')}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Impact Investment Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Measurable environmental impact through regenerative agriculture and carbon sequestration</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Social innovation through DAO governance and community-driven development</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Financial returns secured by real estate collateral and proven operational model</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Scalable model for replicating regenerative communities across Europe</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>



        {/* Track Record & Development Status */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
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

        {/* Environmental Credits & Monitoring */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
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
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                Use of Funds
              </Heading>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
                Your investment directly funds regenerative community infrastructure: completing 14 co-living suites, establishing a farm-to-table restaurant, and acquiring 25ha of land for regenerative agriculture. Every euro invested creates measurable environmental and social impact.
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
                          <div className="text-xs text-gray-500 mt-1">75% of building + land, 10-year term at ~4%</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€562,500</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_private_loans')}</div>
                          <div className="text-xs text-gray-500 mt-1">Bridge land acquisition & construction</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€375,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_cohousing_deposits')}</div>
                          <div className="text-xs text-gray-500 mt-1">Convertible loans, may convert to tokens</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€300,000</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_source_token_sales')}</div>
                          <div className="text-xs text-gray-500 mt-1">900 tokens to 30 new citizens</div>
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
                          <div className="text-xs text-gray-500 mt-1">€550k + 8% fees - €30k rents paid</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€564,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_building_acquisition')}</div>
                          <div className="text-xs text-gray-500 mt-1">€200k + 8% transaction fees</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€216,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{t('dataroom_use_construction')}</div>
                          <div className="text-xs text-gray-500 mt-1">14 rooms + restaurant, 55% grant covered</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€1,100,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-semibold">Architecture & Engineering Fees</div>
                          <div className="text-xs text-gray-500 mt-1">Land development and planning fees</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">€50,000</td>
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
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
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
              Ready to Drive Regenerative Impact in Europe?
            </Heading>
            <p className="text-xl mb-8 opacity-90">
              Join us in creating Europe's first DAO-governed regenerative village. Your investment delivers both competitive returns and measurable environmental and social impact.
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
              <p>Secured by €1.0M+ in real estate collateral • 5% fixed returns • Measurable environmental impact • DAO governance innovation</p>
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
