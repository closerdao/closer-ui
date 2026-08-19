import React from 'react';

import { useTranslations } from 'next-intl';

import {
  GovernanceWeightView,
  formatTokenAmount,
  percentOf,
} from '../../../utils/governanceWeight.helpers';
import InfoTooltip from './InfoTooltip';

interface MetricsPanelProps {
  view: GovernanceWeightView;
}

const MetricTile: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="bg-white p-3">
    <div className="mb-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-gray-500">
      {label}
    </div>
    <div className="font-mono text-xl font-semibold tracking-tight text-gray-900">
      {value}
    </div>
  </div>
);

const MetricsPanel: React.FC<MetricsPanelProps> = ({ view }) => {
  const t = useTranslations();
  const {
    totalWeight,
    countedRows,
    setAsideCount,
    top5Share,
    majorityCount,
    giniValue,
    apokedro,
  } = view;

  return (
    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-3 lg:grid-cols-6">
      <MetricTile
        label={t('governance_weight_metric_voting_weight')}
        value={formatTokenAmount(totalWeight, 0)}
      />
      <MetricTile
        label={t('governance_weight_metric_voting_addresses')}
        value={countedRows.length}
      />
      <MetricTile
        label={t('governance_weight_metric_set_aside')}
        value={setAsideCount}
      />
      <MetricTile
        label={t('governance_weight_metric_top5_share')}
        value={
          <>
            {percentOf(top5Share, totalWeight).toFixed(1)}
            <small className="text-sm font-normal text-gray-500">%</small>
          </>
        }
      />
      <MetricTile
        label={
          <>
            {t('governance_weight_metric_majority_needs')}
            <InfoTooltip>
              {t('governance_weight_metric_majority_needs_tooltip')}
            </InfoTooltip>
          </>
        }
        value={
          <>
            {majorityCount}
            <small className="text-sm font-normal text-gray-500">
              {' '}
              {t('governance_weight_wallets_unit')}
            </small>
          </>
        }
      />
      <MetricTile
        label={
          <>
            {t('governance_weight_metric_gini')}
            <InfoTooltip>
              {t('governance_weight_metric_gini_tooltip', {
                count: countedRows.length,
              })}
            </InfoTooltip>
          </>
        }
        value={giniValue.toFixed(3)}
      />
      {apokedro && (
        <MetricTile
          label={
            <>
              {t('governance_weight_metric_apokedro')}
              <InfoTooltip>
                {t('governance_weight_metric_apokedro_tooltip')}{' '}
                {apokedro.isApproximated
                  ? t('governance_weight_metric_apokedro_approx_note', {
                      count: countedRows.length,
                      sampleSize: apokedro.sampleSize,
                    })
                  : t('governance_weight_metric_apokedro_exact_note', {
                      sampleSize: apokedro.sampleSize,
                    })}
              </InfoTooltip>
            </>
          }
          value={
            <>
              {apokedro.value.toFixed(3)}
              {apokedro.isApproximated && (
                <small className="text-sm font-normal text-gray-500">
                  {' '}
                  · {t('governance_weight_approx_label')}
                </small>
              )}
            </>
          }
        />
      )}
    </div>
  );
};

export default MetricsPanel;
