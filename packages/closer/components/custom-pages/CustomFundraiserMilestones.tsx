import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import InvestMilestones from '../Invest/InvestMilestones';
import { useConfig } from '../../hooks/useConfig';
import { FundraisingConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  computeMilestoneStates,
  fetchFundraisingBreakdown,
  sortMilestonesByStartDate,
} from '../../utils/fundraising.helpers';

interface Props {
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

const CustomFundraiserMilestones: React.FC<Props> = () => {
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

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(fundraisingConfig?.enabled);

  const [fundraisingTotal, setFundraisingTotal] = useState<number>(0);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);

  const milestones = useMemo(
    () => sortMilestonesByStartDate(fundraisingConfig?.milestones ?? []),
    [fundraisingConfig?.milestones],
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

  const milestoneStates = useMemo(
    () => computeMilestoneStates(milestones, fundraisingTotal),
    [milestones, fundraisingTotal],
  );

  if (!isFundraiserEnabled) return null;

  return (
    <InvestMilestones
      milestones={milestones}
      milestoneStates={milestoneStates}
      isLoadingFunds={isLoadingFunds}
      t={t}
    />
  );
};

export default CustomFundraiserMilestones;
