import React from 'react';

import { useTranslations } from 'next-intl';

import {
  GovernanceWeightView,
  formatTokenAmount,
  percentOf,
} from '../../../utils/governanceWeight.helpers';
import InfoTooltip from './InfoTooltip';
import { WEIGHT_COLORS } from './weightTheme';

interface ImpactPanelProps {
  view: GovernanceWeightView;
  includeStaked: boolean;
  votingCount: number;
}

const Cell: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="bg-neutral-light p-2.5">
    <div className="mb-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-gray-500">
      {label}
    </div>
    <div className="font-mono text-[15px] font-semibold text-gray-900">
      {children}
    </div>
  </div>
);

const Arrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <span className="mx-1 font-normal text-gray-500">→</span>
    <span style={{ color: WEIGHT_COLORS.staked }}>{children}</span>
  </>
);

const ImpactPanel: React.FC<ImpactPanelProps> = ({
  view,
  includeStaked,
  votingCount,
}) => {
  const t = useTranslations();
  const { withoutStaked, withStaked, stakedHolderCount, stakedSum } =
    view.impact;

  return (
    <div className="mt-3.5 rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="mb-1 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-gray-500">
        {t('governance_weight_impact_title')}
        <span
          className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide ${
            includeStaked
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {includeStaked
            ? t('governance_weight_impact_tag_total')
            : t('governance_weight_impact_tag_balance')}
        </span>
      </h4>
      <p className="text-xs text-gray-500">
        {t('governance_weight_impact_summary', {
          stakedHolders: stakedHolderCount,
          votingCount,
          stakedSum: formatTokenAmount(stakedSum, 2),
        })}
      </p>
      <div className="mt-2 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
        <Cell label={t('governance_weight_impact_voting_weight')}>
          {formatTokenAmount(withoutStaked.total, 0)}
          <Arrow>{formatTokenAmount(withStaked.total, 0)}</Arrow>
        </Cell>
        <Cell label={t('governance_weight_metric_majority_needs')}>
          {withoutStaked.majorityCount}
          <Arrow>{withStaked.majorityCount}</Arrow>{' '}
          <small className="text-sm font-normal text-gray-500">
            {t('governance_weight_wallets_unit')}
          </small>
        </Cell>
        <Cell label={t('governance_weight_metric_top5_share')}>
          {percentOf(withoutStaked.top5Share, withoutStaked.total).toFixed(1)}%
          <Arrow>
            {percentOf(withStaked.top5Share, withStaked.total).toFixed(1)}%
          </Arrow>
        </Cell>
        <Cell
          label={
            <>
              {t('governance_weight_impact_growth_label')}
              <InfoTooltip>
                {t('governance_weight_impact_growth_tooltip', {
                  before: formatTokenAmount(withoutStaked.total, 0),
                  after: formatTokenAmount(withStaked.total, 0),
                  percent: percentOf(stakedSum, withoutStaked.total).toFixed(1),
                })}
              </InfoTooltip>
            </>
          }
        >
          <span style={{ color: WEIGHT_COLORS.staked }}>
            +{percentOf(stakedSum, withoutStaked.total).toFixed(1)}%
          </span>
        </Cell>
      </div>
    </div>
  );
};

export default ImpactPanel;
