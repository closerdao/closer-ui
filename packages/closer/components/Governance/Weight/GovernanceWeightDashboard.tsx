import React, { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../../config_blockchain';
import { useGovernanceWeightRegistry } from '../../../hooks/useGovernanceWeightRegistry';
import { GovernanceWeightControls } from '../../../types/governanceWeight';
import {
  buildGovernanceWeightCsv,
  buildHolderConcentrationSegments,
  computeGovernanceWeightView,
  parseAddressList,
} from '../../../utils/governanceWeight.helpers';
import AdvancedSettings from './AdvancedSettings';
import AiAssistantCallout from './AiAssistantCallout';
import AssumptionsPanel from './AssumptionsPanel';
import CompositionChart from './CompositionChart';
import ConcentrationChart from './ConcentrationChart';
import ControlsBar from './ControlsBar';
import HolderTable from './HolderTable';
import ImpactPanel from './ImpactPanel';
import MetricsPanel from './MetricsPanel';
import ModeBanner from './ModeBanner';
import SourcesPanel from './SourcesPanel';
import WeightFormula from './WeightFormula';

const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_CITIZEN_NFT } =
  blockchainConfig as Record<string, any>;

const DEFAULT_EXCLUDED_ADDRESSES = [
  '0x5e810b93c51981ecca16e030ea1ce8d8b1deb83b',
  '0x475398eee0e22cb6fe5403ffa294fb10ad989e17',
].join('\n');

const DEFAULT_CONTROLS: GovernanceWeightControls = {
  presenceMultiplier: 1,
  sweatMultiplier: 5,
  includeStaked: true,
  search: '',
  showExcluded: false,
  hideZeroWeight: true,
  excludedAddressesText: DEFAULT_EXCLUDED_ADDRESSES,
  extraAddressesText: '',
  excludeAllContracts: false,
  excludeBurnAndNull: true,
  rpcUrl: BLOCKCHAIN_RPC_URL || 'https://forno.celo.org',
  reverifyOnChain: false,
  sortKey: 'weight',
  sortDirection: -1,
};

const GovernanceWeightDashboard: React.FC = () => {
  const t = useTranslations();
  const { registry, read } = useGovernanceWeightRegistry();
  const [controls, setControls] =
    useState<GovernanceWeightControls>(DEFAULT_CONTROLS);

  const view = useMemo(
    () => computeGovernanceWeightView(registry.holders, controls),
    [registry.holders, controls],
  );

  const hasData = registry.holders.length > 0;
  const isReading = registry.status === 'loading';

  const updateControls = (patch: Partial<GovernanceWeightControls>) =>
    setControls((prev) => ({ ...prev, ...patch }));

  const handleRead = () => {
    read({
      rpcUrl: controls.rpcUrl,
      extraAddresses: parseAddressList(controls.extraAddressesText),
      excludedAddresses: new Set(
        parseAddressList(controls.excludedAddressesText),
      ),
      reverifyOnChain: controls.reverifyOnChain,
    });
  };

  const handleToggleExclude = (address: string) => {
    const current = new Set(parseAddressList(controls.excludedAddressesText));
    if (current.has(address)) current.delete(address);
    else current.add(address);
    updateControls({ excludedAddressesText: [...current].join('\n') });
  };

  const handleSortChange = (key: string) => {
    updateControls({
      sortKey: key,
      sortDirection:
        controls.sortKey === key ? (-controls.sortDirection as 1 | -1) : -1,
    });
  };

  const handleDownloadCsv = () => {
    const csvContent = buildGovernanceWeightCsv(view.displayedRows, {
      presenceMultiplier: String(controls.presenceMultiplier),
      sweatMultiplier: String(controls.sweatMultiplier),
      includeStaked: controls.includeStaked,
      blockNumber: registry.blockNumber,
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tdf-governance-weight-block-${
      registry.blockNumber || 'latest'
    }.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const concentrationSegments = buildHolderConcentrationSegments(
    view.countedRows,
    view.totalWeight,
  );

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-5">
      <AiAssistantCallout />

      <header className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-gray-900 pb-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-widest text-gray-500">
            {t('governance_weight_eyebrow')}
          </p>
          <h1 className="m-0 max-w-[20ch] text-3xl font-extrabold leading-[1.02] tracking-tight text-gray-900 sm:text-4xl">
            {t('governance_weight_headline')}
          </h1>
          <p className="mt-3.5 max-w-[66ch] text-[14.5px] text-gray-500">
            {t('governance_weight_standfirst')}
          </p>
        </div>
      </header>

      <ModeBanner
        includeStaked={controls.includeStaked}
        onIncludeStakedChange={(value) =>
          updateControls({ includeStaked: value })
        }
        hasData={hasData}
        stakedSum={view.impact.stakedSum}
        stakedHolderCount={view.impact.stakedHolderCount}
      />

      <WeightFormula
        includeStaked={controls.includeStaked}
        presenceMultiplier={controls.presenceMultiplier}
        sweatMultiplier={controls.sweatMultiplier}
        onPresenceMultiplierChange={(value) =>
          updateControls({ presenceMultiplier: value })
        }
        onSweatMultiplierChange={(value) =>
          updateControls({ sweatMultiplier: value })
        }
      />

      {hasData && (
        <ImpactPanel
          view={view}
          includeStaked={controls.includeStaked}
          votingCount={view.votingRows.length}
        />
      )}

      {hasData && (
        <AssumptionsPanel
          view={view}
          membershipTotalSupply={registry.membershipTotalSupply}
          membershipAddress={BLOCKCHAIN_CITIZEN_NFT?.address || ''}
          presenceMultiplier={controls.presenceMultiplier}
        />
      )}

      <ControlsBar
        isReading={isReading}
        onRead={handleRead}
        onDownloadCsv={handleDownloadCsv}
        isCsvEnabled={hasData}
        search={controls.search}
        onSearchChange={(value) => updateControls({ search: value })}
        showExcluded={controls.showExcluded}
        onShowExcludedChange={(value) =>
          updateControls({ showExcluded: value })
        }
        hideZeroWeight={controls.hideZeroWeight}
        onHideZeroWeightChange={(value) =>
          updateControls({ hideZeroWeight: value })
        }
      />

      {registry.warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 border-l-[3px] border-l-yellow-600 bg-white p-3 text-[12.5px] text-gray-500">
          {registry.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      {registry.status === 'error' && registry.errorMessage && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-[12.5px] text-red-800">
          {registry.errorMessage}
        </div>
      )}

      <AdvancedSettings
        excludedAddressesText={controls.excludedAddressesText}
        onExcludedAddressesTextChange={(value) =>
          updateControls({ excludedAddressesText: value })
        }
        excludeAllContracts={controls.excludeAllContracts}
        onExcludeAllContractsChange={(value) =>
          updateControls({ excludeAllContracts: value })
        }
        excludeBurnAndNull={controls.excludeBurnAndNull}
        onExcludeBurnAndNullChange={(value) =>
          updateControls({ excludeBurnAndNull: value })
        }
        extraAddressesText={controls.extraAddressesText}
        onExtraAddressesTextChange={(value) =>
          updateControls({ extraAddressesText: value })
        }
        rpcUrl={controls.rpcUrl}
        onRpcUrlChange={(value) => updateControls({ rpcUrl: value })}
        reverifyOnChain={controls.reverifyOnChain}
        onReverifyOnChainChange={(value) =>
          updateControls({ reverifyOnChain: value })
        }
        diagnosticsLog={registry.diagnosticsLog}
      />

      <SourcesPanel
        tokenSources={registry.tokenSources}
        votingCounts={view.tokenVotingCounts}
      />

      {hasData && <MetricsPanel view={view} />}

      {hasData && view.totalWeight > 0n && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-gray-500">
              {t('governance_weight_chart_concentration_title')}
            </div>
            <ConcentrationChart
              segments={concentrationSegments}
              majorityCount={view.majorityCount}
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-gray-500">
              {t('governance_weight_chart_composition_title')}
            </div>
            <CompositionChart
              totalTdf={
                view.totalTdfLiquid +
                (controls.includeStaked ? view.totalStaked : 0n)
              }
              totalPresence={view.totalPresenceWeighted}
              totalSweat={view.totalSweatWeighted}
              totalWeight={view.totalWeight}
              includeStaked={controls.includeStaked}
              presenceMultiplier={controls.presenceMultiplier}
              sweatMultiplier={controls.sweatMultiplier}
            />
          </div>
        </div>
      )}

      {hasData ? (
        <HolderTable
          rows={view.displayedRows}
          totalWeight={view.totalWeight}
          includeStaked={controls.includeStaked}
          sortKey={controls.sortKey}
          sortDirection={controls.sortDirection}
          onSortChange={handleSortChange}
          onToggleExclude={handleToggleExclude}
        />
      ) : (
        <div className="mt-5 rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
          <h4 className="mb-1.5 text-[15px] font-semibold text-gray-900">
            {isReading
              ? registry.progressLabel ||
                t('governance_weight_table_loading_title')
              : t('governance_weight_table_idle_title')}
          </h4>
          <p className="mx-auto max-w-[58ch] text-[13px]">
            {t('governance_weight_table_idle_body')}
          </p>
        </div>
      )}

      <footer className="mt-6 flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-3.5 font-mono text-[10.5px] text-gray-500">
        <span>
          {registry.blockNumber != null
            ? t('governance_weight_footer_block', {
                block: registry.blockNumber,
              })
            : t('governance_weight_footer_block_empty')}
        </span>
        <span>{t('governance_weight_footer_source')}</span>
      </footer>
    </div>
  );
};

export default GovernanceWeightDashboard;
