export type EngagementOpportunityStatus =
  | 'queued'
  | 'assigned'
  | 'host_notified'
  | 'approved'
  | 'contacted'
  | 'converted'
  | 'dismissed'
  | 'expired';

export type EngagementOpportunityPriority = 'high' | 'medium' | 'low' | string;

export interface EngagementHostMatchReason {
  hostId?: string;
  hostEmail?: string;
  hostName?: string;
  score?: number;
  reasons?: string[];
}

export interface EngagementRewardDraft {
  amount?: number;
  currency?: string;
  source?: string;
  message?: string;
  awardedAt?: string;
  awardedBy?: string;
  stayId?: string;
}

export interface EngagementOutreachDraft {
  subject?: string;
  body?: string;
}

export interface EngagementHostBriefLegacy {
  summary?: string;
  suggestedApproach?: string;
}

export interface EngagementAiMeta {
  provider?: string;
  model?: string;
  subjectOptions?: string[];
  recommendedTone?: string;
  risks?: string[];
  personalizationFactsUsed?: string[];
  opportunityContext?: Record<string, unknown>;
  hostMatching?: {
    managedByIds?: string[];
    rankedHosts?: EngagementHostMatchReason[];
  };
  cadenceContext?: Record<string, unknown>;
}

export interface EngagementSignals {
  name?: string;
  roles?: string[];
  lastactive?: string;
  daysSinceActive?: number;
  latestBookingStatus?: string;
  paidBookingsCount?: number;
  reasons?: string[];
}

export interface EngagementHistoryEntry {
  type?: string;
  note?: string;
  at?: string;
  created?: string;
  createdAt?: string;
}

export interface EngagementOpportunity {
  _id: string;
  userId?: string;
  email?: string;
  monthBucket?: string;
  source?: string;
  stage?: string;
  segment?: string;
  recommendedAction?: string;
  score?: number;
  priority?: EngagementOpportunityPriority;
  status?: EngagementOpportunityStatus;
  signals?: EngagementSignals;
  recommendedNextSteps?: string[];
  rewardRecommendation?: Record<string, unknown>;
  reward?: EngagementRewardDraft | Record<string, unknown>;
  assignedHostIds?: string[];
  managedBy?: string[];
  hostMatchReasons?: EngagementHostMatchReason[];
  outreachDraft?: EngagementOutreachDraft;
  subject?: string;
  body?: string;
  hostBrief?: string | EngagementHostBriefLegacy;
  aiMeta?: EngagementAiMeta;
  cooldown?: Record<string, unknown>;
  lastEvaluatedAt?: string;
  nextEligibleAt?: string;
  hostNotifiedAt?: string;
  approvedAt?: string;
  contactedAt?: string;
  engagementHistory?: EngagementHistoryEntry[];
}
