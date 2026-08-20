import { Proposal } from 'closer/types';

export type EffectiveProposalStatus = 'draft' | 'active' | 'passed' | 'failed';

export type VoteCounts = {
  yes: number;
  no: number;
  abstain: number;
};

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const getVoteCounts = (proposal: Proposal | null): VoteCounts => {
  if (!proposal) {
    return { yes: 0, no: 0, abstain: 0 };
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
