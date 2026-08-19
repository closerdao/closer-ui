import React from 'react';

import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion';

interface AdvancedSettingsProps {
  excludedAddressesText: string;
  onExcludedAddressesTextChange: (value: string) => void;
  excludeAllContracts: boolean;
  onExcludeAllContractsChange: (value: boolean) => void;
  excludeBurnAndNull: boolean;
  onExcludeBurnAndNullChange: (value: boolean) => void;
  extraAddressesText: string;
  onExtraAddressesTextChange: (value: string) => void;
  rpcUrl: string;
  onRpcUrlChange: (value: string) => void;
  reverifyOnChain: boolean;
  onReverifyOnChainChange: (value: boolean) => void;
  diagnosticsLog: string[];
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  excludedAddressesText,
  onExcludedAddressesTextChange,
  excludeAllContracts,
  onExcludeAllContractsChange,
  excludeBurnAndNull,
  onExcludeBurnAndNullChange,
  extraAddressesText,
  onExtraAddressesTextChange,
  rpcUrl,
  onRpcUrlChange,
  reverifyOnChain,
  onReverifyOnChainChange,
  diagnosticsLog,
}) => {
  const t = useTranslations();

  return (
    <Accordion type="multiple" className="mt-4 space-y-2.5">
      <AccordionItem value="exclusions">
        <AccordionTrigger className="px-3.5 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-gray-500 no-underline hover:no-underline">
          {t('governance_weight_exclusion_register_title')}
        </AccordionTrigger>
        <AccordionContent className="px-3.5 pb-3.5 pt-0 font-normal normal-case">
          <p className="mb-2.5 max-w-[74ch] text-[12.5px] text-gray-500">
            {t('governance_weight_exclusion_register_body')}
          </p>
          <textarea
            value={excludedAddressesText}
            onChange={(event) =>
              onExcludedAddressesTextChange(event.target.value)
            }
            placeholder="0x… one per line"
            className="min-h-[66px] w-full rounded-lg border border-gray-200 bg-neutral-light p-2.5 font-mono text-xs text-gray-900"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-500">
              <input
                type="checkbox"
                checked={excludeAllContracts}
                onChange={(event) =>
                  onExcludeAllContractsChange(event.target.checked)
                }
                className="accent-accent"
              />
              {t('governance_weight_exclude_contracts_toggle')}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-500">
              <input
                type="checkbox"
                checked={excludeBurnAndNull}
                onChange={(event) =>
                  onExcludeBurnAndNullChange(event.target.checked)
                }
                className="accent-accent"
              />
              {t('governance_weight_exclude_burn_toggle')}
            </label>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="extra">
        <AccordionTrigger className="px-3.5 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-gray-500 no-underline hover:no-underline">
          {t('governance_weight_extra_addresses_title')}
        </AccordionTrigger>
        <AccordionContent className="px-3.5 pb-3.5 pt-0 font-normal normal-case">
          <p className="mb-2.5 max-w-[74ch] text-[12.5px] text-gray-500">
            {t('governance_weight_extra_addresses_body')}
          </p>
          <textarea
            value={extraAddressesText}
            onChange={(event) => onExtraAddressesTextChange(event.target.value)}
            placeholder="0x… one per line"
            className="min-h-[66px] w-full rounded-lg border border-gray-200 bg-neutral-light p-2.5 font-mono text-xs text-gray-900"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={rpcUrl}
              onChange={(event) => onRpcUrlChange(event.target.value)}
              aria-label={t('governance_weight_rpc_endpoint_label')}
              className="w-[210px] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-[12.5px] text-gray-900"
            />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-500">
              <input
                type="checkbox"
                checked={reverifyOnChain}
                onChange={(event) =>
                  onReverifyOnChainChange(event.target.checked)
                }
                className="accent-accent"
              />
              {t('governance_weight_reverify_toggle')}
            </label>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="diagnostics">
        <AccordionTrigger className="px-3.5 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-gray-500 no-underline hover:no-underline">
          {t('governance_weight_diagnostics_title')}
        </AccordionTrigger>
        <AccordionContent className="px-3.5 pb-3.5 pt-0 font-normal normal-case">
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-gray-500">
            {diagnosticsLog.length
              ? diagnosticsLog.join('\n')
              : t('governance_weight_diagnostics_idle')}
          </pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AdvancedSettings;
