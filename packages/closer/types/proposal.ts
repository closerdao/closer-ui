export type ProposalVote = {
  userId: string;
  signature: string;
  weight: number;
  votedAt: Date | string;
};

// The API snapshots a voter's eligible weight the first time they vote, and
// judges every later vote on that proposal against the snapshot rather than
// against a balance that has moved since.
export type ProposalVoterWeight = {
  userId: string;
  eligibleWeight: number;
  castWeight: number;
  snapshotAt: Date | string;
};

export type ProposalReward = {
  name: string;
  amount: number;
  contractAddress: string;
  source: string;
};

// The frozen record a proposal gets when it is finalized: the tally that was
// published, the bar it was judged against, and one proof per vote so anyone
// holding the vote list can rebuild it. Written by POST /proposals/:id/finalize
// and by nothing else.
export type ProposalAttestationStatus =
  | 'pending'
  | 'confirmed'
  | 'reverted'
  | 'failed';

/**
 * The publication of a frozen result to Celo: a zero-value transaction from the
 * DAO signer to itself carrying the tally as calldata, so the record is readable
 * by anyone without going through us.
 *
 * Null on a deployment that does not publish results, and on every proposal
 * finalized before publishing shipped. Its absence says nothing about the
 * result - the outcome is decided and frozen before any transaction is sent.
 */
export type ProposalOnChainAttestation = {
  chainId: number;
  from: string;
  to: string;
  txHash: string;
  blockNumber?: number;
  status: ProposalAttestationStatus;
  submittedAt?: Date | string;
  confirmedAt?: Date | string;
  attempts?: number;
  /**
   * The human explorer page for the transaction, when the API sends one. It
   * does not today, which is why the UI still keeps a chain-id mapping of its
   * own - see utils/proposalAttestation.ts.
   */
  explorerUrl?: string;
};

export type ProposalLockState = {
  finalizedAt: Date | string;
  finalizedBy: string;
  finalizedEarly: boolean;
  outcome: 'passed' | 'rejected';
  results: {
    yes: number;
    no: number;
    abstain: number;
  };
  quorum: number;
  quorumMet: boolean;
  majority: boolean;
  totalWeight: number;
  voterCount: number;
  proofAlgorithm: string;
  proofsHash: string;
  proofs: {
    index: number;
    userId: string;
    vote: 'yes' | 'no' | 'abstain';
    weight: number;
    votedAt: Date | string;
    hash: string;
  }[];
  onChain?: ProposalOnChainAttestation | null;
};

export type Proposal = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  authorAddress?: string;
  authorSignature?: string;
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'expired';
  startDate?: Date | string;
  endDate?: Date | string;
  votes: {
    yes: ProposalVote[];
    no: ProposalVote[];
    abstain: ProposalVote[];
  };
  rewards?: ProposalReward[];
  metadata: {
    budget?: number;
    category?: string;
    tags?: string[];
    attachments?: {
      name: string;
      url: string;
      type: string;
    }[];
  };
  results?: {
    yes: number;
    no: number;
    abstain: number;
  };
  quorum?: number;
  voterWeights?: ProposalVoterWeight[];
  lockState?: ProposalLockState;
  // Base fields from _model
  visibleBy: string[];
  createdBy: string;
  updated: Date | string;
  created: Date | string;
  attributes: string[];
  managedBy: string[];
};
