import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useRef, useState } from 'react';

import ReportDownloadModal from '../components/ReportDownloadModal';
import LandingPagePhotoMosaic from '../components/LandingPagePhotoMosaic';
import FundraisingWidget from 'closer/components/FundraisingWidget';
import LinkButton from 'closer/components/ui/LinkButton';
import UpcomingEventsIntro from 'closer/components/UpcomingEventsIntro';

import {
  Heading,
  WalletState,
  useAuth,
  Webinar,
} from 'closer';
import { useBuyTokens } from 'closer/hooks/useBuyTokens';
import { useConfig } from 'closer/hooks/useConfig';
import { FundraisingConfig } from 'closer/types';
import api from 'closer/utils/api';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { ArrowRight, Check, Circle, Home, Users } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const t = useTranslations();

  const { isAuthenticated, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);
  const { getCurrentSupplyWithoutWallet } = useBuyTokens();
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig() || {};
  const router = useRouter();

  const [selectedReport, setSelectedReport] = useState<{
    year: string;
    url: string;
  } | null>(null);
  const [currentSupply, setCurrentSupply] = useState<number | null>(null);
  const [tokenHolders, setTokenHolders] = useState<number | null>(null);
  const [isLoadingChainData, setIsLoadingChainData] = useState(false);
  const [fundraisingConfig, setFundraisingConfig] = useState<FundraisingConfig | null>(null);
  const hasFetchedChainData = useRef(false);

  const isFundraiserEnabled = process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true';

  useEffect(() => {
    if (!isFundraiserEnabled) return;
    
    const fetchFundraisingConfig = async () => {
      try {
        const res = await api.get('/config/fundraiser');
        setFundraisingConfig(res?.data?.results?.value);
      } catch (error) {
        console.error('Error fetching fundraising config:', error);
      }
    };
    
    fetchFundraisingConfig();
  }, [isFundraiserEnabled]);

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
  }, []);

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
              className="mb-4 text-4xl md:text-6xl"
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
              <div className="bg-accent-light/50 rounded-lg p-6 text-center border border-accent/10">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">280</div>
                <div className="text-xs text-gray-700 font-medium">{t('home_stats_token_holders')}</div>
              </div>
              <div className="bg-accent-light/50 rounded-lg p-6 text-center border border-accent/10">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">€1.25M+</div>
                <div className="text-xs text-gray-700 font-medium">{t('home_stats_total_capital')}</div>
              </div>
              <div className="bg-accent-light/50 rounded-lg p-6 text-center border border-accent/10">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">25ha</div>
                <div className="text-xs text-gray-700 font-medium">{t('home_stats_land_stewardship')}</div>
              </div>
              <div className="bg-accent-light/50 rounded-lg p-6 text-center border border-accent/10 col-span-2 md:col-span-1">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">€514k</div>
                <div className="text-xs text-gray-700 font-medium">{t('home_stats_revenue_target')}</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <LinkButton
                href="/#participation-structures"
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
        <LandingPagePhotoMosaic className="w-full" />
      </section>

      <section className="bg-white py-14 md:py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-6">
            {t('home_press_label')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-5">
            <a 
              href="https://www.context.news/rethinking-the-economy/digital-nomads-seek-sun-sea-sustainability-as-remote-work-booms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base font-semibold text-gray-800 hover:text-gray-900 transition-colors"
            >
              Thomson Reuters
            </a>
            <a 
              href="https://tynmagazine.com/traditional-dream-factory-surpasses-1-2-million-and-leads-the-regenerative-economy-in-europe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-gray-800 hover:text-gray-900 transition-colors"
            >
              TyN Magazine
            </a>
            <a 
              href="https://jornaleconomico.sapo.pt/noticias/traditional-dream-factory-lanca-nova-ronda-de-investimento-de-800-mil-euros-para-expandir-a-sua-ecovila/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-gray-800 hover:text-gray-900 transition-colors"
            >
              Jornal Económico
            </a>
            <a 
              href="https://www.theportugalnews.com/news/2025-08-30/traditional-dream-factory-regenerative-village/85048"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-gray-800 hover:text-gray-900 transition-colors"
            >
              The Portugal News
            </a>
            <a 
              href="https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-gray-800 hover:text-gray-900 transition-colors"
            >
              Expresso
            </a>
          </div>
          <Link href="/press" className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
            {t('home_token_press_cta')}
          </Link>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <Heading level={4} className="text-base font-semibold text-gray-900 mb-2">
                      {t('home_token_feature_longterm_title')}
                    </Heading>
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {t('home_token_feature_longterm_desc')}
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
                  {t('home_token_name')}
                </Heading>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded border border-gray-300 p-5">
                  <div className="text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium">
                    {t('home_token_stat_holders')}
                  </div>
                  <div className="text-2xl font-normal text-gray-900">
                    {isLoadingChainData ? '...' : (tokenHolders !== null ? tokenHolders.toLocaleString() : '280')}
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
              <div className="mt-6">
                <LinkButton
                  href="/token"
                  variant="primary"
                >
                  {t('home_token_buy_cta')}
                </LinkButton>
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


      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <img 
            src="/images/landing/land-plan.png" 
            alt={t('home_land_plan_alt')} 
            className="w-full h-auto rounded-xl shadow-lg"
          />
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <Heading level={3} className="text-xl font-semibold text-gray-900 mb-4">
                {t('home_land_food_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                {t('home_land_food_desc')}
              </p>
              <Link href="/pages/regenerative-agriculture" className="text-sm font-medium text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1">
                {t('home_land_food_cta')} →
              </Link>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <Heading level={3} className="text-xl font-semibold text-gray-900 mb-4">
                {t('home_land_ecology_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                {t('home_land_ecology_desc')}
              </p>
              <Link href="/pages/ecology" className="text-sm font-medium text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1">
                {t('home_land_ecology_cta')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
              {t('home_build_section_label')}
            </p>
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('home_built_title')}
            </Heading>
            <p className="text-base text-gray-700 max-w-2xl mx-auto leading-relaxed font-light">
              {t('home_built_subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <Heading level={3} className="text-xl font-semibold text-gray-900 mb-6">
                {t('home_build_section_title')}
              </Heading>
              <p className="text-sm text-gray-700 mb-8 leading-relaxed font-light">
                {t('home_build_section_subtitle')}
              </p>
              <div className="space-y-5">
                {[
                  { titleKey: 'home_build_item_suites', descKey: 'home_build_item_suites_desc' },
                  { titleKey: 'home_build_item_flex', descKey: 'home_build_item_flex_desc' },
                  { titleKey: 'home_build_item_studios', descKey: 'home_build_item_studios_desc' },
                  { titleKey: 'home_build_item_restaurant', descKey: 'home_build_item_restaurant_desc' },
                  { titleKey: 'home_build_item_mushroom', descKey: 'home_build_item_mushroom_desc' },
                  { titleKey: 'home_build_item_wellness', descKey: 'home_build_item_wellness_desc' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-accent rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{t(item.titleKey)}</span>
                      <span className="text-sm text-gray-600"> — {t(item.descKey)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent to-accent-light"></div>
              <div className="space-y-6">
                {[
                  { date: '2023', titleKey: 'roadmap_2023_title', bullets: ['roadmap_2023_bullet_1', 'roadmap_2023_bullet_2'], status: 'complete' },
                  { date: '2024', titleKey: 'roadmap_2024_fundraising', bullets: ['roadmap_2024_bullet_1', 'roadmap_2024_bullet_2'], status: 'complete' },
                  { date: '2025', titleKey: 'roadmap_2025_title', bullets: ['roadmap_2025_bullet_4', 'roadmap_2025_bullet_6'], status: 'complete' },
                  { date: '2026', titleKey: 'roadmap_2026_title', bullets: ['roadmap_2026_bullet_1'], status: 'current' },
                  { date: '2027', titleKey: 'roadmap_2027_title', bullets: ['roadmap_2027_bullet_1'], status: 'upcoming' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-4 border-gray-50 ${
                      item.status === 'complete' ? 'bg-accent text-white' : 
                      item.status === 'current' ? 'bg-accent-light border-accent text-accent' : 
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {item.status === 'complete' ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <div className="pt-1 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-accent font-medium tracking-wider uppercase">
                          {item.date}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {t(item.titleKey)}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {item.bullets.map((bullet, j) => (
                          <li key={j} className="text-sm text-gray-600 leading-relaxed font-light">
                            {t(bullet)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-8 pl-[72px]">
                <LinkButton href="/roadmap" variant="secondary">
                  {t('home_built_roadmap_cta')}
                </LinkButton>
              </div>
            </div>
          </div>

          {isFundraiserEnabled && fundraisingConfig?.enabled && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border-2 border-accent/20 p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-accent mb-2 font-semibold">
                      {t('home_fundraising_preview_label')}
                    </p>
                    <Heading level={3} className="text-lg font-semibold text-gray-900 mb-2">
                      {t('home_fundraising_preview_title')}
                    </Heading>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t('home_fundraising_preview_desc')}
                    </p>
                  </div>
                  <div className="w-full sm:w-auto flex-shrink-0">
                    <FundraisingWidget 
                      variant="hero" 
                      fundraisingConfig={fundraisingConfig} 
                      className="mb-4"
                    />
                    <Link 
                      href="/invest"
                      className="group flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                      onClick={() =>
                        event('click', {
                          category: 'HomePage',
                          label: 'invest_from_roadmap_section',
                        })
                      }
                    >
                      {t('home_fundraising_preview_cta')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Co-housing Section */}
      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent mb-4 font-semibold">
                {t('home_cohousing_section_label')}
              </p>
              <Heading display level={2} className="mb-6 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">
                {t('home_cohousing_section_title')}
              </Heading>
              <p className="text-base text-gray-700 mb-6 leading-relaxed font-light">
                {t('home_cohousing_section_desc')}
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    {t('home_cohousing_feature_houses')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    {t('home_cohousing_feature_neighbors')}
                  </p>
                </div>
              </div>
              <LinkButton href="/cohousing" variant="primary">
                {t('home_cohousing_cta')}
              </LinkButton>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-8 border border-accent/20">
              <div className="text-center">
                <div className="text-6xl font-bold text-accent mb-2">23</div>
                <p className="text-lg font-medium text-gray-900 mb-4">{t('home_cohousing_stat_title')}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('home_cohousing_stat_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Participation Structures */}
      <section id="participation-structures" className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <Heading display level={2} className="mb-4 text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">
              {t('home_investment_opportunities_title')}
            </Heading>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <Heading level={3} className="mb-3 text-lg font-semibold text-gray-900">
                {t('home_invest_tokens_title')}
              </Heading>
              <p className="text-sm text-gray-700 mb-5 leading-relaxed font-light">
                {t('home_invest_tokens_desc')}
              </p>
              <LinkButton href="/token" variant="secondary">
                {t('home_invest_tokens_cta')}
              </LinkButton>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <Heading level={3} className="mb-3 text-lg font-semibold text-gray-900">
                {t('home_invest_lending_title')}
              </Heading>
              <p className="text-sm text-gray-700 mb-5 leading-relaxed font-light">
                {t('home_invest_lending_desc')}
              </p>
              <LinkButton href="/dataroom" variant="secondary">
                {t('home_invest_lending_cta')}
              </LinkButton>
            </div>
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
            <a href="https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a" target="_blank" rel="noopener noreferrer" className="relative block hover:opacity-80 transition-opacity">
              <div className="absolute -top-4 -left-4 text-8xl md:text-9xl text-gray-200 font-serif leading-none">&ldquo;</div>
              <blockquote className="text-2xl md:text-3xl font-light text-gray-900 leading-relaxed mb-6 relative z-10 italic">
                {t('home_authority_quote_1')}
              </blockquote>
              <p className="text-sm text-gray-600 font-medium">{t('home_authority_quote_1_source')}</p>
            </a>
            <a href="https://jornaleconomico.sapo.pt/noticias/48-dos-portugueses-sonham-trocar-a-cidade-pelo-campo/" target="_blank" rel="noopener noreferrer" className="relative block hover:opacity-80 transition-opacity">
              <div className="absolute -top-4 -left-4 text-8xl md:text-9xl text-gray-200 font-serif leading-none">&ldquo;</div>
              <blockquote className="text-2xl md:text-3xl font-light text-gray-900 leading-relaxed mb-6 relative z-10 italic">
                {t('home_authority_quote_2')}
              </blockquote>
              <p className="text-sm text-gray-600 font-medium">{t('home_authority_quote_2_source')}</p>
            </a>
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

      <Webinar tags={['landing-page', 'investor-webinar']} analyticsCategory="HomePage" />

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
