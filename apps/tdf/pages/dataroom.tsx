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
                  {t('dataroom_heading')}
                </Heading>
                <p className="text-xl text-black mb-8 leading-relaxed">
                  {t('dataroom_intro')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <LinkButton
                    href="/pdf/deck.pdf"
                    target="_blank"
                    className="bg-accent text-white hover:bg-accent-dark"
                    onClick={() =>
                      event('click', {
                        category: 'Dataroom',
                        label: t('dataroom_investment_deck_label'),
                      })
                    }
                  >
                    {t('dataroom_investment_deck')}
                  </LinkButton>
                  <Button
                    className="bg-white text-accent border-2 border-white hover:bg-accent hover:text-white"
                    onClick={joinWebinar}
                  >
                    {t('dataroom_join_webinar')}
                  </Button>
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
                {t('dataroom_investment_highlights_subtitle')}
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
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_asset_purchase_title')}</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-accent pl-4">
                    <div className="font-semibold">{t('dataroom_buildings_portfolio_title')}</div>
                    <div className="text-2xl font-bold text-accent">{t('dataroom_buildings_portfolio_amount')}</div>
                    <div className="text-sm text-gray-600">{t('dataroom_buildings_portfolio_description')}</div>
                  </div>
                  <div className="border-l-4 border-accent pl-4">
                    <div className="font-semibold">{t('dataroom_land_acquisition_title')}</div>
                    <div className="text-2xl font-bold text-accent">{t('dataroom_land_acquisition_amount')}</div>
                    <div className="text-sm text-gray-600">{t('dataroom_land_acquisition_description')}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_investment_advantages_title')}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_advantage_1')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_advantage_2')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_advantage_3')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{t('dataroom_advantage_4')}</span>
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
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                {t('dataroom_track_record_title')}
              </Heading>
              <p className="text-lg text-gray-600 mb-8">
                {t('dataroom_track_record_subtitle')}{' '}
                <Link href="/roadmap" className="text-accent underline hover:text-accent-dark font-semibold">
                  {t('dataroom_detailed_roadmap')}
                </Link>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div>
                <Heading level={3} className="text-2xl mb-6 text-accent">
                  {t('dataroom_completed_milestones_title')}
                </Heading>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_1_title')}</strong> {t('dataroom_milestone_1_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_2_title')}</strong> {t('dataroom_milestone_2_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_3_title')}</strong> {t('dataroom_milestone_3_content')}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong>{t('dataroom_milestone_4_title')}</strong> {t('dataroom_milestone_4_content')}
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <Heading level={3} className="text-2xl mb-6 text-accent">
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
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_building_permits_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_building_permits_content')}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_zoning_phase_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_zoning_phase_content')}
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Environmental & Catalytic Capital */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                {t('dataroom_environmental_credits_title')}
              </Heading>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_carbon_tracking_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_carbon_tracking_content')}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_biodiversity_monitoring_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_biodiversity_monitoring_content')}
                </p>
              </Card>
            </div>

            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                {t('dataroom_catalytic_capital_title')}
              </Heading>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_philanthropic_grants_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_philanthropic_grants_content')}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_low_interest_loans_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_low_interest_loans_content')}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-accent">{t('dataroom_token_utility_title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('dataroom_token_utility_content')}
                </p>
              </Card>
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
              {t('dataroom_cta_title')}
            </Heading>
            <p className="text-xl mb-8 opacity-90">
              {t('dataroom_cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LinkButton
                href="/token"
              >
                {t('dataroom_cta_invest_tokens')}
              </LinkButton>
              <Button
                onClick={joinWebinar}
              >
                {t('dataroom_cta_schedule_call')}
              </Button>
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
