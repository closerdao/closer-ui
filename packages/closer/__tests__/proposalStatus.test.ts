import { Proposal, ProposalLockState } from '../types';
import {
  getEffectiveStatus,
  getFinalizeDelay,
  getFrozenResult,
  getVoteCounts,
  getVoteAllowance,
  hasMetQuorum,
  hasPassingTally,
  isVotingOpen,
  needsFinalizing,
} from '../utils/proposalStatus';

const HOUR_MS = 60 * 60 * 1000;

const buildProposal = (over: Partial<Proposal> = {}): Proposal =>
  ({
    _id: 'p1',
    title: 'Deeper borehole',
    slug: 'deeper-borehole',
    description: '',
    status: 'active',
    endDate: new Date(Date.now() - HOUR_MS).toISOString(),
    votes: { yes: [], no: [], abstain: [] },
    metadata: {},
    ...over,
  } as Proposal);

const lockState = {
  finalizedAt: new Date().toISOString(),
  outcome: 'passed',
  quorum: 10,
  quorumMet: true,
  voterCount: 2,
} as ProposalLockState;

describe('needsFinalizing', () => {
  it('is true for a proposal whose voting closed without a frozen result', () => {
    expect(needsFinalizing(buildProposal())).toBe(true);
  });

  it('is false while voting is still open', () => {
    expect(
      needsFinalizing(
        buildProposal({ endDate: new Date(Date.now() + HOUR_MS).toISOString() }),
      ),
    ).toBe(false);
  });

  it('is false once the result has been frozen', () => {
    expect(needsFinalizing(buildProposal({ lockState }))).toBe(false);
  });

  it('is true despite the empty lockState skeleton the API always returns', () => {
    // An unfinalized proposal still answers with a lockState - every field null.
    const skeleton = {
      finalizedAt: null,
      outcome: null,
      quorum: null,
      quorumMet: null,
      proofs: [],
    } as unknown as ProposalLockState;

    expect(needsFinalizing(buildProposal({ lockState: skeleton }))).toBe(true);
    expect(getFrozenResult(buildProposal({ lockState: skeleton }))).toBeNull();
    expect(getFrozenResult(buildProposal({ lockState }))).toBe(lockState);
  });

  it('is false for proposals that are not active', () => {
    expect(needsFinalizing(buildProposal({ status: 'draft' }))).toBe(false);
    expect(needsFinalizing(buildProposal({ status: 'passed' }))).toBe(false);
    expect(needsFinalizing(buildProposal({ status: 'rejected' }))).toBe(false);
  });

  it('is false without a usable end date', () => {
    expect(needsFinalizing(buildProposal({ endDate: undefined }))).toBe(false);
    expect(needsFinalizing(buildProposal({ endDate: 'whenever' }))).toBe(false);
    expect(needsFinalizing(null)).toBe(false);
  });
});

describe('getVoteAllowance', () => {
  const userId = 'citizen-1';

  const withVotes = (weights: number[]): Partial<Proposal> => ({
    votes: {
      yes: weights.map((weight) => ({
        userId,
        weight,
        signature: 'sig',
        votedAt: new Date().toISOString(),
      })),
      no: [],
      abstain: [],
    },
  });

  it('measures a first-time voter against their live voting weight', () => {
    const allowance = getVoteAllowance(buildProposal(), userId, 29.7);

    expect(allowance).toEqual({
      eligibleWeight: 29.7,
      castWeight: 0,
      remainingWeight: 29.7,
    });
  });

  it('measures a returning voter against the snapshot, not a grown balance', () => {
    const proposal = buildProposal({
      ...withVotes([3, 26.3]),
      voterWeights: [
        {
          userId,
          eligibleWeight: 30,
          castWeight: 29.3,
          snapshotAt: new Date().toISOString(),
        },
      ],
    });

    // The wallet now holds 59, but the API judges this vote against the 30 it
    // snapshotted, so only 0.7 is still castable.
    expect(getVoteAllowance(proposal, userId, 59)).toEqual({
      eligibleWeight: 30,
      castWeight: 29.3,
      remainingWeight: 0.7,
    });
  });

  it('takes whichever of the snapshot and the vote list is further along', () => {
    const proposal = buildProposal({
      // A vote cast a moment ago is on the proposal before the snapshot catches
      // up with it.
      ...withVotes([10, 5]),
      voterWeights: [
        {
          userId,
          eligibleWeight: 30,
          castWeight: 10,
          snapshotAt: new Date().toISOString(),
        },
      ],
    });

    expect(getVoteAllowance(proposal, userId, 30)).toEqual({
      eligibleWeight: 30,
      castWeight: 15,
      remainingWeight: 15,
    });
  });

  it('never offers a negative remainder', () => {
    const proposal = buildProposal({
      voterWeights: [
        {
          userId,
          eligibleWeight: 30,
          castWeight: 31,
          snapshotAt: new Date().toISOString(),
        },
      ],
    });

    expect(getVoteAllowance(proposal, userId, 30).remainingWeight).toBe(0);
  });

  it('ignores other citizens votes and snapshots', () => {
    const proposal = buildProposal({
      votes: {
        yes: [
          {
            userId: 'someone-else',
            weight: 12,
            signature: 'sig',
            votedAt: new Date().toISOString(),
          },
        ],
        no: [],
        abstain: [],
      },
      voterWeights: [
        {
          userId: 'someone-else',
          eligibleWeight: 12,
          castWeight: 12,
          snapshotAt: new Date().toISOString(),
        },
      ],
    });

    expect(getVoteAllowance(proposal, userId, 8)).toEqual({
      eligibleWeight: 8,
      castWeight: 0,
      remainingWeight: 8,
    });
  });
});

describe('isVotingOpen', () => {
  it('is true while the voting window is still running', () => {
    expect(
      isVotingOpen(
        buildProposal({ endDate: new Date(Date.now() + HOUR_MS).toISOString() }),
      ),
    ).toBe(true);
  });

  it('is false once the window has closed', () => {
    expect(isVotingOpen(buildProposal())).toBe(false);
  });

  it('is true for an active proposal published without a voting window', () => {
    // startDate/endDate freeze at publish, and freeze empty if they were never
    // set - such a proposal is open, not closed.
    expect(isVotingOpen(buildProposal({ endDate: undefined }))).toBe(true);
    expect(isVotingOpen(buildProposal({ endDate: 'whenever' }))).toBe(true);
  });

  it('is false for anything that is not active', () => {
    expect(
      isVotingOpen(buildProposal({ status: 'draft', endDate: undefined })),
    ).toBe(false);
    expect(
      isVotingOpen(buildProposal({ status: 'passed', endDate: undefined })),
    ).toBe(false);
    expect(isVotingOpen(null)).toBe(false);
  });
});

describe('getFinalizeDelay', () => {
  const GRACE_MS = 5000;

  // The delay is measured against the clock the moment it is asked for, so a
  // real clock ticking between building the end date and the call turns an
  // exact 4000 into 3999.
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits out the grace for a window that just closed', () => {
    const endDate = new Date(Date.now() - 1000).toISOString();

    expect(getFinalizeDelay(endDate, GRACE_MS)).toBe(4000);
  });

  it('waits the full grace when the window has not quite closed', () => {
    // The countdown fires a shade early, or the local clock runs fast.
    const endDate = new Date(Date.now() + 2000).toISOString();

    expect(getFinalizeDelay(endDate, GRACE_MS)).toBe(GRACE_MS);
  });

  it('does not wait for a window that closed long ago', () => {
    const endDate = new Date(Date.now() - HOUR_MS).toISOString();

    expect(getFinalizeDelay(endDate, GRACE_MS)).toBe(0);
  });

  it('does not wait when there is no usable end date', () => {
    expect(getFinalizeDelay(undefined, GRACE_MS)).toBe(0);
    expect(getFinalizeDelay('whenever', GRACE_MS)).toBe(0);
  });
});

describe('getVoteCounts', () => {
  it('reports the tally that was frozen with a finalized proposal', () => {
    // Historical proposals are imported with their result but not their
    // individual votes, so counting the vote list would report nobody voting
    // on a proposal whose frozen record says the quorum was met.
    const proposal = buildProposal({
      status: 'passed',
      votes: { yes: [], no: [], abstain: [] },
      lockState: {
        ...lockState,
        quorum: 500,
        quorumMet: true,
        results: { yes: 636.87, no: 0, abstain: 0 },
      } as ProposalLockState,
    });

    expect(getVoteCounts(proposal)).toEqual({
      yes: 636.87,
      no: 0,
      abstain: 0,
    });
  });

  it('counts the votes while the proposal is still open', () => {
    const proposal = buildProposal({
      votes: {
        yes: [
          {
            userId: 'a',
            weight: 3,
            signature: 'sig',
            votedAt: new Date().toISOString(),
          },
          {
            userId: 'b',
            weight: 1.5,
            signature: 'sig',
            votedAt: new Date().toISOString(),
          },
        ],
        no: [],
        abstain: [],
      },
    });

    expect(getVoteCounts(proposal)).toEqual({ yes: 4.5, no: 0, abstain: 0 });
  });

  it('is not fooled by the empty lockState skeleton', () => {
    const proposal = buildProposal({
      votes: {
        yes: [
          {
            userId: 'a',
            weight: 2,
            signature: 'sig',
            votedAt: new Date().toISOString(),
          },
        ],
        no: [],
        abstain: [],
      },
      lockState: {
        finalizedAt: null,
        results: null,
      } as unknown as ProposalLockState,
    });

    expect(getVoteCounts(proposal)).toEqual({ yes: 2, no: 0, abstain: 0 });
  });
});

const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  passed: 'Passed',
  failed: 'Failed',
  unknown: 'Unknown',
};

describe('hasMetQuorum', () => {
  it('requires yes weight to meet a configured quorum', () => {
    expect(hasMetQuorum(9, 10)).toBe(false);
    expect(hasMetQuorum(10, 10)).toBe(true);
    expect(hasMetQuorum(12, 10)).toBe(true);
  });

  it('treats a quorum of 0 as not configured, not already met', () => {
    expect(hasMetQuorum(100, 0)).toBe(false);
  });
});

describe('hasPassingTally', () => {
  it('passes only with both a yes majority and quorum', () => {
    expect(hasPassingTally({ yes: 12, no: 3, abstain: 0 }, 10)).toBe(true);
    expect(hasPassingTally({ yes: 12, no: 3, abstain: 0 }, 20)).toBe(false);
    expect(hasPassingTally({ yes: 5, no: 8, abstain: 0 }, 4)).toBe(false);
  });
});

describe('getEffectiveStatus', () => {
  it('keeps an open proposal active', () => {
    const proposal = buildProposal({
      endDate: new Date(Date.now() + HOUR_MS).toISOString(),
      results: { yes: 20, no: 0, abstain: 0 },
      quorum: 10,
    });

    expect(getEffectiveStatus(proposal, STATUS_LABELS).status).toBe('active');
  });

  it('does not treat a yes-majority as passed when quorum was not met', () => {
    const proposal = buildProposal({
      results: { yes: 8, no: 1, abstain: 0 },
      quorum: 10,
    });

    expect(getEffectiveStatus(proposal, STATUS_LABELS).status).toBe('failed');
  });

  it('treats an ended live tally as passed when yes leads and quorum is met', () => {
    const proposal = buildProposal({
      results: { yes: 12, no: 1, abstain: 0 },
      quorum: 10,
    });

    expect(getEffectiveStatus(proposal, STATUS_LABELS).status).toBe('passed');
  });

  it('uses a supplied quorum when the proposal itself has none', () => {
    const proposal = buildProposal({
      results: { yes: 8, no: 1, abstain: 0 },
      quorum: 0,
    });

    expect(getEffectiveStatus(proposal, STATUS_LABELS).status).toBe('failed');
    expect(getEffectiveStatus(proposal, STATUS_LABELS, 5).status).toBe(
      'passed',
    );
  });

  it('trusts a frozen rejection even when yes outnumbers no', () => {
    const proposal = buildProposal({
      results: { yes: 8, no: 1, abstain: 0 },
      quorum: 10,
      lockState: {
        ...lockState,
        outcome: 'rejected',
        quorum: 10,
        quorumMet: false,
        results: { yes: 8, no: 1, abstain: 0 },
      } as ProposalLockState,
    });

    expect(getEffectiveStatus(proposal, STATUS_LABELS).status).toBe('failed');
  });

  it('is not fooled by the empty lockState skeleton', () => {
    const proposal = buildProposal({
      results: { yes: 8, no: 1, abstain: 0 },
      quorum: 10,
      lockState: {
        finalizedAt: null,
        outcome: null,
      } as unknown as ProposalLockState,
    });

    expect(getEffectiveStatus(proposal, STATUS_LABELS).status).toBe('failed');
  });
});
