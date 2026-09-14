export type EngagementOpportunityStatus =
  | 'queued'
  | 'assigned'
  | 'approved'
  | 'contacted'
  | 'converted'
  | 'dismissed'
  | 'expired';

export type EngagementOpportunityPriority = 'high' | 'medium' | 'low' | string;

/**
 * `next_step` names where somebody is on their journey, `reconnect` is a hello
 * after a year or more away. The CTA differs, so the queue has to show which.
 */
export type EngagementEmailType = 'next_step' | 'reconnect' | string;

/** Why the person surfaced: active 1-3 months ago, or gone for over a year. */
export type EngagementCohort = 'recent' | 'disconnected' | string;

/** `fallback` is the deterministic path taken when the AI draft could not run. */
export type EngagementAiProvider =
  | 'anthropic'
  | 'deterministic'
  | 'fallback'
  | string;

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

/** Which past host replies seeded the tone of an AI-drafted letter. */
export interface EngagementVoiceMeta {
  system?: boolean;
  tags?: string[];
  exampleIds?: string[];
}

export interface EngagementAiMeta {
  phase?: string;
  provider?: EngagementAiProvider;
  model?: string;
  subjectOptions?: string[];
  recommendedTone?: string;
  risks?: string[];
  personalizationFactsUsed?: string[];
  voice?: EngagementVoiceMeta;
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
  totalSpent?: number;
  totalSpentCurrency?: string;
  totalSpentByCurrency?: Record<string, number>;
  nightsStayed?: number;
  completedStaysCount?: number;
  eventsAttendedCount?: number;
  volunteerStaysCount?: number;
  hasVolunteered?: boolean;
  isResident?: boolean;
  paidTokenSalesCount?: number;
  donationCount?: number;
  webinarCount?: number;
  proposalVotesCount?: number;
  postsCount?: number;
  /** Ready-to-quote facts the outreach email is allowed to reference. */
  journeyHighlights?: string[];
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
  yearBucket?: string;
  emailType?: EngagementEmailType;
  cohort?: EngagementCohort;
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
  ctaLink?: string;
  ctaText?: string;
  hostBrief?: string | EngagementHostBriefLegacy;
  aiMeta?: EngagementAiMeta;
  cooldown?: Record<string, unknown>;
  created?: string;
  lastEvaluatedAt?: string;
  nextEligibleAt?: string;
  enrichmentCompletedAt?: string;
  approvedAt?: string;
  contactedAt?: string;
  /** Stamped whenever a row leaves the queue, including the 14-day sweep. */
  dismissedAt?: string;
  expiredAt?: string;
  engagementHistory?: EngagementHistoryEntry[];
}

export interface EngagementSampleEmailResults {
  subject?: string;
  body?: string;
  ctaLink?: string;
  ctaText?: string;
  hostBrief?: string;
  html?: string;
  aiMeta?: EngagementAiMeta;
}

export interface EngagementSampleEmailResponse {
  results?: EngagementSampleEmailResults;
}

export interface EngagementDraftFields {
  subject: string;
  body: string;
  ctaLink: string;
  ctaText: string;
  hostBrief: string;
}
