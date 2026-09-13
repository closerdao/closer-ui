import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import GenericYoutubeEmbed from '../../components/GenericYoutubeEmbed';

import InvestMilestones from '../../components/Invest/InvestMilestones';
import InvestProgressCard from '../../components/Invest/InvestProgressCard';
import InvestRewards from '../../components/Invest/InvestRewards';
import InvestStatsRow from '../../components/Invest/InvestStatsRow';
import InvestTrustBar from '../../components/Invest/InvestTrustBar';
import Webinar from '../../components/Webinar';
import { Heading } from '../../components/ui';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { CreditConfig, FundraisingConfig, InvestPageOptions } from '../../types';
import {
  getCachedConfig,
  getSavedConfig,
} from '../../utils/cachedConfig.helpers';
import { getCreditPricePerUnit } from '../../utils/credits.helpers';
import { twitterUrlToHandle } from '../../utils/app.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import {
  computeMilestoneStates,
  fetchFundraisingBreakdown,
  findActiveMilestone,
  findFundingMilestone,
  getMilestoneDaysLeft,
  getMilestoneDisplayRaised,
  getMilestoneGoal,
  sortMilestonesByStartDate,
} from '../../utils/fundraising.helpers';
import { logMetric } from '../../utils/metrics';
import {
  fetchPageMetaOverride,
  resolvePageMeta,
} from '../../utils/standardPages';
import { resolveBlockText } from '../../utils/blockI18n';
import type { PageMetaOverride } from '../../types/page';
import PageNotFound from '../not-found';
import { NextPageContext } from 'next';

export interface InvestPageProps {
  investPageOptions?: InvestPageOptions;
  messages?: unknown;
  pageMeta?: PageMetaOverride | null;
}

const getDefaultInvestPageOptions = (): InvestPageOptions => {
  const baseUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_URL) ||
    '';
  const fundraiserPath = '/fundraiser';
  return {
    canonicalUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}${fundraiserPath}` : '',
    shareUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}${fundraiserPath}` : '',
    ogImageUrl: '',
    twitterHandle: '',
    dataroomHref: '/dataroom',
    scheduleCallHref: '',
    loanPackageHref: '/dataroom',
    subscriptionHref: '/subscriptions',
    donationHref: '/donate',
  };
};

const FundraiserPage = ({
  investPageOptions: optionsOverride,
  pageMeta,
}: InvestPageProps) => {
  const cachedFundraiserConfig = (getCachedConfig('fundraiser') ??
    {}) as FundraisingConfig;
  const liveFundraiserConfig = useConfig()?.fundraiser as
    | FundraisingConfig
    | undefined;
  const fundraisingConfig = {
    ...cachedFundraiserConfig,
    ...liveFundraiserConfig,
  } as FundraisingConfig;
  const t = useTranslations();
  const router = useRouter();
  const intlLocale = router.locale || undefined;
  const config = useConfig();
  const defaults = getDefaultInvestPageOptions();
  const opts = { ...defaults, ...optionsOverride };
  const twitterHandle =
    opts.twitterHandle || twitterUrlToHandle(config?.TWITTER_URL);

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(fundraisingConfig?.enabled);

  const { getTotalCostWithoutWallet } = useBuyTokens();
  const fundraiserViewLoggedRef = useRef(false);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [fundraisingTotal, setFundraisingTotal] = useState<number>(0);
  const [donorCount, setDonorCount] = useState<number>(0);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);

  const activeMilestone = useMemo(() => {
    return findActiveMilestone(fundraisingConfig?.milestones);
  }, [fundraisingConfig?.milestones]);

  const milestones = useMemo(
    () => sortMilestonesByStartDate(fundraisingConfig?.milestones ?? []),
    [fundraisingConfig?.milestones],
  );

  const daysLeft = useMemo(
    () => getMilestoneDaysLeft(activeMilestone),
    [activeMilestone],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const breakdown = await fetchFundraisingBreakdown({
          amountRaisedPreCampaign: fundraisingConfig?.amountRaisedPreCampaign,
          loansCollectedTotal: fundraisingConfig?.loansCollectedTotal,
          milestones,
        });
        setFundraisingTotal(breakdown.totalRaised);
        setDonorCount(breakdown.donorCount);
      } catch (error) {
        console.error('Error fetching fundraising total:', error);
      } finally {
        setIsLoadingFunds(false);
      }
    };
    load();
  }, [
    fundraisingConfig?.amountRaisedPreCampaign,
    fundraisingConfig?.loansCollectedTotal,
    milestones,
  ]);

  const milestoneStates = useMemo(() => {
    return computeMilestoneStates(milestones, fundraisingTotal);
  }, [milestones, fundraisingTotal]);

  const fundingMilestone = useMemo(
    () => findFundingMilestone(milestones, fundraisingTotal),
    [milestones, fundraisingTotal],
  );

  const displayRaised = useMemo(() => {
    if (!fundingMilestone) return fundraisingTotal;
    return getMilestoneDisplayRaised(
      milestones,
      fundingMilestone,
      fundraisingTotal,
    );
  }, [milestones, fundingMilestone, fundraisingTotal]);

  const displayGoal = useMemo(() => {
    if (!fundingMilestone) return 0;
    return getMilestoneGoal(fundingMilestone);
  }, [fundingMilestone]);

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
    if (!isFundraiserEnabled || fundraiserViewLoggedRef.current) return;
    fundraiserViewLoggedRef.current = true;
    void logMetric({
      event: 'fundraiser-page-viewed',
      category: 'fundraiser',
      value: 'view',
    });
  }, [isFundraiserEnabled]);

  const formatPrice = (tokens: number) => {
    if (!tokenPrice) return '...';
    return formatIsoFiatAmount(Math.round(tokens * tokenPrice), 'EUR', intlLocale);
  };

  const shareUrl = opts.shareUrl || '';
  const pageTitle = fundraisingConfig?.campaignTitle || t('invest_hero_title');
  const meta = resolvePageMeta(pageMeta, {
    title: pageTitle,
    description: t('invest_page_description'),
    ogImage: opts.ogImageUrl || '',
  });
  const title = resolveBlockText(meta.title, t);
  const description = resolveBlockText(meta.description, t);

  if (!isFundraiserEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {opts.canonicalUrl && <link rel="canonical" href={opts.canonicalUrl} />}
        <meta property="og:type" content="website" />
        {opts.shareUrl && <meta property="og:url" content={opts.shareUrl} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {(meta.ogImage || opts.ogImageUrl) && (
          <meta property="og:image" content={meta.ogImage || opts.ogImageUrl} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {(meta.ogImage || opts.ogImageUrl) && (
          <meta
            name="twitter:image"
            content={meta.ogImage || opts.ogImageUrl}
          />
        )}
      </Head>

      <div className="bg-white min-h-screen">
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
                {pageTitle}
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
              raisedAmount={displayRaised}
              goalAmount={displayGoal}
              isLoadingFunds={isLoadingFunds}
              donorCount={donorCount}
              daysLeft={daysLeft}
              shareUrl={shareUrl}
              dataroomHref={opts.dataroomHref}
              subscriptionHref={opts.subscriptionHref}
              donationHref={opts.donationHref}
              twitterHandle={twitterHandle}
              t={t}
            />
          </div>
        </section>

        <InvestTrustBar t={t} />

        <InvestStatsRow t={t} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <hr className="border-gray-100" />
        </div>

        <InvestMilestones
          milestones={milestones}
          milestoneStates={milestoneStates}
          isLoadingFunds={isLoadingFunds}
          t={t}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <hr className="border-gray-100" />
        </div>

        <InvestRewards
          packages={fundraisingConfig?.packages ?? []}
          formatPrice={formatPrice}
          creditPricePerUnit={getCreditPricePerUnit(
            getCachedConfig('credit') as CreditConfig | null,
            fundraisingConfig,
            getSavedConfig('credit'),
          )}
          loanPackageHref={opts.loanPackageHref ?? '/dataroom'}
          t={t}
        />

        <Webinar
          tags={['fundraiser-page', 'fundraising']}
          analyticsCategory="Fundraising"
        />
      </div>
    </>
  );
};

FundraiserPage.getInitialProps = async (_context: NextPageContext) => {
  const pageMeta = await fetchPageMetaOverride('/fundraiser');
  return { pageMeta };
};

export default FundraiserPage;
