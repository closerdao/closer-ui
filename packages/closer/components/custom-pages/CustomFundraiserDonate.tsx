import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import GenericYoutubeEmbed from '../GenericYoutubeEmbed';
import InvestProgressCard from '../Invest/InvestProgressCard';
import { Heading } from '../ui';
import { useConfig } from '../../hooks/useConfig';
import { FundraisingConfig } from '../../types';
import { twitterUrlToHandle } from '../../utils/app.helpers';
import { resolveBlockText } from '../../utils/blockI18n';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  fetchFundraisingBreakdown,
  findActiveMilestone,
  findFundingMilestone,
  getMilestoneDaysLeft,
  getMilestoneDisplayRaised,
  getMilestoneGoal,
  sortMilestonesByStartDate,
} from '../../utils/fundraising.helpers';
import { getYoutubeIdFromURL } from '../../utils/learn.helpers';
import { isValidNextImageSrc } from '../../utils/nextImageSrc';
import SafeCustomPageImage from './SafeCustomPageImage';

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    videoEmbedId?: string;
    imageUrl?: string;
  };
}

// The field accepts either a full YouTube URL or a bare 11-character embed id.
const toYoutubeEmbedId = (raw: string) => {
  if (raw.includes('/') || raw.includes('.')) return getYoutubeIdFromURL(raw);
  return raw;
};

const CustomFundraiserDonate: React.FC<Props> = ({ content }) => {
  const t = useTranslations();
  const cachedFundraiserConfig = (getCachedConfig('fundraiser') ??
    {}) as FundraisingConfig;
  const liveFundraiserConfig = useConfig()?.fundraiser as
    | FundraisingConfig
    | undefined;
  const fundraisingConfig = {
    ...cachedFundraiserConfig,
    ...liveFundraiserConfig,
  } as FundraisingConfig;
  const config = useConfig();

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(fundraisingConfig?.enabled);

  const [fundraisingTotal, setFundraisingTotal] = useState<number>(0);
  const [donorCount, setDonorCount] = useState<number>(0);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);

  const milestones = useMemo(
    () => sortMilestonesByStartDate(fundraisingConfig?.milestones ?? []),
    [fundraisingConfig?.milestones],
  );

  const activeMilestone = useMemo(
    () => findActiveMilestone(fundraisingConfig?.milestones),
    [fundraisingConfig?.milestones],
  );

  const daysLeft = useMemo(
    () => getMilestoneDaysLeft(activeMilestone),
    [activeMilestone],
  );

  useEffect(() => {
    if (!isFundraiserEnabled) return;
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
    isFundraiserEnabled,
    fundraisingConfig?.amountRaisedPreCampaign,
    fundraisingConfig?.loansCollectedTotal,
    milestones,
  ]);

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

  if (!isFundraiserEnabled) return null;

  const baseUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_URL) ||
    '';
  const shareUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/fundraiser`
    : '/fundraiser';
  const twitterHandle = twitterUrlToHandle(config?.TWITTER_URL);

  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : '';
  const description = content?.description?.trim()
    ? resolveBlockText(content.description, t)
    : '';
  const videoEmbedId = content?.videoEmbedId?.trim()
    ? toYoutubeEmbedId(content.videoEmbedId.trim())
    : '';
  const imageUrl = content?.imageUrl?.trim() ?? '';
  const showImage = !videoEmbedId && isValidNextImageSrc(imageUrl);
  const hasLeftColumn = Boolean(
    title || description || videoEmbedId || showImage,
  );

  const progressCard = (
    <InvestProgressCard
      raisedAmount={displayRaised}
      goalAmount={displayGoal}
      isLoadingFunds={isLoadingFunds}
      donorCount={donorCount}
      daysLeft={daysLeft}
      shareUrl={shareUrl}
      dataroomHref="/dataroom"
      subscriptionHref="/subscriptions"
      donationHref="/donate"
      twitterHandle={twitterHandle}
      t={t}
    />
  );

  if (!hasLeftColumn) {
    return (
      <section className="py-10 md:py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">{progressCard}</div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
          <div>
            {title ? (
              <Heading
                level={2}
                className="mb-4 text-3xl sm:text-4xl !leading-tight text-gray-900"
              >
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl whitespace-pre-line">
                {description}
              </p>
            ) : null}
            {videoEmbedId ? (
              <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden">
                <GenericYoutubeEmbed embedId={videoEmbedId} />
              </div>
            ) : showImage ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <SafeCustomPageImage
                  src={imageUrl}
                  alt={title || 'Fundraiser'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 640px"
                />
              </div>
            ) : null}
          </div>
          {progressCard}
        </div>
      </div>
    </section>
  );
};

export default CustomFundraiserDonate;
