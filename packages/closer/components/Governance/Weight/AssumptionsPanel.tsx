import React from 'react';

import { useTranslations } from 'next-intl';

import { GovernanceWeightView } from '../../../utils/governanceWeight.helpers';
import { CELO_EXPLORER_BASE_URL } from '../../../utils/governanceWeightRpc';

interface AssumptionsPanelProps {
  view: GovernanceWeightView;
  membershipTotalSupply: number | null;
  membershipAddress: string;
  presenceMultiplier: number;
}

const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  view,
  membershipTotalSupply,
  membershipAddress,
  presenceMultiplier,
}) => {
  const t = useTranslations();
  const {
    nonMemberVotingCount,
    presenceWithZeroTdfCount,
    stakedWithZeroPresenceCount,
  } = view.assumptions;
  const votingCount = view.votingRows.length;

  return (
    <div className="mt-3.5 rounded-lg border border-gray-200 border-l-4 border-l-yellow-600 bg-white p-4">
      <h4 className="mb-2 text-sm font-bold text-gray-900">
        {t('governance_weight_assumptions_title')}
      </h4>
      <p className="max-w-[82ch] text-[12.5px] leading-relaxed text-gray-900">
        {t('governance_weight_assumptions_intro_1')}{' '}
        <em>{t('governance_weight_assumptions_intro_quote')}</em>{' '}
        {t('governance_weight_assumptions_intro_2')}{' '}
        <a
          href={`${CELO_EXPLORER_BASE_URL}/token/${membershipAddress}?tab=holders`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          <b>{t('governance_weight_membersheep_name')}</b>
        </a>{' '}
        {t('governance_weight_assumptions_intro_3')}
      </p>

      <ul className="mt-2.5 max-w-[82ch] list-disc space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-gray-900">
        {membershipTotalSupply != null && (
          <li>
            {t('governance_weight_assumptions_bullet_reconciliation', {
              total: membershipTotalSupply,
            })}
          </li>
        )}
        <li>
          {t('governance_weight_assumptions_bullet_non_member', {
            count: nonMemberVotingCount,
            total: votingCount,
          })}
        </li>
        {presenceWithZeroTdfCount > 0 && (
          <li>
            {t('governance_weight_assumptions_bullet_presence_no_tdf', {
              count: presenceWithZeroTdfCount,
            })}
          </li>
        )}
        {stakedWithZeroPresenceCount > 0 && (
          <li>
            {t('governance_weight_assumptions_bullet_staked_no_presence', {
              count: stakedWithZeroPresenceCount,
            })}
          </li>
        )}
        <li>
          {t('governance_weight_assumptions_bullet_whitepaper_multiplier', {
            multiplier: presenceMultiplier,
          })}
        </li>
      </ul>
    </div>
  );
};

export default AssumptionsPanel;
