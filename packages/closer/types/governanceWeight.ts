export type GovernanceTokenKey = 'tdf' | 'presence' | 'sweat';

export interface GovernanceWeightHolder {
  address: string;
  isContract: boolean;
  name: string | null;
  tag: string | null;
  tdf: bigint;
  presence: bigint;
  sweat: bigint;
  staked: bigint;
  isMember: boolean;
}

export interface GovernanceTokenSource {
  key: GovernanceTokenKey;
  label: string;
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number;
  totalSupply: bigint | null;
  hasContractCode: boolean;
  isIndexed: boolean | null;
  holderCount: number;
  votingCount: number;
  error: string | null;
}

export interface GovernanceWeightRegistry {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progressLabel: string;
  errorMessage: string | null;
  blockNumber: number | null;
  holders: GovernanceWeightHolder[];
  tokenSources: Record<GovernanceTokenKey, GovernanceTokenSource> | null;
  membershipTotalSupply: number | null;
  diagnosticsLog: string[];
  warnings: string[];
}

export interface GovernanceWeightRow extends GovernanceWeightHolder {
  tdfEffective: bigint;
  presenceWeighted: bigint;
  sweatWeighted: bigint;
  weight: bigint;
  isExcluded: boolean;
}

export interface GovernanceWeightScenario {
  total: bigint;
  votingCount: number;
  top5Share: bigint;
  majorityCount: number;
}

export interface GovernanceWeightControls {
  presenceMultiplier: number;
  sweatMultiplier: number;
  includeStaked: boolean;
  search: string;
  showExcluded: boolean;
  hideZeroWeight: boolean;
  excludedAddressesText: string;
  extraAddressesText: string;
  excludeAllContracts: boolean;
  excludeBurnAndNull: boolean;
  rpcUrl: string;
  reverifyOnChain: boolean;
  sortKey: string;
  sortDirection: 1 | -1;
}

export interface DecentralizationIndexResult {
  value: number;
  isApproximated: boolean;
  sampleSize: number;
}
