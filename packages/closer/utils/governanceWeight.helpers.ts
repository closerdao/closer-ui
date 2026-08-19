import {
  DecentralizationIndexResult,
  GovernanceTokenKey,
  GovernanceWeightControls,
  GovernanceWeightHolder,
  GovernanceWeightRow,
  GovernanceWeightScenario,
} from '../types/governanceWeight';

export const WAD = 10n ** 18n;

export const BURN_ADDRESSES = new Set([
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
]);

export const parseAddressList = (input: string): string[] => {
  const matches = input.match(/0x[0-9a-fA-F]{40}/g) || [];
  return [...new Set(matches.map((address) => address.toLowerCase()))];
};

export const shortenAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const formatTokenAmount = (value: bigint, decimalPlaces = 2): string => {
  const isNegative = value < 0n;
  const absolute = isNegative ? -value : value;
  const whole = absolute / WAD;
  const fraction = absolute % WAD;
  const fractionDigits = fraction
    .toString()
    .padStart(18, '0')
    .slice(0, decimalPlaces)
    .replace(/0+$/, '');

  // A genuinely nonzero balance can still round away to nothing at low
  // decimalPlaces (e.g. 0.001 TDF at 2 decimals) — showing bare "0" there
  // would be indistinguishable from an exact zero, so flag it instead.
  if (absolute > 0n && whole === 0n && !fractionDigits && decimalPlaces > 0) {
    return `${isNegative ? '-' : ''}<0.${'0'.repeat(decimalPlaces - 1)}1`;
  }

  const groupedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (
    (isNegative ? '-' : '') +
    groupedWhole +
    (fractionDigits ? `.${fractionDigits}` : '')
  );
};

export const percentOf = (part: bigint, whole: bigint): number =>
  whole === 0n ? 0 : Number((part * 10000n) / whole) / 100;

/**
 * Gini coefficient of governance weight across every voting address: 0 (everyone
 * equal) to 1 (one address holds it all).
 */
export const computeGiniCoefficient = (values: number[]): number => {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((total, value) => total + value, 0);
  if (!count || !sum) return 0;
  let cumulative = 0;
  for (let i = 0; i < count; i++) cumulative += (i + 1) * sorted[i];
  return (2 * cumulative) / (count * sum) - (count + 1) / count;
};

const APOKEDRO_MAX_EXACT_HOLDERS = 18;

/**
 * A DAO's holder distribution is typically long-tailed (a few whales, hundreds
 * of small wallets). Equal-width value bins would collapse nearly every small
 * holder into one bin while whales stand alone, understating the tail's
 * numerosity enough to misreport a clearly multi-holder distribution as
 * "one wallet controls everything". We keep the largest raw values exactly
 * (half the bin budget) and only quantile-bin (equal population, not equal
 * value width) the remaining tail, which keeps whales visible as individuals
 * while still compressing the long tail into a bounded number of samples.
 */
export const reduceForApokedro = (
  values: number[],
  maxCount: number,
): number[] => {
  if (values.length <= maxCount) return values.slice();
  const sorted = [...values].sort((a, b) => b - a);
  const keepTopCount = Math.min(Math.ceil(maxCount / 2), sorted.length);
  const top = sorted.slice(0, keepTopCount);
  const tail = sorted.slice(keepTopCount).sort((a, b) => a - b);
  const remainingSlots = maxCount - keepTopCount;
  if (!tail.length || remainingSlots <= 0) return top;

  const tailLength = tail.length;
  const binned: number[] = [];
  for (let bin = 0; bin < remainingSlots; bin++) {
    const lo = Math.floor((bin * tailLength) / remainingSlots);
    const hi = Math.max(
      Math.floor(((bin + 1) * tailLength) / remainingSlots),
      lo + 1,
    );
    const segment = tail.slice(lo, hi);
    binned.push(segment[Math.floor(segment.length / 2)]);
  }
  return top.concat(binned);
};

/**
 * Apokedro decentralization index (Papangelou, Christodoulou & Inglezakis,
 * "Apokedro: A Decentralization Index for DAOs and Beyond", Blockchains 2025,
 * 3(1), 4 — https://doi.org/10.3390/blockchains3010004). Averages a
 * Nash-equilibrium-style agreement probability (1 / 2^(k-1) for a coalition of
 * size k) over every *minimal* winning coalition — every subset whose weight
 * crosses the 50% threshold but no proper subset of it does. Exact enumeration
 * is combinatorial (the paper itself caps exact computation around n=28 and
 * falls back to histogram-binning beyond that); we follow the same approach,
 * reducing any larger holder set to at most 18 representative values first.
 */
export const computeApokedroIndex = (
  values: number[],
): DecentralizationIndexResult | null => {
  const positive = values.filter((value) => value > 0);
  if (positive.length < 2) return null;

  const reduced = reduceForApokedro(positive, APOKEDRO_MAX_EXACT_HOLDERS);
  const total = reduced.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;

  const threshold = total / 2;
  // Descending order reaches the threshold sooner, pruning the search faster.
  const sorted = [...reduced].sort((a, b) => b - a);
  const n = sorted.length;
  let probabilitySum = 0;
  let coalitionCount = 0;

  const visit = (startIndex: number, runningSum: number, depth: number) => {
    for (let i = startIndex; i < n; i++) {
      const nextSum = runningSum + sorted[i];
      const nextDepth = depth + 1;
      if (nextSum >= threshold) {
        probabilitySum += 1 / 2 ** (nextDepth - 1);
        coalitionCount++;
      } else {
        visit(i + 1, nextSum, nextDepth);
      }
    }
  };
  visit(0, 0, 0);

  return {
    value: coalitionCount ? probabilitySum / coalitionCount : 0,
    isApproximated: positive.length > APOKEDRO_MAX_EXACT_HOLDERS,
    sampleSize: reduced.length,
  };
};

/** Cumulative weight, sorted largest-first, crosses 50% after this many wallets. */
export const countWalletsForMajority = (
  weights: bigint[],
  total: bigint,
): number => {
  const sorted = [...weights].sort((a, b) => (a < b ? 1 : -1));
  let cumulative = 0n;
  let count = 0;
  for (const weight of sorted) {
    cumulative += weight;
    count++;
    if (cumulative * 2n > total) break;
  }
  return count;
};

export const buildGovernanceWeightCsv = (
  rows: GovernanceWeightRow[],
  meta: {
    presenceMultiplier: string;
    sweatMultiplier: string;
    includeStaked: boolean;
    blockNumber: number | null;
  },
): string => {
  const header = [
    'rank',
    'address',
    'label',
    'is_contract',
    'excluded',
    'tdf_liquid',
    'tdf_staked',
    'staked_counted',
    'presence',
    'sweat',
    'presence_multiplier',
    'sweat_multiplier',
    'governance_weight',
    'holds_membership_nft',
    'block',
  ];

  let rank = 0;
  const lines = rows.map((row) => {
    if (!row.isExcluded) rank++;
    return [
      row.isExcluded ? '' : rank,
      row.address,
      JSON.stringify(row.tag || row.name || ''),
      row.isContract,
      row.isExcluded,
      formatTokenAmount(row.tdf, 18),
      formatTokenAmount(row.staked, 18),
      meta.includeStaked,
      formatTokenAmount(row.presence, 18),
      formatTokenAmount(row.sweat, 18),
      meta.presenceMultiplier,
      meta.sweatMultiplier,
      formatTokenAmount(row.weight, 18),
      row.isMember,
      meta.blockNumber ?? '',
    ].join(',');
  });

  return [header.join(','), ...lines].join('\n');
};

export const multiplierToBasisPoints = (multiplier: number): bigint => {
  const safe = Number.isFinite(multiplier) && multiplier >= 0 ? multiplier : 0;
  return BigInt(Math.round(safe * 10000));
};

export interface WeightPieSegment {
  name: string;
  value: number;
  fraction: number;
}

/** Top N holders as individual slices, remaining holders collapsed into one "N smaller holders" slice. */
export const buildHolderConcentrationSegments = (
  rows: GovernanceWeightRow[],
  totalWeight: bigint,
  topN = 12,
): WeightPieSegment[] => {
  if (!rows.length || totalWeight === 0n) return [];
  const sorted = [...rows].sort((a, b) => (a.weight < b.weight ? 1 : -1));
  const toFraction = (value: bigint) =>
    Number((value * 1000000n) / totalWeight) / 1000000;

  if (sorted.length <= topN + 1) {
    return sorted.map((row) => {
      const fraction = toFraction(row.weight);
      return {
        name: row.tag || row.name || shortenAddress(row.address),
        value: fraction,
        fraction,
      };
    });
  }

  const top = sorted.slice(0, topN).map((row) => {
    const fraction = toFraction(row.weight);
    return {
      name: row.tag || row.name || shortenAddress(row.address),
      value: fraction,
      fraction,
    };
  });
  const restWeight = sorted
    .slice(topN)
    .reduce((sum, row) => sum + row.weight, 0n);
  const restFraction = toFraction(restWeight);
  return [
    ...top,
    {
      name: `${sorted.length - topN} smaller holders`,
      value: restFraction,
      fraction: restFraction,
    },
  ];
};

export const sumTopNWeights = (weights: bigint[], n: number): bigint =>
  [...weights]
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, n)
    .reduce((sum, weight) => sum + weight, 0n);

const computeScenario = (weights: bigint[]): GovernanceWeightScenario => {
  const total = weights.reduce((sum, weight) => sum + weight, 0n);
  return {
    total,
    votingCount: weights.length,
    top5Share: sumTopNWeights(weights, 5),
    majorityCount: countWalletsForMajority(weights, total),
  };
};

const isRowExcluded = (
  holder: GovernanceWeightHolder,
  controls: GovernanceWeightControls,
  excludedAddresses: Set<string>,
): boolean =>
  excludedAddresses.has(holder.address) ||
  (controls.excludeAllContracts && holder.isContract) ||
  (controls.excludeBurnAndNull && BURN_ADDRESSES.has(holder.address));

const compareRows = (
  a: GovernanceWeightRow,
  b: GovernanceWeightRow,
  sortKey: string,
  direction: 1 | -1,
): number => {
  const valueA = (a as unknown as Record<string, unknown>)[sortKey];
  const valueB = (b as unknown as Record<string, unknown>)[sortKey];
  if (valueA === valueB) return 0;
  const isLess =
    typeof valueA === 'bigint' && typeof valueB === 'bigint'
      ? valueA < valueB
      : (valueA as any) < (valueB as any);
  return (isLess ? -1 : 1) * direction;
};

export interface GovernanceWeightView {
  displayedRows: GovernanceWeightRow[];
  votingRows: GovernanceWeightRow[];
  countedRows: GovernanceWeightRow[];
  totalWeight: bigint;
  totalTdfLiquid: bigint;
  totalStaked: bigint;
  totalPresenceWeighted: bigint;
  totalSweatWeighted: bigint;
  top5Share: bigint;
  majorityCount: number;
  setAsideCount: number;
  giniValue: number;
  apokedro: DecentralizationIndexResult | null;
  tokenVotingCounts: Record<GovernanceTokenKey, number>;
  impact: {
    withoutStaked: GovernanceWeightScenario;
    withStaked: GovernanceWeightScenario;
    stakedHolderCount: number;
    stakedSum: bigint;
  };
  assumptions: {
    nonMemberVotingCount: number;
    presenceWithZeroTdfCount: number;
    stakedWithZeroPresenceCount: number;
  };
}

export const computeGovernanceWeightView = (
  holders: GovernanceWeightHolder[],
  controls: GovernanceWeightControls,
): GovernanceWeightView => {
  const excludedAddresses = new Set(
    parseAddressList(controls.excludedAddressesText),
  );
  const presenceBasisPoints = multiplierToBasisPoints(
    controls.presenceMultiplier,
  );
  const sweatBasisPoints = multiplierToBasisPoints(controls.sweatMultiplier);

  const allRows: GovernanceWeightRow[] = holders.map((holder) => {
    const sweatWeighted = (holder.sweat * sweatBasisPoints) / 10000n;
    const presenceWeighted = (holder.presence * presenceBasisPoints) / 10000n;
    const tdfEffective = controls.includeStaked
      ? holder.tdf + holder.staked
      : holder.tdf;
    return {
      ...holder,
      tdfEffective,
      presenceWeighted,
      sweatWeighted,
      weight: tdfEffective + presenceWeighted + sweatWeighted,
      isExcluded: isRowExcluded(holder, controls, excludedAddresses),
    };
  });

  const votingRows = allRows.filter((row) => !row.isExcluded);
  const countedRows = votingRows.filter((row) => row.weight > 0n);

  const tokenVotingCounts = {
    tdf: votingRows.filter((row) => row.tdf > 0n).length,
    presence: votingRows.filter((row) => row.presence > 0n).length,
    sweat: votingRows.filter((row) => row.sweat > 0n).length,
  };

  let displayedRows = controls.showExcluded ? allRows : votingRows;
  if (controls.hideZeroWeight) {
    displayedRows = displayedRows.filter((row) => row.weight > 0n);
  }
  const query = controls.search.trim().toLowerCase();
  if (query) {
    displayedRows = displayedRows.filter(
      (row) =>
        row.address.includes(query) ||
        (row.name || '').toLowerCase().includes(query) ||
        (row.tag || '').toLowerCase().includes(query),
    );
  }
  displayedRows = [...displayedRows].sort((a, b) =>
    compareRows(a, b, controls.sortKey, controls.sortDirection),
  );

  const weights = countedRows.map((row) => row.weight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0n);

  const withoutStaked = computeScenario(
    votingRows
      .map((row) => row.tdf + row.presenceWeighted + row.sweatWeighted)
      .filter((weight) => weight > 0n),
  );
  const withStaked = computeScenario(
    votingRows
      .map(
        (row) =>
          row.tdf + row.staked + row.presenceWeighted + row.sweatWeighted,
      )
      .filter((weight) => weight > 0n),
  );
  const stakedHolders = votingRows.filter((row) => row.staked > 0n);

  return {
    displayedRows,
    votingRows,
    countedRows,
    totalWeight,
    totalTdfLiquid: countedRows.reduce((sum, row) => sum + row.tdf, 0n),
    totalStaked: countedRows.reduce((sum, row) => sum + row.staked, 0n),
    totalPresenceWeighted: countedRows.reduce(
      (sum, row) => sum + row.presenceWeighted,
      0n,
    ),
    totalSweatWeighted: countedRows.reduce(
      (sum, row) => sum + row.sweatWeighted,
      0n,
    ),
    top5Share: sumTopNWeights(weights, 5),
    majorityCount: countWalletsForMajority(weights, totalWeight),
    setAsideCount: allRows.filter((row) => row.isExcluded && row.weight > 0n)
      .length,
    giniValue: computeGiniCoefficient(weights.map((weight) => Number(weight))),
    apokedro: computeApokedroIndex(weights.map((weight) => Number(weight))),
    tokenVotingCounts,
    impact: {
      withoutStaked,
      withStaked,
      stakedHolderCount: stakedHolders.length,
      stakedSum: stakedHolders.reduce((sum, row) => sum + row.staked, 0n),
    },
    assumptions: {
      nonMemberVotingCount: votingRows.filter((row) => !row.isMember).length,
      presenceWithZeroTdfCount: allRows.filter(
        (row) => row.presence > 0n && row.tdf === 0n && row.staked === 0n,
      ).length,
      stakedWithZeroPresenceCount: allRows.filter(
        (row) => row.staked > 0n && row.presence === 0n,
      ).length,
    },
  };
};
