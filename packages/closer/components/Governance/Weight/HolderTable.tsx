import React from 'react';

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { GovernanceWeightRow } from '../../../types/governanceWeight';
import {
  BURN_ADDRESSES,
  formatTokenAmount,
  percentOf,
  shortenAddress,
} from '../../../utils/governanceWeight.helpers';
import { CELO_EXPLORER_BASE_URL } from '../../../utils/governanceWeightRpc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { WEIGHT_COLORS } from './weightTheme';

interface HolderTableProps {
  rows: GovernanceWeightRow[];
  totalWeight: bigint;
  includeStaked: boolean;
  sortKey: string;
  sortDirection: 1 | -1;
  onSortChange: (key: string) => void;
  onToggleExclude: (address: string) => void;
}

interface ColumnDef {
  key: string;
  labelKey: string;
  sortable: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'tdf', labelKey: 'governance_tdf_balance', sortable: true },
  {
    key: 'staked',
    labelKey: 'governance_weight_column_staked',
    sortable: true,
  },
  { key: 'presence', labelKey: 'governance_presence', sortable: true },
  { key: 'sweat', labelKey: 'governance_sweat', sortable: true },
  {
    key: 'weight',
    labelKey: 'governance_weight_column_weight',
    sortable: true,
  },
];

const HolderTable: React.FC<HolderTableProps> = ({
  rows,
  totalWeight,
  includeStaked,
  sortKey,
  sortDirection,
  onSortChange,
  onToggleExclude,
}) => {
  const t = useTranslations();

  if (!rows.length) {
    return (
      <div className="mt-5 rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
        <h4 className="mb-1.5 text-[15px] font-semibold text-gray-900">
          {t('governance_weight_table_empty_title')}
        </h4>
        <p className="mx-auto max-w-[58ch] text-[13px]">
          {t('governance_weight_table_empty_body')}
        </p>
      </div>
    );
  }

  let rank = 0;

  const sortIndicator = (key: string) => {
    if (sortKey !== key)
      return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDirection < 0 ? (
      <ChevronDown className="h-3 w-3" />
    ) : (
      <ChevronUp className="h-3 w-3" />
    );
  };

  return (
    <div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200">
        <Table className="min-w-[920px] bg-white">
          <TableHeader>
            <TableRow className="bg-neutral-light hover:bg-neutral-light">
              <TableHead className="whitespace-nowrap px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-gray-500">
                #
              </TableHead>
              <TableHead className="whitespace-nowrap px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-gray-500">
                {t('governance_weight_column_address')}
              </TableHead>
              {COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  onClick={() => onSortChange(column.key)}
                  className={`cursor-pointer whitespace-nowrap px-3 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-wider text-gray-500 hover:text-gray-900 ${
                    sortKey === column.key ? 'text-accent' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.key === 'staked'
                      ? `${t('governance_weight_column_staked')} `
                      : t(column.labelKey)}
                    {column.key === 'staked' && (
                      <span
                        className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          includeStaked
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {includeStaked
                          ? t('governance_weight_column_staked_counted')
                          : t('governance_weight_column_staked_excluded')}
                      </span>
                    )}
                    {sortIndicator(column.key)}
                  </span>
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-wider text-gray-500">
                {t('governance_weight_column_share')}
              </TableHead>
              <TableHead className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-wider text-gray-500">
                {t('governance_weight_column_composition')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              if (!row.isExcluded) rank++;
              const denominator = row.weight === 0n ? 1n : row.weight;
              const tdfShare = Number((row.tdf * 10000n) / denominator) / 100;
              const stakedShare = includeStaked
                ? Number((row.staked * 10000n) / denominator) / 100
                : 0;
              const presenceShare =
                Number((row.presenceWeighted * 10000n) / denominator) / 100;
              const sweatShare = Math.max(
                0,
                100 - tdfShare - stakedShare - presenceShare,
              );

              return (
                <TableRow
                  key={row.address}
                  className={row.isExcluded ? 'opacity-50' : ''}
                >
                  <TableCell className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-gray-500">
                    {row.isExcluded ? '—' : rank}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-2 font-mono text-[12.5px]">
                    <a
                      href={`${CELO_EXPLORER_BASE_URL}/address/${row.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-b border-gray-200 text-gray-900 hover:border-accent hover:text-accent"
                    >
                      {shortenAddress(row.address)}
                    </a>
                    {row.tag && (
                      <span className="ml-1.5 rounded bg-accent-light px-1 py-0.5 text-[9.5px] font-semibold normal-case text-accent">
                        {row.tag}
                      </span>
                    )}
                    {row.isContract && (
                      <span className="ml-1.5 rounded bg-neutral px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-gray-500">
                        {t('governance_weight_tag_contract')}
                      </span>
                    )}
                    {BURN_ADDRESSES.has(row.address) && (
                      <span className="ml-1.5 rounded bg-red-50 px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-red-600">
                        {t('governance_weight_tag_burn')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleExclude(row.address)}
                      title={
                        row.isExcluded
                          ? t('governance_weight_restore_row_title')
                          : t('governance_weight_exclude_row_title')
                      }
                      className="ml-1.5 font-bold text-gray-500 hover:text-red-600"
                    >
                      {row.isExcluded ? '↺' : '✕'}
                    </button>
                  </TableCell>
                  <TableCell
                    className={`whitespace-nowrap px-3 py-2 text-right font-mono text-[12.5px] ${
                      row.tdf === 0n ? 'text-gray-300' : ''
                    }`}
                  >
                    {formatTokenAmount(row.tdf, 2)}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap px-3 py-2 text-right font-mono text-[12.5px]"
                    style={{
                      color:
                        row.staked === 0n ? undefined : WEIGHT_COLORS.staked,
                      opacity: row.staked > 0n && !includeStaked ? 0.55 : 1,
                    }}
                  >
                    {formatTokenAmount(row.staked, 2)}
                  </TableCell>
                  <TableCell
                    className={`whitespace-nowrap px-3 py-2 text-right font-mono text-[12.5px] ${
                      row.presence === 0n ? 'text-gray-300' : ''
                    }`}
                  >
                    {formatTokenAmount(row.presence, 2)}
                  </TableCell>
                  <TableCell
                    className={`whitespace-nowrap px-3 py-2 text-right font-mono text-[12.5px] ${
                      row.sweat === 0n ? 'text-gray-300' : ''
                    }`}
                  >
                    {formatTokenAmount(row.sweat, 2)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-2 text-right font-mono text-[13.5px] font-semibold text-accent">
                    {formatTokenAmount(row.weight, 2)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-2 text-right font-mono text-[12.5px]">
                    {row.isExcluded
                      ? '—'
                      : `${percentOf(row.weight, totalWeight).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <div
                      title={t('governance_weight_composition_title', {
                        tdf: tdfShare.toFixed(0),
                        staked: stakedShare.toFixed(0),
                        presence: presenceShare.toFixed(0),
                        sweat: sweatShare.toFixed(0),
                      })}
                      className="ml-auto flex h-4 w-[150px] overflow-hidden rounded-sm bg-neutral"
                    >
                      <span
                        className="block h-full bg-gray-900"
                        style={{ width: `${tdfShare}%` }}
                      />
                      <span
                        className="block h-full"
                        style={{
                          width: `${stakedShare}%`,
                          backgroundColor: WEIGHT_COLORS.staked,
                        }}
                      />
                      <span
                        className="block h-full"
                        style={{
                          width: `${presenceShare}%`,
                          backgroundColor: WEIGHT_COLORS.presence,
                        }}
                      />
                      <span
                        className="block h-full"
                        style={{
                          width: `${sweatShare}%`,
                          backgroundColor: WEIGHT_COLORS.sweat,
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-3.5 px-0.5 font-mono text-[10.5px] text-gray-500">
        <span>
          <i className="mr-1 inline-block h-[9px] w-[9px] rounded-sm bg-gray-900 align-[-1px]" />
          {t('governance_tdf_balance')}
        </span>
        <span>
          <i
            className="mr-1 inline-block h-[9px] w-[9px] rounded-sm align-[-1px]"
            style={{ backgroundColor: WEIGHT_COLORS.staked }}
          />
          {t('governance_weight_legend_staked')}
        </span>
        <span>
          <i
            className="mr-1 inline-block h-[9px] w-[9px] rounded-sm align-[-1px]"
            style={{ backgroundColor: WEIGHT_COLORS.presence }}
          />
          {t('governance_presence')}
        </span>
        <span>
          <i
            className="mr-1 inline-block h-[9px] w-[9px] rounded-sm align-[-1px]"
            style={{ backgroundColor: WEIGHT_COLORS.sweat }}
          />
          {t('governance_weight_legend_sweat')}
        </span>
        <span>{t('governance_weight_legend_composition')}</span>
      </div>
    </div>
  );
};

export default HolderTable;
