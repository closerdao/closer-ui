import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';
import {
  FacebookShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from 'react-share';

import GenericYoutubeEmbed from '../components/GenericYoutubeEmbed';
import Webinar from '../components/Webinar';
import { Heading, LinkButton } from '../components/ui';

import {
  Building2,
  Check,
  CheckCircle2,
  TreePine,
  Users,
  Waves,
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useBuyTokens } from '../hooks/useBuyTokens';
import { useConfig } from '../hooks/useConfig';
import {
  FundraisingConfig,
  FundraisingPackage,
  InvestPageOptions,
  MilestoneStatus,
} from '../types';
import api from '../utils/api';
import { twitterUrlToHandle } from '../utils/app.helpers';
import {
  computeMilestoneStates,
  fetchFundraisingBreakdown,
  findActiveMilestone,
  getMilestoneGoal,
  sortMilestonesByStartDate,
} from '../utils/fundraising.helpers';
import { loadLocaleData } from '../utils/locale.helpers';
import PageNotFound from './not-found';

export interface InvestPageProps {
  fundraisingConfig: FundraisingConfig;
  investPageOptions?: InvestPageOptions;
  messages?: unknown;
}

interface MilestoneState {
  status: MilestoneStatus;
  raised: number;
  progress: number;
  urgency?: boolean;
}

const formatDisplayAmount = (amount: number, currency: string): string => {
  const symbol = currency === 'EUR' ? '€' : currency;
  if (amount >= 1000) return `${symbol}${Math.round(amount / 1000)}K`;
  return `${symbol}${amount.toLocaleString()}`;
};

interface PackageCardProps {
  pkg: FundraisingPackage;
  formatPrice: (tokens: number) => string;
  creditPricePerUnit: number;
  loanPackageHref: string;
  t: (key: string) => string;
}

const PackageCard = ({
  pkg,
  formatPrice,
  creditPricePerUnit,
  loanPackageHref,
  t,
}: PackageCardProps) => {
  const isTokens = pkg.type === 'tokens';
  const isLoan = pkg.type === 'loan';
  const isCredits = pkg.type === 'credits';
  const isSubscribe = pkg.type === 'subscribe';
  const tokens = Number(pkg.tokens) || 0;
  const credits = Number(pkg.credits) || 0;
  const isPopular = isTokens && tokens === 30;

  const priceLabel = isTokens
    ? formatPrice(tokens)
    : isLoan
    ? pkg.minAmount
      ? `€${pkg.minAmount}+`
      : '€50K+'
    : isCredits && credits
    ? `€${(credits * creditPricePerUnit).toLocaleString()}`
    : '';

  const defaultHref = isTokens
    ? `/token/checkout?tokens=${tokens}`
    : isLoan
    ? loanPackageHref
    : isCredits && credits
    ? `/credits/checkout?amount=${credits}`
    : isSubscribe
    ? pkg.subscribeUrl || '/subscriptions/checkout'
    : '#';
  const href =
    pkg.ctaUrl && pkg.ctaUrl.trim() !== '' ? pkg.ctaUrl : defaultHref;

  const buttonLabel = isLoan
    ? t('invest_package_lender_cta_action')
    : isSubscribe
    ? t('invest_way_subscribe_cta')
    : t('invest_package_cta_action');

  return (
    <div
      className={`rounded-lg border bg-white transition-colors ${
        isPopular
          ? 'border-gray-900 p-4'
          : 'border-gray-200 p-3 hover:border-gray-300'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="font-medium text-gray-900 text-sm">{pkg.title}</h3>
        {priceLabel && (
          <span className="text-sm font-semibold text-gray-900 shrink-0">
            {priceLabel}
          </span>
        )}
      </div>
      {pkg.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {pkg.description}
        </p>
      )}
      <LinkButton
        href={href}
        target={
          isLoan || (pkg.ctaUrl && href.startsWith('http'))
            ? '_blank'
            : undefined
        }
        variant={isPopular ? 'primary' : 'secondary'}
        size="small"
        className="w-full"
      >
        {buttonLabel}
      </LinkButton>
    </div>
  );
};

const getDefaultInvestPageOptions = (): InvestPageOptions => {
  const baseUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_URL) ||
    '';
  const investPath = '/invest';
  return {
    canonicalUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}${investPath}` : '',
    shareUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}${investPath}` : '',
    ogImageUrl: '',
    twitterHandle: '',
    dataroomHref: '/dataroom',
    scheduleCallHref: '',
    loanPackageHref: '/dataroom',
  };
};

const InvestPage = ({
  fundraisingConfig,
  investPageOptions: optionsOverride,
}: InvestPageProps) => {
  const t = useTranslations();
  const config = useConfig();
  const defaults = getDefaultInvestPageOptions();
  const opts = { ...defaults, ...optionsOverride };
  const twitterHandle =
    opts.twitterHandle || twitterUrlToHandle(config?.TWITTER_URL);

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(fundraisingConfig?.enabled);

  const { getTotalCostWithoutWallet } = useBuyTokens();
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [fundraisingTotal, setFundraisingTotal] = useState<number>(0);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);

  const activeMilestone = useMemo(() => {
    return findActiveMilestone(fundraisingConfig?.milestones);
  }, [fundraisingConfig?.milestones]);

  const milestones = useMemo(
    () => sortMilestonesByStartDate(fundraisingConfig?.milestones ?? []),
    [fundraisingConfig?.milestones],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const breakdown = await fetchFundraisingBreakdown(fundraisingConfig);
        setFundraisingTotal(breakdown.totalRaised);
      } catch (error) {
        console.error('Error fetching fundraising total:', error);
      } finally {
        setIsLoadingFunds(false);
      }
    };
    load();
  }, [fundraisingConfig]);

  const milestoneStates = useMemo(() => {
    return computeMilestoneStates(milestones, fundraisingTotal);
  }, [milestones, fundraisingTotal]);

  useEffect(() => {
    (async () => {
      try {
        const price = await getTotalCostWithoutWallet('1');
        setTokenPrice(price);
      } catch (error) {
        console.error('Error fetching token price:', error);
        setTokenPrice(250);
      }
    })();
  }, []);

  const formatPrice = (tokens: number) => {
    if (!tokenPrice) return '...';
    return `€${Math.round(tokens * tokenPrice).toLocaleString()}`;
  };

  const shareUrl = opts.shareUrl || '';

  if (!isFundraiserEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>
          {fundraisingConfig?.campaignTitle || t('invest_page_title')}
        </title>
        <meta name="description" content={t('invest_page_description')} />
        {opts.canonicalUrl && <link rel="canonical" href={opts.canonicalUrl} />}
        <meta property="og:type" content="website" />
        {opts.shareUrl && <meta property="og:url" content={opts.shareUrl} />}
        <meta
          property="og:title"
          content={fundraisingConfig?.campaignTitle || t('invest_page_title')}
        />
        <meta
          property="og:description"
          content={t('invest_page_description')}
        />
        {opts.ogImageUrl && (
          <meta property="og:image" content={opts.ogImageUrl} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
        <meta
          name="twitter:title"
          content={fundraisingConfig?.campaignTitle || t('invest_page_title')}
        />
        <meta
          name="twitter:description"
          content={t('invest_page_description')}
        />
        {opts.ogImageUrl && (
          <meta name="twitter:image" content={opts.ogImageUrl} />
        )}
      </Head>

      <section className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="flex-1 lg:w-2/3">
              <div className="mb-12">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-medium">
                  {t('invest_hero_label')}
                </p>
                <Heading
                  className="mb-4 text-3xl md:text-4xl lg:text-5xl text-gray-900"
                  data-testid="page-title"
                  display
                  level={1}
                >
                  {fundraisingConfig?.campaignTitle || t('invest_hero_title')}
                </Heading>
                <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
                  {t('invest_hero_subtitle')}
                </p>

                {fundraisingConfig?.campaignVideo && (
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                    <GenericYoutubeEmbed
                      embedId={fundraisingConfig.campaignVideo}
                    />
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('invest_story_title')}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('invest_story_subtitle')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <TreePine className="w-4 h-4" />
                      {t('invest_built_land_title')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Waves className="w-4 h-4" />
                      {t('invest_built_water_title')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {t('invest_built_infra_title')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {t('invest_built_community_title')}
                    </span>
                  </div>
                </div>

                {milestones.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      {t('invest_roadmap_title')}
                    </h2>
                    <div className="space-y-3">
                      {milestones.map((milestone, index) => {
                        const state = milestoneStates[milestone.id] || {
                          status: 'pending' as MilestoneStatus,
                          raised: 0,
                          progress: 0,
                        };
                        const isCompleted = state.status === 'completed';
                        const isActive = state.status === 'active';
                        const title = milestone.title || milestone.name;
                        const description = milestone.description || '';
                        const itemLines = milestone.items
                          ? milestone.items.split('\n').filter(Boolean)
                          : [];
                        const displayAmount = formatDisplayAmount(
                          getMilestoneGoal(milestone),
                          milestone.currency || 'EUR',
                        );

                        const getBadgeLabel = () => {
                          if (isCompleted) return t('invest_phase_completed');
                          if (isActive) return t('invest_phase_current');
                          const activeIndex = milestones.findIndex(
                            (m) => milestoneStates[m.id]?.status === 'active',
                          );
                          if (index === activeIndex + 1)
                            return t('invest_phase_next');
                          return t('invest_phase_future');
                        };

                        const formatAmount = (amount: number) => {
                          if (amount >= 1000)
                            return `€${Math.round(amount / 1000)}K`;
                          return `€${amount.toLocaleString()}`;
                        };

                        return (
                          <div
                            key={milestone.id}
                            className={`p-4 rounded-lg transition-all duration-500 relative overflow-hidden ${
                              isCompleted
                                ? 'border-2 border-green-500 bg-green-50'
                                : isActive
                                ? 'border border-gray-900 bg-gray-50'
                                : 'border border-gray-200'
                            }`}
                          >
                            {isCompleted && (
                              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8">
                                <div className="absolute transform rotate-45 bg-green-500 text-white text-xs font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-sm">
                                  {t('invest_phase_completed')}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <span className="bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {getBadgeLabel()}
                                  </span>
                                ) : isActive ? (
                                  <span className="bg-gray-900 text-white text-xs font-medium px-2 py-0.5 rounded animate-pulse">
                                    {getBadgeLabel()}
                                  </span>
                                ) : (
                                  <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                                    {getBadgeLabel()}
                                  </span>
                                )}
                                <span
                                  className={`font-medium ${
                                    isCompleted
                                      ? 'text-green-800'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {title}
                                </span>
                              </div>
                              <span
                                className={`font-semibold ${
                                  isCompleted
                                    ? 'text-green-600 line-through'
                                    : isActive
                                    ? 'text-gray-900'
                                    : 'text-gray-500'
                                }`}
                              >
                                {displayAmount}
                              </span>
                            </div>

                            {description && (
                              <p
                                className={`text-sm mb-2 ${
                                  isCompleted
                                    ? 'text-green-700'
                                    : isActive
                                    ? 'text-gray-600'
                                    : 'text-gray-500'
                                }`}
                              >
                                {description}
                              </p>
                            )}

                            {isActive && !isLoadingFunds && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">
                                    {formatAmount(state.raised)}{' '}
                                    {t('invest_progress_raised')}
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {formatAmount(getMilestoneGoal(milestone))}{' '}
                                    {t('invest_progress_goal')}
                                  </span>
                                </div>
                                <div className="w-full rounded-full bg-gray-200 overflow-hidden h-2">
                                  <div
                                    className="bg-accent h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${state.progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {Math.round(state.progress)}%{' '}
                                  {t('invest_progress_funded')}
                                </p>
                              </div>
                            )}

                            {itemLines.length > 0 && (
                              <div
                                className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${
                                  isCompleted
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                                }`}
                              >
                                {itemLines.map((line, i) => (
                                  <span
                                    key={i}
                                    className={
                                      isCompleted
                                        ? 'flex items-center gap-1'
                                        : ''
                                    }
                                  >
                                    {isCompleted && (
                                      <Check className="w-3 h-3 flex-shrink-0" />
                                    )}
                                    {line}
                                  </span>
                                ))}
                              </div>
                            )}

                            {state.urgency && (
                              <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200">
                                <p className="text-xs font-medium text-amber-800">
                                  {t('invest_phase_urgency')}
                                </p>
                              </div>
                            )}

                            {milestone.ctaUrl &&
                              milestone.ctaUrl.trim() !== '' && (
                                <div className="mt-3">
                                  <LinkButton
                                    href={milestone.ctaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="secondary"
                                    size="small"
                                  >
                                    {t('invest_milestone_cta')}
                                  </LinkButton>
                                </div>
                              )}

                            {isCompleted && (
                              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-1/3 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                  {t('invest_packages_label')}
                </p>

                {(fundraisingConfig?.packages ?? []).map(
                  (pkg: FundraisingPackage, idx: number) => (
                    <PackageCard
                      key={`${pkg.type}-${idx}`}
                      pkg={pkg}
                      formatPrice={formatPrice}
                      creditPricePerUnit={
                        Number(fundraisingConfig?.creditPricePerUnit) || 30
                      }
                      loanPackageHref={opts.loanPackageHref ?? '/dataroom'}
                      t={t}
                    />
                  ),
                )}

                {shareUrl && (
                  <div className="p-4 bg-gradient-to-r from-accent/5 via-purple-50 to-pink-50 rounded-xl border border-accent/20">
                    <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                      {t('invest_share_title')}
                    </p>
                    <div className="flex justify-center gap-3">
                      <FacebookShareButton url={shareUrl}>
                        <div className="w-10 h-10 rounded-full border-2 border-blue-400 hover:border-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all duration-200 hover:scale-110">
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                      </FacebookShareButton>
                      <TwitterShareButton
                        title={t('invest_share_text')}
                        url={shareUrl}
                        related={opts.twitterHandle ? [opts.twitterHandle] : []}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-gray-400 hover:border-gray-800 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110">
                          <svg
                            className="w-5 h-5 text-gray-700"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </div>
                      </TwitterShareButton>
                      <WhatsappShareButton
                        title={t('invest_share_text')}
                        url={shareUrl}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-green-400 hover:border-green-600 hover:bg-green-50 flex items-center justify-center transition-all duration-200 hover:scale-110">
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </div>
                      </WhatsappShareButton>
                      <TelegramShareButton
                        title={t('invest_share_text')}
                        url={shareUrl}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-sky-400 hover:border-sky-600 hover:bg-sky-50 flex items-center justify-center transition-all duration-200 hover:scale-110">
                          <svg
                            className="w-5 h-5 text-sky-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                          </svg>
                        </div>
                      </TelegramShareButton>
                      <LinkedinShareButton
                        title={t('invest_share_text')}
                        url={shareUrl}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-blue-600 hover:border-blue-800 hover:bg-blue-50 flex items-center justify-center transition-all duration-200 hover:scale-110">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </div>
                      </LinkedinShareButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Webinar
          tags={['invest-page', 'fundraising']}
          analyticsCategory="Fundraising"
        />

        <div className="py-6 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm text-gray-500 mb-3">{t('invest_cta_desc')}</p>
            <div className="flex flex-wrap gap-6 justify-center">
              {opts.dataroomHref && (
                <Link
                  href={opts.dataroomHref}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  {t('invest_cta_dataroom')}
                </Link>
              )}
              {opts.scheduleCallHref && (
                <Link
                  href={opts.scheduleCallHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  {t('invest_cta_schedule_call')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export async function getInvestPageInitialProps(context: NextPageContext) {
  try {
    const [fundraiserRes, messages] = await Promise.all([
      api.get('/config/fundraiser').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const fundraisingConfig = fundraiserRes?.data?.results?.value;

    return {
      fundraisingConfig: fundraisingConfig ?? {},
      messages,
    };
  } catch (err) {
    return {
      fundraisingConfig: {},
      error: err,
    };
  }
}

InvestPage.getInitialProps = getInvestPageInitialProps;

export default InvestPage;
