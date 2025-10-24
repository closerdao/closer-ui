export type ProposalVote = {
  userId: string;
  signature: string;
  weight: number;
  votedAt: Date | string;
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
  // Base fields from _model
  visibleBy: string[];
  createdBy: string;
  updated: Date | string;
  created: Date | string;
  attributes: string[];
  managedBy: string[];
};
