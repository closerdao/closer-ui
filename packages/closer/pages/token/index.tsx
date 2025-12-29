import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import Ama from '../../components/Ama';
import PeekIntoFuture from '../../components/PeekIntoFuture';
import { Button, Card, Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH } from '../../constants';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig, Listing } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

const ACCOMMODATION_ICONS = ['van.png', 'camping.png', 'hotel.png'];

interface Props {
  listings: Listing[];
  generalConfig: GeneralConfig | null;
}

const PublicTokenSalePage = ({ listings, generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const hasComponentRendered = useRef(false);

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { getTokensAvailableForPurchase, getCurrentSupplyWithoutWallet } = useBuyTokens();
  const { BLOCKCHAIN_DAO_TOKEN } = defaultConfig || {};

  const router = useRouter();

  const [tokensAvailable, setTokensAvailable] = useState<number | null>(null);
  const [currentSupply, setCurrentSupply] = useState<number | null>(null);
  const [tokenHolders, setTokenHolders] = useState<number | null>(null);
  const [isLoadingChainData, setIsLoadingChainData] = useState(false);
  const hasFetchedChainData = useRef(false);
  const hasFetchedTokensAvailable = useRef(false);
  const tokenAddressRef = useRef<string | null>(null);
  const isFetchingChainData = useRef(false);
  const isFetchingTokensAvailable = useRef(false);

  const tokenAddress = BLOCKCHAIN_DAO_TOKEN?.address || null;

  useEffect(() => {
    if (hasFetchedTokensAvailable.current || isFetchingTokensAvailable.current) return;
    
    hasFetchedTokensAvailable.current = true;
    isFetchingTokensAvailable.current = true;
    
    (async () => {
      try {
        const remainingAmount = await getTokensAvailableForPurchase();
        setTokensAvailable(remainingAmount);
      } catch (error) {
        console.error('Error fetching tokens available:', error);
        setTokensAvailable(0);
      } finally {
        isFetchingTokensAvailable.current = false;
      }
    })();
  }, [getTokensAvailableForPurchase]);

  useEffect(() => {
    if (!tokenAddress) {
      if (!hasFetchedChainData.current) {
        setCurrentSupply(0);
        setTokenHolders(0);
      }
      return;
    }
    
    if (tokenAddressRef.current === tokenAddress && hasFetchedChainData.current) {
      return;
    }
    
    if (isFetchingChainData.current) {
      return;
    }
    
    tokenAddressRef.current = tokenAddress;
    hasFetchedChainData.current = true;
    isFetchingChainData.current = true;
    
    const fetchChainData = async () => {
      setIsLoadingChainData(true);
      try {
        const supply = await getCurrentSupplyWithoutWallet();
        setCurrentSupply(supply || 0);

        try {
          const contractAddress = tokenAddress.toLowerCase();
          const holderListUrl = `https://api.celoscan.io/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=10000`;
          
          const response = await fetch(holderListUrl).catch((err) => {
            console.error('Fetch error:', err);
            return null;
          });
          
          if (response?.ok) {
            const data = await response.json();
            console.log('Celoscan tokenholderlist response:', data);
            
            if (data.status === '1' && data.result) {
              if (Array.isArray(data.result) && data.result.length > 0) {
                const holderAddresses = data.result.map((holder: any) => {
                  if (typeof holder === 'string') {
                    return holder.toLowerCase();
                  }
                  return (holder.TokenHolderAddress || holder.address || '').toLowerCase();
                }).filter(Boolean);
                
                const uniqueHolders = new Set(holderAddresses).size;
                console.log('Token holders found:', uniqueHolders, 'from', data.result.length, 'results');
                setTokenHolders(uniqueHolders);
              } else if (Array.isArray(data.result) && data.result.length === 0) {
                console.log('Empty holder list returned');
                setTokenHolders(0);
              } else {
                console.warn('Unexpected result format:', typeof data.result, data.result);
                setTokenHolders(null);
              }
            } else if (data.status === '0' && data.message) {
              console.warn('API error:', data.message);
              if (data.message.includes('rate limit') || data.message.includes('Invalid API Key')) {
                setTokenHolders(null);
              } else {
                setTokenHolders(null);
              }
            } else {
              console.warn('Unexpected API response format:', data);
              setTokenHolders(null);
            }
          } else {
            const errorText = await response?.text().catch(() => 'Unknown error');
            console.error('API response not OK:', response?.status, response?.statusText, errorText);
            setTokenHolders(null);
          }
        } catch (error) {
          console.error('Error fetching token holders:', error);
          setTokenHolders(null);
        }
      } catch (error) {
        console.error('Error fetching chain data:', error);
        setCurrentSupply(0);
        setTokenHolders(0);
      } finally {
        setIsLoadingChainData(false);
        isFetchingChainData.current = false;
      }
    };

    fetchChainData();
  }, [tokenAddress, getCurrentSupplyWithoutWallet]);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
          await api.post('/metric', {
            event: 'page-view',
            value: 'token-sale',
            point: 0,
            category: 'engagement',
          });
          console.log('metric posted');
        } catch (error) {
          console.error('Error logging page view:', error);
        }
      })();
      hasComponentRendered.current = true;
    }
  }, []);

  const handleNext = async () => {
    router.push('/token/before-you-begin');
  };

  const logDownloadWhitepaperAction = async () => {
    await api.post('/metric', {
      event: 'download-whitepaper',
      value: 'token-sale',
      point: 0,
      category: 'engagement',
    });
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return (
      <>
        <Head>
          <title>{`${t(
            'token_sale_public_sale_heading',
          )} - ${PLATFORM_NAME}`}</title>
          <link
            rel="canonical"
            href="https://www.traditionaldreamfactory.com/token"
            key="canonical"
          />
        </Head>

        <div className="max-w-6xl mx-auto">
          <Heading level={1} className="mb-14">
            {t('token_sale_public_sale_heading')}
          </Heading>

          <Heading level={2}>{t('generic_coming_soon')}!</Heading>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>{`${t(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <main className="pt-4 pb-24">
        <section className="mb-10">
          <div className="rounded-lg bg-gradient-to-br from-accent-light to-accent-alt-light py-12 md:py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Heading
                level={1}
                display
                className="text-center mb-4 text-4xl md:text-6xl"
              >
                {t('token_sale_hero_epic_heading')}
              </Heading>
              <Heading
                level={2}
                className="text-center px-4 text-xl md:text-2xl max-w-[600px] mx-auto font-normal mb-8"
              >
                {t('token_sale_hero_epic_subheading')}
              </Heading>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 max-w-3xl mx-auto">
                <Card className="p-4 text-center bg-white/90">
                  <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                    {t('token_total_supply_amount')}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('token_total_supply_title')}
                  </div>
                </Card>

                <Card className="p-4 text-center bg-white/90">
                  <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                    {isLoadingChainData ? '...' : (currentSupply !== null ? currentSupply.toLocaleString() : '—')}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('token_supply_current')}
                  </div>
                </Card>

                <Card className="p-4 text-center bg-white/90">
                  <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                    {currentSupply !== null 
                      ? Math.max(0, Math.round(currentSupply - (18600 * 0.2))).toLocaleString()
                      : '—'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('token_supply_sold')}
                  </div>
                </Card>

                <Card className="p-4 text-center bg-white/90">
                  <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                    {currentSupply !== null 
                      ? Math.max(0, 18600 - currentSupply).toLocaleString()
                      : (isLoadingChainData ? '...' : '—')}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('token_supply_remaining')}
                  </div>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  className="!w-60 font-bold"
                  onClick={handleNext}
                  variant="primary"
                >
                  {t('token_sale_public_sale_buy_token')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PeekIntoFuture />

        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <Heading level={2} className="text-center mb-4 text-3xl">
              {t('token_sale_accommodation_heading')}
            </Heading>
            <p className="text-center max-w-2xl mx-auto text-lg mb-12">
              {t('token_sale_accommodation_description')}
            </p>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <Heading level={3} className="mb-6">
                  {t('token_sale_public_sale_heading_accommodation_cost')}
                </Heading>
                <Card className="p-6 mb-6">
                  <div className="text-right text-sm text-gray-600 mb-4">
                    {t('token_sale_public_sale_price_per_night')}
                  </div>
                  <div className="space-y-4">
                    {listings &&
                      listings.filter((listing: any) => listing.tokenPrice?.val > 0).map((listing: any) => {
                        const getIcon = () => {
                          if (listing.name.toLowerCase().includes('van')) {
                            return ACCOMMODATION_ICONS[0];
                          }
                          if (listing.name.toLowerCase().includes('private') ||
                              listing.name.toLowerCase().includes('camping') ||
                              listing.name.toLowerCase().includes('glamping') ||
                              listing.name.toLowerCase().includes('shared')) {
                            return ACCOMMODATION_ICONS[1];
                          }
                          return ACCOMMODATION_ICONS[2];
                        };

                        return (
                          <div key={listing.name} className="flex items-center gap-4 pb-4 border-b last:border-0">
                            <Image
                              src={`/images/token-sale/${getIcon()}`}
                              alt=""
                              width={40}
                              height={40}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{listing.name}</p>
                            </div>
                            <p className="text-accent font-semibold">
                              {t('token_sale_public_sale_token_symbol')} {listing.tokenPrice?.val || 0}
                            </p>
                          </div>
                        );
                      })}

                    <div className="flex items-center gap-4 pb-4 border-b">
                      <Image
                        src="/images/token-sale/hotel.png"
                        alt=""
                        width={40}
                        height={40}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t('token_sale_public_sale_shared_suite')}</p>
                        <span className="text-xs text-accent">{t('token_sale_public_sale_coming_soon')}</span>
                      </div>
                      <p className="text-accent font-semibold">{t('token_sale_public_sale_token_symbol')} 1</p>
                    </div>
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <Image
                        src="/images/token-sale/hotel.png"
                        alt=""
                        width={40}
                        height={40}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t('token_sale_public_sale_private_suite')}</p>
                        <span className="text-xs text-accent">{t('token_sale_public_sale_coming_soon')}</span>
                      </div>
                      <p className="text-accent font-semibold">{t('token_sale_public_sale_token_symbol')} 2</p>
                    </div>
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <Image
                        src="/images/token-sale/hotel.png"
                        alt=""
                        width={40}
                        height={40}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t('token_sale_public_sale_studio')}</p>
                        <span className="text-xs text-accent">{t('token_sale_public_sale_coming_soon')}</span>
                      </div>
                      <p className="text-accent font-semibold">{t('token_sale_public_sale_token_symbol')} 3</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Image
                        src="/images/token-sale/hotel.png"
                        alt=""
                        width={40}
                        height={40}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t('token_sale_public_sale_token_symbol')} 5</p>
                      </div>
                      <p className="text-accent font-semibold">{t('token_sale_public_sale_token_symbol')} 5</p>
                    </div>
                  </div>
                </Card>

                <div className="mb-6">
                  <Heading level={3} className="mb-3">
                    {t('token_sale_utility_fee')}
                  </Heading>
                  <p className="text-gray-700">
                    {t('token_sale_utility_fee_desc_1')}{' '}
                    {t('token_sale_utility_fee_desc_2')}
                  </p>
                </div>
              </div>

              <div>
                <Image
                  className="w-full rounded-lg"
                  src="/images/token-sale/accommodation.png"
                  width={577}
                  height={535}
                  alt={t('token_sale_tdf_accommodation_heading')}
                />
                <div className="mt-6 space-y-4 text-sm">
                  <p className="text-accent font-medium">
                    {t('token_sale_token_night_value')}
                  </p>
                  <p className="text-accent font-medium">
                    {t('token_sale_token_access_description')}
                  </p>
                  <p className="text-gray-700">
                    {t('token_sale_booking_approval')}
                  </p>
                  <p className="text-gray-700">
                    {t('token_sale_governance_rights')}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Button onClick={handleNext}>
                {t('token_sale_secure_your_spot_button')}
              </Button>
            </div>
          </div>
        </section>


        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <Heading level={2} className="mb-12 text-3xl text-center">
              {t('token_tools_title')}
            </Heading>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6">
                <Heading level={3} className="mb-4 text-xl">
                  {t('token_utility_title')}
                </Heading>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-700">{t('token_utility_accommodation')}</span>
                    <span className="font-semibold text-accent">1 token = 1 night/year</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-700">{t('token_utility_governance')}</span>
                    <span className="font-semibold text-accent">{t('token_utility_governance_value')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-700">{t('token_utility_events')}</span>
                    <span className="font-semibold text-accent">{t('token_utility_events_value')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-700">{t('token_utility_citizenship')}</span>
                    <span className="font-semibold text-accent">{t('token_utility_citizenship_value')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{t('token_utility_secondary')}</span>
                    <span className="font-semibold text-accent">{t('token_utility_secondary_value')}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <Heading level={3} className="mb-4 text-xl">
                  {t('token_total_supply_title')}
                </Heading>
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-accent mb-2">
                    {t('token_total_supply_amount')}
                  </div>
                  <p className="text-gray-600">
                    {t('token_total_supply_description')}
                  </p>
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('token_supply_current')}</span>
                      <span className="font-semibold">
                        {isLoadingChainData ? t('token_supply_loading') : (currentSupply !== null ? currentSupply.toLocaleString() : '—')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('token_supply_sold')}</span>
                      <span className="font-semibold">
                        {currentSupply !== null 
                          ? Math.max(0, Math.round(currentSupply - (18600 * 0.2))).toLocaleString()
                          : t('token_supply_sold_amount')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('token_supply_remaining')}</span>
                      <span className="font-semibold">
                        {currentSupply !== null 
                          ? Math.max(0, 18600 - currentSupply).toLocaleString()
                          : (isLoadingChainData ? t('token_supply_loading') : '—')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-700">{t('token_holders_count')}</span>
                      <span className="font-semibold">
                        {isLoadingChainData ? t('token_supply_loading') : (tokenHolders !== null ? tokenHolders.toLocaleString() : '280+')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="mb-12 bg-gradient-to-br from-accent-light to-accent-alt-light">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <Heading level={3} className="mb-4 text-2xl md:text-3xl font-bold">
                      {t('token_sale_whitepaper_title')}
                    </Heading>
                    <p className="text-lg text-gray-700 mb-6 max-w-2xl">
                      {t('token_sale_whitepaper_description')}
                    </p>
                    <Button
                      variant="primary"
                      size="large"
                      className="!px-8 !py-3 text-lg font-bold"
                      onClick={() => {
                        logDownloadWhitepaperAction();
                        window.open('https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf', '_blank');
                      }}
                    >
                      {t('token_sale_whitepaper')} →
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mb-12">
              <Card className="p-6">
                <Heading level={3} className="mb-4 text-xl">
                  {t('token_price_history_title')}
                </Heading>
                <div className="bg-gray-50 rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
                  <p className="text-gray-500">
                    {t('token_price_history_placeholder')}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {t('token_price_history_note')}
                </p>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6">
                <Heading level={3} className="mb-4 text-xl">
                  {t('token_legal_framework_title')}
                </Heading>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {t('token_legal_framework_description')}
                  </p>
                  <div className="space-y-2">
                    <Link
                      href="/legal/terms"
                      className="block text-accent hover:underline"
                    >
                      {t('token_legal_terms_link')}
                    </Link>
                    <Link
                      href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      target="_blank"
                      className="block text-accent hover:underline"
                    >
                      {t('token_legal_whitepaper_link')}
                    </Link>
                    <Link
                      href="/dataroom"
                      className="block text-accent hover:underline"
                    >
                      {t('token_legal_dataroom_link')}
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <Heading level={3} className="mb-4 text-xl">
                  {t('token_purchase_guide_title')}
                </Heading>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">1.</span>
                      <div>
                        <p className="font-semibold">{t('token_purchase_step_1_title')}</p>
                        <p className="text-sm text-gray-600">{t('token_purchase_step_1_desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">2.</span>
                      <div>
                        <p className="font-semibold">{t('token_purchase_step_2_title')}</p>
                        <p className="text-sm text-gray-600">{t('token_purchase_step_2_desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">3.</span>
                      <div>
                        <p className="font-semibold">{t('token_purchase_step_3_title')}</p>
                        <p className="text-sm text-gray-600">{t('token_purchase_step_3_desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">4.</span>
                      <div>
                        <p className="font-semibold">{t('token_purchase_step_4_title')}</p>
                        <p className="text-sm text-gray-600">{t('token_purchase_step_4_desc')}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full mt-4"
                    onClick={handleNext}
                  >
                    {t('token_purchase_start_button')}
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="p-6 mb-12">
              <Heading level={3} className="mb-4 text-xl">
                {t('token_secondary_market_title')}
              </Heading>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('token_secondary_market_description')}
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>{t('token_secondary_market_note_title')}:</strong>{' '}
                    {t('token_secondary_market_note')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">{t('token_secondary_market_features_title')}</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>{t('token_secondary_market_feature_1')}</li>
                    <li>{t('token_secondary_market_feature_2')}</li>
                    <li>{t('token_secondary_market_feature_3')}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Ama />
      </main>
    </div>
  );
};

PublicTokenSalePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [listingRes, generalRes, messages] = await Promise.all([
      api
        .get('/listing', {
          params: {
            limit: MAX_LISTINGS_TO_FETCH,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const listings = listingRes?.data.results;
    const generalConfig = generalRes?.data?.results?.value;
    return {
      listings,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      listings: [],
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default PublicTokenSalePage;
