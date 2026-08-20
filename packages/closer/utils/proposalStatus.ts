import { Proposal, ProposalLockState } from 'closer/types';

export type EffectiveProposalStatus = 'draft' | 'active' | 'passed' | 'failed';

export type VoteCounts = {
  yes: number;
  no: number;
  abstain: number;
};

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * The frozen record of a finalized proposal, or null.
 *
 * A proposal nobody has finalized still answers with a `lockState` - an empty
 * skeleton with every field null - so its presence proves nothing. A stamped
 * `finalizedAt` is what says the tally was published.
 */
export const getFrozenResult = (
  proposal: Proposal | null,
): ProposalLockState | null => {
  const lockState = proposal?.lockState;

  return lockState?.finalizedAt ? lockState : null;
};

export const getVoteCounts = (proposal: Proposal | null): VoteCounts => {
  if (!proposal) {
    return { yes: 0, no: 0, abstain: 0 };
  }

  // A finalized proposal is judged on the tally that was frozen with it, and
  // that is the tally to show. Proposals imported with their result but not
  // their individual votes have nothing to count otherwise, and would report a
  // quorum met on a page saying nobody voted.
  const frozenResults = getFrozenResult(proposal)?.results;

  if (frozenResults) {
    return Object.assign({ yes: 0, no: 0, abstain: 0 }, frozenResults);
  }

  const results = proposal.results;
  const votes = proposal.votes;

  if (results !== undefined && results !== null) {
    return Object.assign({ yes: 0, no: 0, abstain: 0 }, results);
  }

  if (!votes) {
    return { yes: 0, no: 0, abstain: 0 };
  }

  const sumWeights = (value: Proposal['votes']['yes']) => {
    if (Array.isArray(value)) {
      return value.reduce((sum, vote) => sum + (vote.weight || 0), 0);
    }
    return typeof value === 'number' ? value : 0;
  };

  return {
    yes: sumWeights(votes.yes),
    no: sumWeights(votes.no),
    abstain: sumWeights(votes.abstain),
  };
};

export const getEffectiveStatus = (
  proposal: Proposal | null,
  labels: {
    draft: string;
    active: string;
    passed: string;
    failed: string;
    unknown: string;
  },
): { status: EffectiveProposalStatus; displayText: string } => {
  if (!proposal) {
    return { status: 'draft', displayText: labels.unknown };
  }

  const currentStatus = proposal.status;
  const endDate = proposal.endDate;

  if (currentStatus === 'draft') {
    return { status: 'draft', displayText: labels.draft };
  }

  if (currentStatus === 'passed') {
    return { status: 'passed', displayText: labels.passed };
  }

  if (currentStatus === 'rejected') {
    return { status: 'failed', displayText: labels.failed };
  }

  if (currentStatus === 'active') {
    const now = new Date();
    const end = endDate ? new Date(endDate) : null;

    if (!end || end.getTime() > now.getTime()) {
      return { status: 'active', displayText: labels.active };
    }

    const voteCounts = getVoteCounts(proposal);

    if (voteCounts.yes > voteCounts.no) {
      return { status: 'passed', displayText: labels.passed };
    }

    return { status: 'failed', displayText: labels.failed };
  }

  return {
    status: 'draft',
    displayText: currentStatus?.toUpperCase() || labels.unknown,
  };
};

export type VoteAllowance = {
  /** The most this citizen may put behind the proposal in total. */
  eligibleWeight: number;
  /** What they have already committed to it. */
  castWeight: number;
  /** What is left to spend. */
  remainingWeight: number;
};

const roundWeight = (value: number) => parseFloat(value.toFixed(2));

/**
 * How much weight a citizen may still cast on a proposal.
 *
 * The API snapshots their eligible weight the first time they vote and judges
 * every later vote against that snapshot, so a balance that grew since must not
 * widen what the page offers - the vote endpoint would refuse it. Only a voter
 * with no snapshot yet is measured against their live voting weight, which is
 * what the API will snapshot when their first vote lands.
 */
export const getVoteAllowance = (
  proposal: Proposal | null,
  userId: string | undefined,
  liveVotingWeight: number,
): VoteAllowance => {
  const snapshot = userId
    ? proposal?.voterWeights?.find((entry) => entry.userId === userId)
    : undefined;

  const castFromVotes = (['yes', 'no', 'abstain'] as const).reduce(
    (sum, option) =>
      sum +
      (proposal?.votes?.[option] || [])
        .filter((vote) => vote.userId === userId)
        .reduce((optionSum, vote) => optionSum + (vote.weight || 0), 0),
    0,
  );

  // A vote just cast locally is not in the snapshot yet, and a snapshot that
  // has caught up is not in a stale vote list: whichever is further along is
  // the one that keeps the remainder honest.
  const castWeight = roundWeight(
    Math.max(snapshot?.castWeight ?? 0, castFromVotes),
  );
  const eligibleWeight = roundWeight(
    snapshot?.eligibleWeight ?? Math.max(liveVotingWeight || 0, 0),
  );

  return {
    eligibleWeight,
    castWeight,
    remainingWeight: Math.max(0, roundWeight(eligibleWeight - castWeight)),
  };
};

/**
 * Whether a proposal is still taking votes.
 *
 * A proposal published without a voting window - `startDate`/`endDate` freeze
 * at publish, and they freeze empty if they were never set - stays open until
 * someone closes it. Treating a missing window as "closed" would hide the
 * ballot on a proposal that is very much live, so it is read the same way
 * `getEffectiveStatus` reads it.
 */
export const isVotingOpen = (proposal: Proposal | null): boolean => {
  if (!proposal || proposal.status !== 'active') {
    return false;
  }

  const endsAt = proposal.endDate ? new Date(proposal.endDate).getTime() : NaN;

  return Number.isNaN(endsAt) || Date.now() < endsAt;
};

/**
 * How long to hold off on finalizing a proposal whose voting just closed.
 *
 * The API judges "has voting closed" on its own clock, so a finalize sent the
 * instant a countdown hits zero can land while the proposal is still open by a
 * second of clock skew - a 409 the citizen would have to reload to get past.
 * Whoever watched the clock run out waits the full beat; a page opened long
 * after the window closed waits not at all.
 */
export const getFinalizeDelay = (
  endDate: Date | string | undefined,
  graceMs: number,
): number => {
  const endedAt = endDate ? new Date(endDate).getTime() : NaN;

  if (Number.isNaN(endedAt)) {
    return 0;
  }

  return Math.max(0, Math.min(graceMs, graceMs - (Date.now() - endedAt)));
};

/**
 * A proposal whose voting window has closed but whose result was never frozen.
 * Finalizing is what turns the votes into the DAO's record, so the first
 * citizen to open such a proposal calls POST /proposals/:id/finalize.
 */
export const needsFinalizing = (proposal: Proposal | null): boolean => {
  if (!proposal || proposal.status !== 'active' || getFrozenResult(proposal)) {
    return false;
  }

  const endsAt = proposal.endDate ? new Date(proposal.endDate).getTime() : NaN;

  return !Number.isNaN(endsAt) && Date.now() >= endsAt;
};

export const isWithinResultCelebrationWindow = (
  endDate?: Date | string,
): boolean => {
  if (!endDate) {
    return false;
  }

  const msSinceEnd = Date.now() - new Date(endDate).getTime();
  return msSinceEnd >= 0 && msSinceEnd <= TWENTY_FOUR_HOURS_MS;
};

export const getResultCelebrationStorageKey = (proposalId: string): string =>
  `governance-result-celebration-${proposalId}`;

export const hasSeenResultCelebration = (proposalId: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.localStorage.getItem(getResultCelebrationStorageKey(proposalId)) ===
    'true'
  );
};

export const markResultCelebrationSeen = (proposalId: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getResultCelebrationStorageKey(proposalId), 'true');
};
