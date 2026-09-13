export const CITIZEN_FUNNEL_TABS = [
  'applications',
  'citizens',
  'recommended',
  'config',
] as const;

export type CitizenFunnelTab = (typeof CITIZEN_FUNNEL_TABS)[number];

export const CITIZEN_FUNNEL_DEFAULT_TAB: CitizenFunnelTab = 'applications';

export const CITIZEN_APPLICATION_STAGES = [
  'applied',
  'presence',
  'tokens',
  'vouching',
  'ready',
] as const;

export type CitizenApplicationStage =
  (typeof CITIZEN_APPLICATION_STAGES)[number];

export type CitizenAtRiskReason =
  | 'presence'
  | 'tokens'
  | 'finance'
  | 'voting';

export type CitizenHealthFilter = 'all' | 'at-risk';

export type CitizenPresenceStatus = 'met' | 'on-track' | 'risk';

export type CitizenFunnelVouch = {
  vouchedBy?: string | null;
  vouchedAt?: string | Date | null;
  message?: string | null;
};

export type CitizenFunnelUserSignals = {
  userId: string;
  screenname?: string;
  slug?: string;
  email?: string;
  photo?: string | null;
  roles: string[];
  created?: string | Date | null;
  lastActive?: string | Date | null;
  citizenshipAppliedAt?: string | Date | null;
  citizenshipStatus?: string | null;
  citizenshipWhy?: string | null;
  citizenshipDate?: string | Date | null;
  /** Financing figures the applicant committed to, from `citizenship.*`. */
  citizenshipTokensToFinance: number | null;
  citizenshipTotalToPayInFiat: number | null;
  tokenBalance: number;
  /** The other two `stats.wallet` balances the admin user list surfaces. */
  presenceBalance: number;
  sweatBalance: number;
  walletAddress?: string | null;
  kycPassed: boolean;
  subscriptionPlan?: string | null;
  financedTokens: number;
  hasDelinquentFinancePlan: boolean;
  totalNights: number | null;
  nightsInMaintenanceWindow: number | null;
  vouchCount: number;
  vouches: CitizenFunnelVouch[];
  votesInPrimaryWindow: number | null;
  votesInAltWindow: number | null;
  minVouchesNeeded?: number;
};

export type CitizenAtRiskEvaluation = {
  isAtRisk: boolean;
  isFoundingCitizen: boolean;
  reasons: CitizenAtRiskReason[];
  tokensHeldOrFinanced: number;
  nightsInWindow: number | null;
  meetsPresence: boolean | null;
  meetsTokens: boolean | null;
  meetsVoting: boolean | null;
  meetsFinance: boolean;
  presenceStatus: CitizenPresenceStatus;
};

export type CitizenRecommendedScore = {
  nightsProgress: number;
  tokensProgress: number;
  score: number;
  nights: number;
  tokens: number;
  nightsRequired: number;
  tokensRequired: number;
  nightsShort: number;
  tokensShort: number;
};
