import Head from 'next/head';

import { useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import GenericYoutubeEmbed from '../components/GenericYoutubeEmbed';

import InvestMilestones from '../components/Invest/InvestMilestones';
import InvestProgressCard from '../components/Invest/InvestProgressCard';
import InvestRewards from '../components/Invest/InvestRewards';
import InvestStatsRow from '../components/Invest/InvestStatsRow';
import InvestTrustBar from '../components/Invest/InvestTrustBar';
import Webinar from '../components/Webinar';
import { Heading } from '../components/ui';
import { useBuyTokens } from '../hooks/useBuyTokens';
import { useConfig } from '../hooks/useConfig';
import {
  DEFAULT_TOKEN_STATS,
  FundraisingConfig,
  InvestPageOptions,
  TokenStats,
} from '../types';
import api from '../utils/api';
import { twitterUrlToHandle } from '../utils/app.helpers';
import { getCurrencySymbol } from '../utils/currencyFormat';
import {
  computeMilestoneStates,
  fetchFundraisingBreakdown,
  findActiveMilestone,
  getMilestoneEnd,
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
  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);

  const activeMilestone = useMemo(() => {
    return findActiveMilestone(fundraisingConfig?.milestones);
  }, [fundraisingConfig?.milestones]);

  const milestones = useMemo(
    () => sortMilestonesByStartDate(fundraisingConfig?.milestones ?? []),
    [fundraisingConfig?.milestones],
  );

  const totalGoal = useMemo(
    () => milestones.reduce((sum, m) => sum + getMilestoneGoal(m), 0),
    [milestones],
  );

  const daysLeft = useMemo(() => {
    const DEFAULT_END = '2026-05-31T23:59:59.999Z';
    const endRaw = activeMilestone ? getMilestoneEnd(activeMilestone) : null;
    const endDate = endRaw ? new Date(endRaw) : new Date(DEFAULT_END);
    const diff = endDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [activeMilestone]);

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

  useEffect(() => {
    api
      .get('/token/stats')
      .then((res) => {
        if (res?.data) setTokenStats(res.data);
      })
      .catch(() => {});
  }, []);

  const formatPrice = (tokens: number) => {
    if (!tokenPrice) return '...';
    return `${getCurrencySymbol('EUR')}${Math.round(
      tokens * tokenPrice,
    ).toLocaleString()}`;
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

      <div className="bg-white min-h-screen">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {t('invest_hero_label')}
              </div>

              <Heading
                className="mb-4 text-3xl sm:text-4xl lg:text-[44px] !leading-tight text-gray-900"
                data-testid="page-title"
                level={1}
              >
                {fundraisingConfig?.campaignTitle || t('invest_hero_title')}
              </Heading>

              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                {t('invest_hero_subtitle')}
              </p>

              {fundraisingConfig?.campaignVideo && (
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden">
                  <GenericYoutubeEmbed
                    embedId={fundraisingConfig.campaignVideo}
                  />
                </div>
              )}
            </div>

            <InvestProgressCard
              fundraisingTotal={fundraisingTotal}
              isLoadingFunds={isLoadingFunds}
              activeMilestone={activeMilestone}
              totalGoal={totalGoal}
              tokenHolderCount={tokenStats.tokenHolders}
              daysLeft={daysLeft}
              shareUrl={shareUrl}
              dataroomHref={opts.dataroomHref}
              twitterHandle={twitterHandle}
              t={t}
            />
          </div>
        </section>

        {/* TRUST BAR */}
        <InvestTrustBar t={t} />

        {/* WHAT WE'VE BUILT */}
        <InvestStatsRow t={t} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <hr className="border-gray-100" />
        </div>

        {/* MILESTONES */}
        <InvestMilestones
          milestones={milestones}
          milestoneStates={milestoneStates}
          isLoadingFunds={isLoadingFunds}
          t={t}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <hr className="border-gray-100" />
        </div>

        {/* TESTIMONIALS - uncomment when real testimonials are available
        <InvestTestimonials tokenHolderCount={tokenStats.tokenHolders} t={t} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <hr className="border-gray-100" />
        </div>
        */}

        {/* REWARDS */}
        <InvestRewards
          packages={fundraisingConfig?.packages ?? []}
          formatPrice={formatPrice}
          creditPricePerUnit={
            Number(fundraisingConfig?.creditPricePerUnit) || 30
          }
          loanPackageHref={opts.loanPackageHref ?? '/dataroom'}
          t={t}
        />

        {/* WEBINAR */}
        <Webinar
          tags={['invest-page', 'fundraising']}
          analyticsCategory="Fundraising"
        />
      </div>
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
