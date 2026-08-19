import React from 'react';

import { useTranslations } from 'next-intl';

import {
  GovernanceTokenKey,
  GovernanceTokenSource,
} from '../../../types/governanceWeight';
import { formatTokenAmount } from '../../../utils/governanceWeight.helpers';
import { CELO_EXPLORER_BASE_URL } from '../../../utils/governanceWeightRpc';

interface SourcesPanelProps {
  tokenSources: Record<GovernanceTokenKey, GovernanceTokenSource> | null;
  votingCounts: Record<GovernanceTokenKey, number>;
}

const BORDER_BY_KEY: Record<GovernanceTokenKey, string> = {
  tdf: 'border-l-gray-900',
  presence: 'border-l-[#4E7F6E]',
  sweat: 'border-l-[#B79A18]',
};

const SourcesPanel: React.FC<SourcesPanelProps> = ({
  tokenSources,
  votingCounts,
}) => {
  const t = useTranslations();
  if (!tokenSources) return null;

  const entries = Object.values(tokenSources);

  return (
    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((source) => {
        let pill: React.ReactNode = null;
        if (source.error) {
          pill = (
            <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-red-600">
              {source.error}
            </span>
          );
        } else if (source.totalSupply === 0n) {
          pill = (
            <span className="ml-1.5 rounded bg-yellow-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-yellow-700">
              {t('governance_weight_source_pill_zero_supply')}
            </span>
          );
        } else if (source.isIndexed === false) {
          pill = (
            <span className="ml-1.5 rounded bg-yellow-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-yellow-700">
              {t('governance_weight_source_pill_not_indexed')}
            </span>
          );
        } else if (source.symbol) {
          pill = (
            <span className="ml-1.5 rounded bg-accent-light px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-accent">
              {t('governance_weight_source_pill_erc20')}
            </span>
          );
        }

        return (
          <div
            key={source.key}
            className={`rounded-lg border border-gray-200 border-l-[3px] bg-white p-3 ${
              BORDER_BY_KEY[source.key]
            }`}
          >
            <h3 className="mb-0.5 text-[13px] font-semibold text-gray-900">
              {source.symbol ? `${source.symbol} · ` : ''}
              {source.name || source.label}
              {pill}
            </h3>
            <div className="break-all font-mono text-[10.5px] text-gray-500">
              <a
                href={`${CELO_EXPLORER_BASE_URL}/address/${source.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {source.address}
              </a>
            </div>
            <div className="mt-1.5 flex justify-between gap-2 font-mono text-[11px] text-gray-500">
              <span>{t('governance_weight_source_total_supply')}</span>
              <b className="text-gray-900">
                {source.totalSupply != null
                  ? formatTokenAmount(source.totalSupply, 2)
                  : '—'}
              </b>
            </div>
            <div className="mt-0.5 flex justify-between gap-2 font-mono text-[11px] text-gray-500">
              <span>{t('governance_weight_source_holders_on_chain')}</span>
              <b className="text-gray-900">{source.holderCount ?? '—'}</b>
            </div>
            <div className="mt-0.5 flex justify-between gap-2 font-mono text-[11px] text-gray-500">
              <span>{t('governance_weight_source_counted_as_voting')}</span>
              <b className="text-gray-900">{votingCounts[source.key] ?? '—'}</b>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SourcesPanel;
