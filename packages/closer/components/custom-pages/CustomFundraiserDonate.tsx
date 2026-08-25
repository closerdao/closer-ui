import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import InvestProgressCard from '../Invest/InvestProgressCard';
import { useConfig } from '../../hooks/useConfig';
import { FundraisingConfig } from '../../types';
import { twitterUrlToHandle } from '../../utils/app.helpers';
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

interface Props {
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

const CustomFundraiserProgress: React.FC<Props> = () => {
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

  return (
    <section className="py-10 md:py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
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
      </div>
    </section>
  );
};

export default CustomFundraiserProgress;
