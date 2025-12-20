import Head from 'next/head';

import { useEffect, useRef, useState } from 'react';

import ReportDownloadModal from '../components/ReportDownloadModal';
import DynamicPhotoGallery from 'closer/components/PhotoGallery/DynamicPhotoGallery';
import LinkButton from 'closer/components/ui/LinkButton';
import UpcomingEventsIntro from 'closer/components/UpcomingEventsIntro';

import { Heading } from 'closer';
import { useBuyTokens } from 'closer/hooks/useBuyTokens';
import { useConfig } from 'closer/hooks/useConfig';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const t = useTranslations();

  const { getCurrentSupplyWithoutWallet } = useBuyTokens();
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig() || {};

  const [selectedReport, setSelectedReport] = useState<{
    year: string;
    url: string;
  } | null>(null);
  const [currentSupply, setCurrentSupply] = useState<number | null>(null);
  const [tokenHolders, setTokenHolders] = useState<number | null>(null);
  const [isLoadingChainData, setIsLoadingChainData] = useState(false);
  const hasFetchedChainData = useRef(false);

  useEffect(() => {
    if (!BLOCKCHAIN_DAO_TOKEN?.address) {
      setCurrentSupply(null);
      setTokenHolders(null);
      return;
    }
    
    if (hasFetchedChainData.current) return;
    
    hasFetchedChainData.current = true;
    const fetchTokenData = async () => {
      setIsLoadingChainData(true);
      try {
        const supply = await getCurrentSupplyWithoutWallet();
        setCurrentSupply(supply || null);
        
        try {
          const contractAddress = BLOCKCHAIN_DAO_TOKEN.address.toLowerCase();
          const holderListUrl = `https://api.celoscan.io/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=10000`;
          
          const response = await fetch(holderListUrl).catch((err) => {
            console.error('Fetch error:', err);
            return null;
          });
          
          if (response?.ok) {
            const data = await response.json();
            
            if (data.status === '1' && data.result) {
              if (Array.isArray(data.result) && data.result.length > 0) {
                const holderAddresses = data.result.map((holder: any) => {
                  if (typeof holder === 'string') {
                    return holder.toLowerCase();
                  }
                  return (holder.TokenHolderAddress || holder.address || '').toLowerCase();
                }).filter(Boolean);
                
                const uniqueHolders = new Set(holderAddresses).size;
                setTokenHolders(uniqueHolders);
              } else if (Array.isArray(data.result) && data.result.length === 0) {
                setTokenHolders(0);
              } else {
                setTokenHolders(null);
              }
            } else if (data.status === '0' && data.message) {
              setTokenHolders(null);
            } else {
              setTokenHolders(null);
            }
          } else {
            setTokenHolders(null);
          }
        } catch (err) {
          console.error('Error fetching token holders:', err);
          setTokenHolders(null);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
        setCurrentSupply(null);
        setTokenHolders(null);
      } finally {
        setIsLoadingChainData(false);
      }
    };

    fetchTokenData();
  }, [BLOCKCHAIN_DAO_TOKEN?.address]);

  return (
    <>
      <Head>
        <title>{t('home_title')}</title>
        <meta name="description" content={t('home_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <Heading
              className="mb-6 text-5xl md:text-6xl lg:text-7xl font-normal text-gray-900 tracking-tight leading-tight"
              data-testid="page-title"
              display
              level={1}
            >
              {t('home_hero_title')}
            </Heading>
            <p className="text-xl md:text-2xl text-gray-700 mb-16 leading-relaxed max-w-3xl mx-auto font-light">
              {t('home_hero_subtitle')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">280</div>
                <div className="text-xs text-gray-600 font-light">Token holders</div>
              </div>
              <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">€1.25M+</div>
                <div className="text-xs text-gray-600 font-light">Total capital raised</div>
              </div>
              <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center">
                <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">5ha</div>
                <div className="text-xs text-gray-600 font-light">Land under stewardship</div>
              </div>
              <div className="bg-gray-50 rounded border border-gray-300 p-6 text-center col-span-2 md:col-span-1">
                <div className="text-3xl md:text-4xl font-normal text-gray-900 mb-2 font-serif">€514k</div>
                <div className="text-xs text-gray-600 font-light">2029 revenue target</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <LinkButton
                href="/dataroom"
                variant="primary"
                onClick={() =>
                  event('click', {
                    category: 'HomePage',
                    label: 'explore_investment_options',
                  })
                }
              >
                {t('home_hero_cta_explore')}
              </LinkButton>
              <LinkButton
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedReport({
                    year: '2025',
                    url: '/pdf/2025-TDF-report.pdf',
                  });
                  event('click', {
                    category: 'HomePage',
                    label: 'download_2025_report',
                  });
                }}
              >
                {t('home_hero_cta_report')}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white -mt-8 md:-mt-12 w-full overflow-hidden">
        <DynamicPhotoGallery isSlider={true} className="w-full" />
      </section>

      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium text-center">
              {t('home_press_label')}
            </p>
            <Heading level={2} className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight text-center mb-4">
              {t('home_token_press_title')}
            </Heading>
            <div className="text-center flex items-center justify-center">
              <LinkButton
                href="/press"
                variant="secondary"
              >
                {t('home_token_press_cta')}
              </LinkButton>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
            <a 
              href="https://www.context.news/rethinking-the-economy/digital-nomads-seek-sun-sea-sustainability-as-remote-work-booms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all text-center"
            >
              <p className="text-sm font-serif font-bold text-gray-900 mb-1">Thomson Reuters</p>
              <p className="text-xs text-gray-600 font-light">Context</p>
            </a>
            <a 
              href="https://tynmagazine.com/traditional-dream-factory-surpasses-1-2-million-and-leads-the-regenerative-economy-in-europe"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all text-center"
            >
              <p className="text-sm font-serif font-bold text-gray-900 mb-1">TyN Magazine</p>
              <p className="text-xs text-gray-600 font-light">Nov 2025</p>
            </a>
            <a 
              href="https://jornaleconomico.sapo.pt/noticias/traditional-dream-factory-lanca-nova-ronda-de-investimento-de-800-mil-euros-para-expandir-a-sua-ecovila/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all text-center"
            >
              <p className="text-sm font-serif font-bold text-gray-900 mb-1">Jornal Económico</p>
              <p className="text-xs text-gray-600 font-light">Portugal</p>
            </a>
            <a 
              href="https://www.theportugalnews.com/news/2025-08-30/traditional-dream-factory-regenerative-village/85048"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all text-center"
            >
              <p className="text-sm font-serif font-bold text-gray-900 mb-1">The Portugal News</p>
              <p className="text-xs text-gray-600 font-light">Aug 2025</p>
            </a>
            <a 
              href="https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all text-center"
            >
              <p className="text-sm font-serif font-bold text-gray-900 mb-1">Expresso</p>
              <p className="text-xs text-gray-600 font-light">Portugal</p>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
                {t('home_token_section_label')}
              </p>
              <Heading display level={2} className="mb-6 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">
                {t('home_token_section_title')}
              </Heading>
              <p className="text-sm text-gray-700 mb-10 leading-relaxed font-light">
                {t('home_token_section_subtitle')}
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_token_feature_unlock_title')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light mb-3">
                      {t('home_token_feature_unlock_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V10M18 20V4M6 20v-4" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_token_feature_voice_title')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_token_feature_voice_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_token_feature_upside_title')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_token_feature_upside_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-300">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-300">
                <div className="w-14 h-14 bg-gray-900 rounded-lg flex items-center justify-center text-white font-semibold text-base">
                  $TDF
                </div>
                <Heading level={3} className="text-xl font-normal text-gray-900">
                  TDF Token
                </Heading>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded border border-gray-300 p-5">
                  <div className="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">
                    {t('home_token_stat_holders')}
                  </div>
                  <div className="text-2xl font-normal text-gray-900">
                    {isLoadingChainData ? '...' : (tokenHolders !== null ? tokenHolders.toLocaleString() : '—')}
                  </div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-5">
                  <div className="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">
                    {t('home_token_stat_supply')}
                  </div>
                  <div className="text-2xl font-normal text-gray-900">
                    {isLoadingChainData ? '...' : (currentSupply !== null ? currentSupply.toLocaleString() : '—')}
                  </div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-5">
                  <div className="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">
                    {t('home_token_stat_price')}
                  </div>
                  <div className="text-2xl font-normal text-gray-900">€256</div>
                  <div className="text-xs text-gray-600 mt-1 font-light">{t('home_token_stat_price_note')}</div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-5">
                  <div className="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">
                    {t('home_token_stat_raised')}
                  </div>
                  <div className="text-2xl font-normal text-gray-900">€384k</div>
                  <div className="text-xs text-gray-600 mt-1 font-light">{t('home_token_stat_raised_note')}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-16 border-t border-gray-300">
            <div className="max-w-3xl mx-auto">
              <Heading level={3} className="mb-4 text-xl md:text-2xl font-normal text-gray-900 tracking-tight">
                {t('home_token_citizenship_title')}
              </Heading>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed font-light">
                {t('home_token_citizenship_desc')}
              </p>
              <LinkButton
                href="/citizenship"
                variant="secondary"
              >
                {t('home_token_citizenship_cta')}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Completing the village */}
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
                {t('home_build_section_label')}
              </p>
              <Heading display level={2} className="mb-6 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">
                {t('home_build_section_title')}
              </Heading>
              <p className="text-sm text-gray-700 mb-10 max-w-3xl leading-relaxed font-light">
                {t('home_build_section_subtitle')}
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_build_item_suites')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_build_item_suites_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_build_item_studios')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_build_item_studios_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_build_item_restaurant')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_build_item_restaurant_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_build_item_mushroom')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_build_item_mushroom_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_build_item_wellness')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_build_item_wellness_desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Participation Structures */}
            <div>
              <Heading display level={2} className="mb-6 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">
                {t('home_investment_opportunities_title')}
              </Heading>

              <div className="space-y-8">
                <div className="border-t border-gray-300 pt-8">
                  <Heading level={3} className="mb-4 text-base font-semibold text-gray-900">
                    {t('home_invest_cohousing_title')}
                  </Heading>
                  <p className="text-sm text-gray-700 mb-6 leading-relaxed font-light">
                    {t('home_invest_cohousing_desc')}
                  </p>
                  <LinkButton
                    href="/dataroom"
                    variant="secondary"
                    className="w-full"
                  >
                    {t('home_invest_cohousing_cta')}
                  </LinkButton>
                </div>

                <div className="border-t border-gray-300 pt-8">
                  <Heading level={3} className="mb-4 text-base font-semibold text-gray-900">
                    {t('home_invest_tokens_title')}
                  </Heading>
                  <p className="text-sm text-gray-700 mb-6 leading-relaxed font-light">
                    {t('home_invest_tokens_desc')}
                  </p>
                  <LinkButton
                    href="/token"
                    variant="secondary"
                    className="w-full"
                  >
                    {t('home_invest_tokens_cta')}
                  </LinkButton>
                </div>

                <div className="border-t border-gray-300 pt-8">
                  <Heading level={3} className="mb-4 text-base font-semibold text-gray-900">
                    {t('home_invest_lending_title')}
                  </Heading>
                  <p className="text-sm text-gray-700 mb-6 leading-relaxed font-light">
                    {t('home_invest_lending_desc')}
                  </p>
                  <LinkButton
                    href="/dataroom"
                    variant="secondary"
                    className="w-full"
                  >
                    {t('home_invest_lending_cta')}
                  </LinkButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <Heading display level={2} className="mb-6 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">
            {t('home_built_title')}
          </Heading>
          <p className="text-sm text-gray-700 mb-14 max-w-3xl leading-relaxed font-light">
            {t('home_built_subtitle')}
          </p>
          
          <div className="space-y-12 mb-12">
            {/* 2023 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 bg-accent rounded-full flex-shrink-0"></div>
                <div className="bg-accent w-[2px] h-full mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Heading level={4} className="text-accent uppercase font-normal text-sm">
                    2023
                  </Heading>
                  <p className="uppercase font-bold text-sm text-gray-900">
                    {t('roadmap_2023_title')}
                  </p>
                </div>
                <ul className="space-y-2 list-none pl-0">
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2023_bullet_1')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2023_bullet_2')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2023_bullet_5')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2024 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 bg-accent rounded-full flex-shrink-0"></div>
                <div className="bg-accent w-[2px] h-full mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Heading level={4} className="text-accent uppercase font-normal text-sm">
                    2024
                  </Heading>
                  <p className="uppercase font-bold text-sm text-gray-900">
                    {t('roadmap_2024_fundraising')}
                  </p>
                </div>
                <ul className="space-y-2 list-none pl-0">
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2024_bullet_1')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2024_bullet_2')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2024_bullet_3')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2025 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 bg-accent-light border-4 border-accent rounded-full flex-shrink-0"></div>
                <div className="bg-accent-light w-[2px] h-full mt-2"></div>
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Heading level={4} className="text-accent uppercase font-normal text-sm">
                    2025
                  </Heading>
                  <p className="uppercase font-bold text-sm text-gray-900">
                    {t('roadmap_2025_title')}
                  </p>
                </div>
                <ul className="space-y-2 list-none pl-0">
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2025_bullet_1')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2025_bullet_4')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2025_bullet_6')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2026 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 bg-accent-light rounded-full flex-shrink-0"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Heading level={4} className="text-accent uppercase font-normal text-sm">
                    2026
                  </Heading>
                  <p className="uppercase font-bold text-sm text-gray-900">
                    {t('roadmap_2026_title')}
                  </p>
                </div>
                <ul className="space-y-2 list-none pl-0">
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2026_bullet_1')}</span>
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light flex items-start">
                    <span className="text-accent mr-3 mt-1">•</span>
                    <span>{t('roadmap_2026_bullet_2')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 border-t border-gray-200">
            <LinkButton
              href="/roadmap"
              variant="secondary"
            >
              {t('home_built_roadmap_cta')}
            </LinkButton>
          </div>
        </div>
      </section>


      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-accent mb-4 font-semibold">
              {t('home_authority_section_label')}
            </p>
            <Heading display level={2} className="mb-6 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('home_authority_section_title')}
            </Heading>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-3">
                {t('home_authority_swiss_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed font-light">
                {t('home_authority_swiss_desc')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-3">
                {t('home_authority_academic_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed font-light">
                {t('home_authority_academic_desc')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-3">
                {t('home_authority_transparency_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed font-light">
                {t('home_authority_transparency_desc')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute -top-4 -left-4 text-8xl md:text-9xl text-gray-200 font-serif leading-none">&ldquo;</div>
              <blockquote className="text-2xl md:text-3xl font-light text-gray-900 leading-relaxed mb-6 relative z-10 italic">
                {t('home_authority_quote_1')}
              </blockquote>
              <p className="text-sm text-gray-600 font-medium">{t('home_authority_quote_1_source')}</p>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 text-8xl md:text-9xl text-gray-200 font-serif leading-none">&ldquo;</div>
              <blockquote className="text-2xl md:text-3xl font-light text-gray-900 leading-relaxed mb-6 relative z-10 italic">
                {t('home_authority_quote_2')}
              </blockquote>
              <p className="text-sm text-gray-600 font-medium">{t('home_authority_quote_2_source')}</p>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-200 max-w-5xl mx-auto">
            <p className="text-sm text-gray-600 mb-6 text-center font-light">
              {t('home_authority_reports_intro')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton
                className="w-fit"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedReport({
                    year: '2025',
                    url: '/pdf/2025-TDF-report.pdf',
                  })
                } }
              >
                {t('home_reports_2025')}
              </LinkButton>
              <LinkButton
                className="w-fit"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedReport({
                    year: '2024',
                    url: '/pdf/2024-TDF-report.pdf',
                  })
                } }
              >
                {t('home_reports_2024')}
              </LinkButton>
              <LinkButton
                className="w-fit"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedReport({
                    year: '2022',
                    url: '/pdf/2022-TDF-report.pdf',
                  })
                } }
              >
                {t('home_reports_2022')}
              </LinkButton>
              <LinkButton
                className="w-fit"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedReport({
                    year: '2021',
                    url: '/pdf/2021-TDF-report.pdf',
                  })
                } }
              >
                {t('home_reports_2021')}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 md:py-28 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heading level={2} className="mb-4 text-2xl md:text-3xl font-light text-gray-900 tracking-tight">
            {t('home_dataroom_teaser_title')}
          </Heading>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            {t('home_dataroom_teaser_desc')}
          </p>
          <LinkButton
            href="/dataroom"
            variant="primary"
            onClick={() =>
              event('click', {
                category: 'HomePage',
                label: 'view_dataroom',
              })
            }
          >
            {t('home_dataroom_teaser_cta')}
          </LinkButton>
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-4 font-medium">
            {t('home_webinar_section_label')}
          </p>
          <Heading display level={2} className="mb-6 text-3xl md:text-4xl font-normal text-white tracking-tight">
            {t('home_webinar_section_title')}
          </Heading>
          <p className="text-base text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
            {t('home_webinar_section_desc')}
          </p>
          <div className="bg-white rounded-xl p-8 md:p-10 shadow-xl border border-gray-200 max-w-2xl mx-auto">
            <form 
              className="flex flex-col sm:flex-row gap-3 mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name');
                const email = formData.get('email');
                window.open(`https://calendly.com/samueldelesque?name=${encodeURIComponent(name as string)}&email=${encodeURIComponent(email as string)}`, '_blank');
              }}
            >
              <input
                type="text"
                name="name"
                placeholder={t('home_webinar_form_name')}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <input
                type="email"
                name="email"
                placeholder={t('home_webinar_form_email')}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                {t('home_webinar_form_submit')}
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center">
              {t('home_webinar_form_note')}
            </p>
          </div>
        </div>
      </section>

      <UpcomingEventsIntro />

      {selectedReport && (
        <ReportDownloadModal
          closeModal={() => setSelectedReport(null)}
          reportYear={selectedReport.year}
          reportUrl={selectedReport.url}
        />
      )}
    </>
  );
};

export default HomePage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale, 'tdf'),
    },
  };
}
