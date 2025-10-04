export type Proposal = {
  title: string;
  description: string;
  rationale?: string; // Why this proposal is needed
  impact?: string; // Expected impact of the proposal
  requestedResources?: string; // Resources needed for implementation
  executionPlan?: string; // How the proposal will be executed
  authorAddress?: string; // Only required when moving from draft to ready
  status: 'draft' | 'ready' | 'active' | 'closed' | 'pending';
  startDate?: string; // Only set when moving to ready/active
  endDate?: string; // Only set when moving to ready/active
  votes?: {
    yes: number;
    no: number;
    abstain: number;
  };
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
  slug: string;
  featured?: boolean;
  signatureHash?: string; // Hash of proposal description for author verification (only when ready+)
  authorSignature?: string; // Cryptographic signature of the proposal description hash by the author (only when ready+)
  template?: string; // Template used to create the proposal
};

export type ProposalVote = {
  proposalId: string;
  userId: string;
  vote: 'yes' | 'no' | 'abstain';
  votingPower: number;
  timestamp: string;
  _id: string;
  signatureHash: string; // Hash of proposal description + vote content
};
