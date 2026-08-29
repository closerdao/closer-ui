export const CITIZEN_FUNNEL_TABS = [
  'applications',
  'citizens',
  'recommended',
] as const;

export type CitizenFunnelTab = (typeof CITIZEN_FUNNEL_TABS)[number];

export const CITIZEN_FUNNEL_DEFAULT_TAB: CitizenFunnelTab = 'applications';

export type CitizenAtRiskReason =
  | 'presence'
  | 'tokens'
  | 'finance'
  | 'voting';

export type CitizenHealthFilter = 'all' | 'at-risk' | 'healthy';

export type CitizenFunnelUserSignals = {
  userId: string;
  screenname?: string;
  slug?: string;
  email?: string;
  photo?: string | null;
  roles: string[];
  created?: string | Date | null;
  citizenshipAppliedAt?: string | Date | null;
  citizenshipStatus?: string | null;
  citizenshipWhy?: string | null;
  citizenshipDate?: string | Date | null;
  tokenBalance: number;
  financedTokens: number;
  hasDelinquentFinancePlan: boolean;
  totalNights: number | null;
  nightsInMaintenanceWindow: number | null;
  vouchCount: number;
  votesInPrimaryWindow: number | null;
  votesInAltWindow: number | null;
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
};

export type CitizenRecommendedScore = {
  nightsProgress: number;
  tokensProgress: number;
  score: number;
  nights: number;
  tokens: number;
  nightsRequired: number;
  tokensRequired: number;
};
