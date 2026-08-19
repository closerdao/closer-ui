import React from 'react';

import { useTranslations } from 'next-intl';

import { formatTokenAmount } from '../../../utils/governanceWeight.helpers';
import InfoTooltip from './InfoTooltip';

interface ModeBannerProps {
  includeStaked: boolean;
  onIncludeStakedChange: (value: boolean) => void;
  hasData: boolean;
  stakedSum: bigint;
  stakedHolderCount: number;
}

const ModeBanner: React.FC<ModeBannerProps> = ({
  includeStaked,
  onIncludeStakedChange,
  hasData,
  stakedSum,
  stakedHolderCount,
}) => {
  const t = useTranslations();

  return (
    <div>
      <div
        className={`mt-5 flex items-start gap-3 rounded-lg border p-3.5 ${
          includeStaked
            ? 'border-accent bg-accent-light text-accent-dark'
            : 'border-red-300 bg-red-50 text-red-800'
        }`}
        role="note"
      >
        <span className="flex-none font-mono text-[15px] font-bold leading-tight">
          {includeStaked ? '✓' : '⚠'}
        </span>
        <div className="space-y-1.5 text-[12.5px] leading-relaxed">
          <p>
            <strong>
              {includeStaked
                ? t('governance_weight_banner_headline_total')
                : hasData
                ? t('governance_weight_banner_headline_balance_data', {
                    staked: formatTokenAmount(stakedSum, 2),
                    holders: stakedHolderCount,
                  })
                : t('governance_weight_banner_headline_balance_empty')}
            </strong>
          </p>
          <p>
            <strong>{t('governance_weight_banner_total_tdf_label')}</strong>{' '}
            {t('governance_weight_banner_total_tdf_body')}{' '}
            <strong>{t('governance_weight_banner_balance_only_label')}</strong>{' '}
            {t('governance_weight_banner_balance_only_body')}
          </p>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-2.5"
        role="group"
        aria-label={t('governance_weight_view_switch_aria_label')}
      >
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-gray-500">
          {t('governance_weight_view_switch_label')}
        </span>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => onIncludeStakedChange(true)}
            className={`flex flex-col items-start gap-0.5 px-3.5 py-2 text-left ${
              includeStaked
                ? 'bg-accent text-white'
                : 'bg-white text-gray-500 hover:bg-neutral'
            }`}
          >
            <b className="text-[12.5px] font-bold">
              {t('governance_weight_view_total_tdf')}
            </b>
            <small className="text-[10px] font-normal opacity-80">
              {t('governance_weight_view_total_tdf_hint')}
            </small>
          </button>
          <button
            type="button"
            onClick={() => onIncludeStakedChange(false)}
            className={`flex flex-col items-start gap-0.5 border-l border-gray-200 px-3.5 py-2 text-left ${
              !includeStaked
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-500 hover:bg-neutral'
            }`}
          >
            <b className="text-[12.5px] font-bold">
              {t('governance_weight_view_balance_only')}
            </b>
            <small className="text-[10px] font-normal opacity-80">
              {t('governance_weight_view_balance_only_hint')}
            </small>
          </button>
        </div>
        <InfoTooltip>{t('governance_weight_view_switch_tooltip')}</InfoTooltip>
      </div>
    </div>
  );
};

export default ModeBanner;
