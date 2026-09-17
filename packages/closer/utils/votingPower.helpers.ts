import { blockchainConfig } from '../config_blockchain';

const config = blockchainConfig as Record<string, any>;

/**
 * $Sweat counts five times towards a vote.
 *
 * Lives here rather than in `useVotingWeight` so this module stays a leaf: a
 * util that reaches back into a hook puts `hooks -> utils -> hooks` in the
 * module graph, and a cycle through that edge leaves `VOTING_TOKENS` undefined
 * for whichever side webpack evaluates second.
 */
export const SWEAT_VOTING_MULTIPLIER = 5;

// Tokens are named inconsistently in the network config ('TDF', '$Presence',
// 'Sweat'), and governance talks about all three with the $ prefix.
const toTokenLabel = (token: any, fallback: string): string => {
  const name: string = token?.name || token?.symbol || fallback;

  return name.startsWith('$') ? name : `$${name}`;
};

export type VotingTokenKey = 'tdf' | 'presence' | 'sweat';

/** The endpoint that sums every member's snapshotted wallet. */
export const WALLET_SUMS_PATH = '/sum/user/wallet';

/**
 * Every token that counts towards voting weight, in the order the breakdown is
 * displayed. The keys are the ones the wallet sums come back under.
 */
export const VOTING_TOKENS: {
  key: VotingTokenKey;
  label: string;
  multiplier: number;
}[] = [
  {
    key: 'tdf',
    label: toTokenLabel(config.BLOCKCHAIN_DAO_TOKEN, 'TDF'),
    multiplier: 1,
  },
  {
    key: 'presence',
    label: toTokenLabel(config.BLOCKCHAIN_PRESENCE_TOKEN, 'Presence'),
    multiplier: 1,
  },
  {
    key: 'sweat',
    label: toTokenLabel(config.BLOCKCHAIN_SWEAT_TOKEN, 'Sweat'),
    multiplier: SWEAT_VOTING_MULTIPLIER,
  },
];

export type VotingPowerSupply = Record<VotingTokenKey, number | null>;

export const EMPTY_VOTING_POWER_SUPPLY: VotingPowerSupply = {
  tdf: null,
  presence: null,
  sweat: null,
};

export interface VotingPowerBreakdownEntry {
  key: VotingTokenKey;
  label: string;
  supply: number;
  multiplier: number;
  /** What the token's whole supply is worth in votes. */
  votes: number;
}

export interface VotingPower {
  breakdown: VotingPowerBreakdownEntry[];
  /** Null when nothing could be read, which is not the same as zero. */
  total: number | null;
}

/**
 * Reads the `{ results: { tdf, presence, sweat } }` the wallet-sums endpoint
 * answers with. A token the response does not carry stays null rather than
 * becoming a zero that would quietly shrink the platform's voting power.
 */
export const parseWalletSums = (data: unknown): VotingPowerSupply => {
  const results = (data as { results?: Record<string, unknown> })?.results;

  if (!results || typeof results !== 'object') {
    return EMPTY_VOTING_POWER_SUPPLY;
  }

  return VOTING_TOKENS.reduce((supply, { key }) => {
    const value = Number(results[key]);

    return {
      ...supply,
      [key]: Number.isFinite(value) ? value : null,
    };
  }, EMPTY_VOTING_POWER_SUPPLY);
};

/**
 * Turns the per-token supplies into the platform's voting power, weighted the
 * same way an individual member's weight is (see `useVotingWeight`).
 */
export const buildVotingPower = (supply: VotingPowerSupply): VotingPower => {
  // A token with no supply on this platform (or one that failed to read) adds
  // nothing to the total and only clutters the breakdown.
  const breakdown = VOTING_TOKENS.filter(
    ({ key }) => (supply[key] || 0) > 0,
  ).map(({ key, label, multiplier }) => ({
    key,
    label,
    supply: supply[key] as number,
    multiplier,
    votes: (supply[key] as number) * multiplier,
  }));

  return {
    breakdown,
    total: breakdown.length
      ? breakdown.reduce((sum, entry) => sum + entry.votes, 0)
      : null,
  };
};
