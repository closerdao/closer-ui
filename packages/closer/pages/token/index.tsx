import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState } from 'react';

import JoinCommunityCTA from '../../components/JoinCommunityCTA';
import PeekIntoFuture from '../../components/PeekIntoFuture';
import TdfTokenBadge from '../../components/TdfTokenBadge';
import TokenGraph from '../../components/TokenGraph';
import Webinar from '../../components/Webinar';
import { Button, Card, Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH } from '../../constants';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { DEFAULT_TOKEN_STATS, GeneralConfig, Listing, TokenStats } from '../../types';
import api from '../../utils/api';
import { getCurrentUnitPrice } from '../../utils/bondingCurve';
import { getReserveTokenDisplay } from '../../utils/config.utils';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import { SALES_CONFIG } from '../../constants/shared.constants';

const ACCOMMODATION_ICONS = ['van.png', 'camping.png', 'hotel.png'];
const MIN_TOKENS = 1;
const { MAX_TOKENS_PER_TRANSACTION } = SALES_CONFIG;
const MAX_TOKENS = MAX_TOKENS_PER_TRANSACTION;

interface Props {
  listings: Listing[];
  generalConfig: GeneralConfig | null;
}

const PublicTokenSalePage = ({ listings, generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const { getCurrentSupplyWithoutWallet, getSaleHardCapWithoutWallet } = useBuyTokens();
  const reserveToken = getReserveTokenDisplay(defaultConfig);
  const hasComponentRendered = useRef(false);
  const heroRef = useRef<HTMLElement | null>(null);

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const router = useRouter();
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(router.locale || 'en', {
        maximumFractionDigits: 0,
      }),
    [router.locale],
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(router.locale || 'en', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [router.locale],
  );

  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);
  const [isLoadingTokenStats, setIsLoadingTokenStats] = useState(true);
  const [selectedTokens, setSelectedTokens] = useState(10);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [animatedTokenPrice, setAnimatedTokenPrice] = useState(0);
  const [networkTokenPrice, setNetworkTokenPrice] = useState<number | null>(null);
  const [saleHardCap, setSaleHardCap] = useState<number>(18600);
  const [animatedSupplyCurrent, setAnimatedSupplyCurrent] = useState(0);
  const [animatedSupplySold, setAnimatedSupplySold] = useState(0);
  const [animatedSupplyRemaining, setAnimatedSupplyRemaining] = useState(0);
  const [showBuySparkle, setShowBuySparkle] = useState(false);
  const [showMaxAmountWarning, setShowMaxAmountWarning] = useState(false);
  const hasFetchedTokenStats = useRef(false);
  const hasUserAdjustedTokens = useRef(false);

  const trackMetric = async (event: string, point = 0) => {
    try {
      await api.post('/metric', {
        event,
        value: 'token-sale',
        point,
        category: 'engagement',
      });
    } catch (error) {
      console.error(`Error tracking metric "${event}":`, error);
    }
  };

  useEffect(() => {
    if (hasFetchedTokenStats.current) return;
    hasFetchedTokenStats.current = true;

    const fetchTokenStats = async () => {
      setIsLoadingTokenStats(true);
      try {
        const res = await api.get('/token/stats');
        if (res?.data) {
          setTokenStats(res.data);
        }
      } catch (error) {
        console.error('Error fetching token stats:', error);
      } finally {
        setIsLoadingTokenStats(false);
      }
    };

    fetchTokenStats();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [supply, hardCap] = await Promise.all([
          getCurrentSupplyWithoutWallet(),
          getSaleHardCapWithoutWallet(),
        ]);
        if (!cancelled) {
          if (supply && supply > 0) {
            setNetworkTokenPrice(getCurrentUnitPrice(supply));
          }
          if (hardCap && hardCap > 0) {
            setSaleHardCap(hardCap);
          }
        }
      } catch (error) {
        console.error('Error fetching network token price:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getCurrentSupplyWithoutWallet, getSaleHardCapWithoutWallet]);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        await trackMetric('page-view');
      })();
      hasComponentRendered.current = true;
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setShowStickyCta(heroBottom < 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNext = async () => {
    await trackMetric('open-flow', selectedTokens);
    router.push(
      `/token/before-you-begin?tokens=${encodeURIComponent(selectedTokens)}`,
    );
  };

  const logDownloadWhitepaperAction = async () => {
    await trackMetric('download-whitepaper', selectedTokens);
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    'https://www.traditionaldreamfactory.com';
  const canonicalUrl = `${String(baseUrl)
    .replace(/\/$/, '')
    .replace(/^(?!https?:\/\/)/, 'https://')}/token`;
  const tokenPrice = networkTokenPrice;

  const animateNumber = (
    target: number,
    setValue: (value: number) => void,
    durationMs = 1400,
  ) => {
    let animationFrame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(target * eased);
      if (t < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  };

  useEffect(() => {
    if (tokenPrice === null) {
      setAnimatedTokenPrice(0);
      return;
    }
    return animateNumber(tokenPrice, setAnimatedTokenPrice, 1400);
  }, [tokenPrice]);

  useEffect(() => {
    if (isLoadingTokenStats) {
      setAnimatedSupplyCurrent(0);
      setAnimatedSupplySold(0);
      setAnimatedSupplyRemaining(0);
      return;
    }
    const current = Math.max(0, tokenStats.currentSupply || 0);
    const sold = Math.max(0, Math.round(current - saleHardCap * 0.2));
    const remaining = Math.max(0, saleHardCap - current);

    const cleanupCurrent = animateNumber(current, setAnimatedSupplyCurrent, 1400);
    const cleanupSold = animateNumber(sold, setAnimatedSupplySold, 1400);
    const cleanupRemaining = animateNumber(
      remaining,
      setAnimatedSupplyRemaining,
      1400,
    );

    return () => {
      cleanupCurrent();
      cleanupSold();
      cleanupRemaining();
    };
  }, [isLoadingTokenStats, saleHardCap, tokenStats.currentSupply]);

  useEffect(() => {
    const initialSparkleTimeout = window.setTimeout(() => {
      setShowBuySparkle(true);
    }, 4000);
    return () => window.clearTimeout(initialSparkleTimeout);
  }, []);

  useEffect(() => {
    if (!hasUserAdjustedTokens.current) {
      return;
    }
    setShowBuySparkle(false);
    const timeout = window.setTimeout(() => {
      setShowBuySparkle(true);
    }, 1100);
    return () => window.clearTimeout(timeout);
  }, [selectedTokens]);

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

  const handleTokenInputChange = (value: number) => {
    hasUserAdjustedTokens.current = true;
    const attemptedAboveMax = Number.isFinite(value) && value > MAX_TOKENS;
    setShowMaxAmountWarning(attemptedAboveMax);
    const normalized = Number.isFinite(value)
      ? Math.min(MAX_TOKENS, Math.max(MIN_TOKENS, Math.floor(value)))
      : MIN_TOKENS;
    setSelectedTokens(normalized);
    void trackMetric('use-calculator', normalized);
  };

  const incrementTokens = () => {
    handleTokenInputChange(selectedTokens + 1);
  };

  const decrementTokens = () => {
    handleTokenInputChange(selectedTokens - 1);
  };
  const estimatedTotal = tokenPrice !== null
    ? Number((selectedTokens * tokenPrice).toFixed(2))
    : null;

  const BuySparkles = () => {
    if (!showBuySparkle) return null;
    return (
      <span className="absolute inset-0 pointer-events-none" aria-hidden>
        <span
          className="absolute animate-sparkle-float text-[10px] left-1/2 top-0"
          style={{ animationDelay: '0s' }}
        >
          ✦
        </span>
        <span
          className="absolute animate-sparkle-float text-[8px] left-[20%] top-[10%] text-accent"
          style={{ animationDelay: '0.6s' }}
        >
          ✧
        </span>
        <span
          className="absolute animate-sparkle-float text-[9px] left-[75%] top-[5%] text-accent"
          style={{ animationDelay: '1.1s' }}
        >
          ✦
        </span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>{`${t('token_sale_hero_epic_heading')} - ${PLATFORM_NAME}`}</title>
        <meta name="description" content={t('token_sale_hero_epic_subheading')} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:title"
          content={`${t('token_sale_hero_epic_heading')} - ${PLATFORM_NAME}`}
        />
        <meta
          property="og:description"
          content={t('token_sale_hero_epic_subheading')}
        />
        <meta
          property="og:image"
          content="https://cdn.oasa.co/tdf/tdf-invest-og.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${t('token_sale_hero_epic_heading')} - ${PLATFORM_NAME}`}
        />
        <meta
          name="twitter:description"
          content={t('token_sale_hero_epic_subheading')}
        />
        <meta
          name="twitter:image"
          content="https://cdn.oasa.co/tdf/tdf-invest-og.jpg"
        />
      </Head>

      <main className="pt-4 pb-24">
        <section ref={heroRef} className="mb-10">
          <div className="rounded-lg bg-gradient-to-br from-accent-light to-accent-alt-light py-12 md:py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Heading
                level={1}
                display
                className="text-center mb-4 text-4xl md:text-6xl"
              >
                {t('token_sale_hero_epic_heading')}
              </Heading>
              <div className="mb-6 flex justify-center">
                <button
                  type="button"
                  aria-label={t('token_sale_public_sale_buy_token')}
                  className="inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  onClick={() => {
                    void handleNext();
                  }}
                >
                  <TdfTokenBadge />
                </button>
              </div>
              <Heading
                level={2}
                className="text-center px-4 text-xl md:text-2xl max-w-[600px] mx-auto font-normal mb-8"
              >
                {t('token_sale_hero_epic_subheading')}
              </Heading>

              <div className="mb-8 max-w-4xl mx-auto rounded-2xl border border-white/70 bg-white/70 px-4 py-4 md:px-6 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="rounded-xl border border-accent/20 bg-white/90 p-3 text-center">
                    <div className="mb-1 flex items-center justify-center gap-2">
                      <span className="text-2xl md:text-3xl font-bold text-accent">
                        {t('token_total_supply_amount')}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      {t('token_total_supply_title')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-accent/20 bg-white/90 p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                      {isLoadingTokenStats
                        ? '...'
                        : numberFormatter.format(Math.round(animatedSupplyCurrent))}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      {t('token_supply_current')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-accent/20 bg-white/90 p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                      {isLoadingTokenStats
                        ? '...'
                        : numberFormatter.format(Math.round(animatedSupplySold))}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      {t('token_supply_sold')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-accent/20 bg-white/90 p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                      {isLoadingTokenStats
                        ? '...'
                        : numberFormatter.format(Math.round(animatedSupplyRemaining))}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      {t('token_supply_remaining_to_hard_cap')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto mb-6 rounded-xl border border-gray-200 bg-white p-3 md:p-4 shadow-[0_3px_12px_rgba(0,0,0,0.05)]">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center h-10 rounded-md border border-gray-200 bg-white overflow-hidden">
                    <button
                      type="button"
                      aria-label="Decrease token amount"
                      className="px-2 h-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={decrementTokens}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={MIN_TOKENS}
                      max={MAX_TOKENS}
                      value={selectedTokens}
                      onChange={(e) => {
                        handleTokenInputChange(Number(e.target.value));
                      }}
                      className="w-20 h-full bg-transparent text-center text-sm font-semibold font-mono text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Increase token amount"
                      className="px-2 h-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={incrementTokens}
                    >
                      +
                    </button>
                    <div className="px-2.5 h-full flex items-center text-[11px] text-gray-500 border-l border-gray-200 font-mono">
                      {t('token_sale_public_sale_token_symbol')}
                    </div>
                  </div>
                  <div className="px-3 h-10 rounded-md border border-gray-200 bg-white min-w-[200px] flex items-center gap-2">
                    <div className="flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 text-left">
                        1 {t('token_sale_public_sale_token_symbol')} =
                      </p>
                      <p className="font-mono text-accent text-xs sm:text-sm text-left">
                        {tokenPrice !== null
                          ? currencyFormatter.format(animatedTokenPrice)
                          : '...'}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 h-10 rounded-md border border-gray-200 bg-white min-w-[160px] flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 text-left">
                      Est. order
                    </p>
                    <p className="font-mono text-gray-900 text-xs sm:text-sm text-left">
                      {estimatedTotal !== null
                        ? currencyFormatter.format(estimatedTotal)
                        : '...'}
                    </p>
                  </div>
                  <span className="relative inline-flex h-10">
                    <Button
                      className="!h-10 !w-auto whitespace-nowrap !px-4 !py-2"
                      onClick={() => {
                        void handleNext();
                      }}
                      variant="primary"
                    >
                      {t('token_sale_public_sale_buy_token')}
                    </Button>
                    <BuySparkles />
                  </span>
                </div>
                {showMaxAmountWarning && (
                  <p className="mt-2 text-[11px] text-amber-700 text-left sm:text-center">
                    Max {MAX_TOKENS} tokens per purchase. Contact the team for larger allocations.
                  </p>
                )}
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
                        {isLoadingTokenStats ? t('token_supply_loading') : tokenStats.currentSupply.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('token_supply_sold')}</span>
                      <span className="font-semibold">
                        {isLoadingTokenStats
                          ? t('token_supply_loading')
                          : Math.max(
                            0,
                            Math.round(tokenStats.currentSupply - saleHardCap * 0.2),
                          ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('token_supply_remaining_to_hard_cap')}</span>
                      <span className="font-semibold">
                        {isLoadingTokenStats
                          ? t('token_supply_loading')
                          : Math.max(0, saleHardCap - tokenStats.currentSupply).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-700">{t('token_holders_count')}</span>
                      <span className="font-semibold">
                        {isLoadingTokenStats ? t('token_supply_loading') : tokenStats.tokenHolders.toLocaleString()}
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
                      onClick={async () => {
                        await logDownloadWhitepaperAction();
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
              <TokenGraph />
            </div>

            <Card className="mb-12 p-6">
              <Heading level={3} className="mb-4 text-xl">
                {t('token_explorer_title')}
              </Heading>
              <div className="space-y-2">
                <a
                  href="https://celoscan.io/token/0x10cb7f49389787a99b59b2f87dfdd3bba141559f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-accent hover:underline"
                  onClick={() => {
                    void trackMetric('use-calculator', selectedTokens);
                  }}
                >
                  {t('token_explorer_tdf_link')}
                </a>
                <a
                  href="https://celoscan.io/token/tokenholderchart/0x10cb7f49389787a99b59b2f87dfdd3bba141559f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-accent hover:underline"
                  onClick={() => {
                    void trackMetric('use-calculator', selectedTokens);
                  }}
                >
                  {t('token_explorer_holder_chart_link')}
                </a>
                <a
                  href="https://celoscan.io/token/0x5bc8e45e6c0019f12be2979de614af3cc63538e9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-accent hover:underline"
                  onClick={() => {
                    void trackMetric('use-calculator', selectedTokens);
                  }}
                >
                  {t('token_explorer_presence_link')}
                </a>
              </div>
            </Card>

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
                      onClick={() => {
                        void trackMetric('use-calculator', selectedTokens);
                      }}
                    >
                      {t('token_legal_terms_link')}
                    </Link>
                    <Link
                      href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      target="_blank"
                      className="block text-accent hover:underline"
                      onClick={() => {
                        void logDownloadWhitepaperAction();
                      }}
                    >
                      {t('token_legal_whitepaper_link')}
                    </Link>
                    <Link
                      href="/dataroom"
                      className="block text-accent hover:underline"
                      onClick={() => {
                        void trackMetric('use-calculator', selectedTokens);
                      }}
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
                        <p className="text-sm text-gray-600">{t('token_purchase_step_3_desc', { reserveToken })}</p>
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
                    onClick={() => {
                      void handleNext();
                    }}
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

            <JoinCommunityCTA variant="banner" className="mb-12" />
          </div>
        </section>

        <Webinar tags={['token-sale-page']} analyticsCategory="TokenSale" />
      </main>
      {showStickyCta && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
          <div className="bg-white border border-gray-200 shadow-[0_6px_18px_rgba(0,0,0,0.08)] rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="min-w-0 flex items-center gap-2">
              <div className="inline-flex items-center h-9 rounded-md border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  aria-label="Decrease token amount"
                  className="px-2 h-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  onClick={decrementTokens}
                >
                  -
                </button>
                <input
                  type="number"
                  min={MIN_TOKENS}
                  max={MAX_TOKENS}
                  value={selectedTokens}
                  onChange={(e) => {
                    handleTokenInputChange(Number(e.target.value));
                  }}
                  className="w-16 h-full bg-transparent text-center text-xs font-semibold font-mono text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Increase token amount"
                  className="px-2 h-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  onClick={incrementTokens}
                >
                  +
                </button>
                <div className="px-2 h-full flex items-center text-[10px] text-gray-500 border-l border-gray-200 font-mono">
                  {t('token_sale_public_sale_token_symbol')}
                </div>
              </div>
              <p className="text-xs text-accent truncate font-mono">
                {estimatedTotal !== null
                  ? currencyFormatter.format(estimatedTotal)
                  : '...'}
              </p>
            </div>
            <span className="relative inline-flex">
              <Button
                className="!w-auto whitespace-nowrap"
                onClick={() => {
                  void handleNext();
                }}
                variant="primary"
              >
                {t('token_sale_public_sale_buy_token')}
              </Button>
              <BuySparkles />
            </span>
          </div>
          {showMaxAmountWarning && (
            <p className="mt-1 text-[11px] text-amber-700 text-center">
              Max {MAX_TOKENS} tokens per purchase. Contact the team for larger allocations.
            </p>
          )}
        </div>
      )}
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
