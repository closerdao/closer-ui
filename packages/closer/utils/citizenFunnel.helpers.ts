import dayjs from 'dayjs';

import { CitizenshipConfig } from '../types/api';
import {
  CitizenApplicationStage,
  CitizenAtRiskEvaluation,
  CitizenAtRiskReason,
  CitizenFunnelTab,
  CitizenFunnelUserSignals,
  CitizenPresenceStatus,
  CitizenRecommendedScore,
  CITIZEN_APPLICATION_STAGES,
  CITIZEN_FUNNEL_DEFAULT_TAB,
  CITIZEN_FUNNEL_TABS,
} from '../types/citizenFunnel';

export const CITIZEN_FUNNEL_LIST_LIMIT = 50;

const DEFAULT_TOKENS_REQUIRED = 30;
const DEFAULT_MIN_STAY = 14;
const DEFAULT_MAINTENANCE_NIGHTS = 28;
const DEFAULT_MAINTENANCE_NIGHTS_YEARS = 2;
const DEFAULT_MIN_VOTES = 1;
const DEFAULT_VOTE_YEARS = 1;
const DEFAULT_ALT_MIN_VOTES = 3;
const DEFAULT_ALT_VOTE_YEARS = 3;
const DEFAULT_FOUNDING_CUTOFF = '2024-12-18';
const DEFAULT_RECOMMENDED_LIMIT = 50;
const DEFAULT_RECOMMENDED_MIN_NIGHTS = 7;
const DEFAULT_READINESS_THRESHOLD = 0.6;
const DEFAULT_NIGHTS_WEIGHT = 0.6;
const DEFAULT_TOKENS_WEIGHT = 0.4;
const DEFAULT_AT_RISK_MONTHS = 6;
const DEFAULT_MIN_VOUCHES = 3;

export const isCitizenFunnelTab = (value: string): value is CitizenFunnelTab =>
  (CITIZEN_FUNNEL_TABS as readonly string[]).includes(value);

export const citizenFunnelTabPath = (tab: CitizenFunnelTab): string =>
  `/dashboard/citizens/${tab}`;

export const resolveCitizenFunnelTab = (
  value: string | string[] | undefined,
): CitizenFunnelTab => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && isCitizenFunnelTab(raw)) return raw;
  return CITIZEN_FUNNEL_DEFAULT_TAB;
};

export type ResolvedCitizenshipFunnelConfig = {
  tokensRequired: number;
  minStayDuration: number;
  minVouches: number;
  maintenanceMinNights: number;
  maintenanceNightsWindowYears: number;
  maintenanceMinVotes: number;
  maintenanceVoteWindowYears: number;
  maintenanceAltMinVotes: number;
  maintenanceAltVoteWindowYears: number;
  foundingCitizenCutoffDate: string;
  funnelRecommendedLimit: number;
  funnelRecommendedMinNights: number;
  recommendedReadinessThreshold: number;
  recommendedNightsWeight: number;
  recommendedTokensWeight: number;
  atRiskMonthsBeforeWindowEnd: number;
  presenceReminderMonths: number;
};

export const resolveCitizenshipFunnelConfig = (
  config: CitizenshipConfig | null | undefined,
): ResolvedCitizenshipFunnelConfig => ({
  tokensRequired: Number(config?.tokensRequired ?? DEFAULT_TOKENS_REQUIRED),
  minStayDuration: Number(
    config?.minVouchingStayDuration ?? DEFAULT_MIN_STAY,
  ),
  minVouches: Number(config?.minVouches ?? DEFAULT_MIN_VOUCHES),
  maintenanceMinNights: Number(
    config?.maintenanceMinNights ?? DEFAULT_MAINTENANCE_NIGHTS,
  ),
  maintenanceNightsWindowYears: Number(
    config?.maintenanceNightsWindowYears ?? DEFAULT_MAINTENANCE_NIGHTS_YEARS,
  ),
  maintenanceMinVotes: Number(
    config?.maintenanceMinVotes ?? DEFAULT_MIN_VOTES,
  ),
  maintenanceVoteWindowYears: Number(
    config?.maintenanceVoteWindowYears ?? DEFAULT_VOTE_YEARS,
  ),
  maintenanceAltMinVotes: Number(
    config?.maintenanceAltMinVotes ?? DEFAULT_ALT_MIN_VOTES,
  ),
  maintenanceAltVoteWindowYears: Number(
    config?.maintenanceAltVoteWindowYears ?? DEFAULT_ALT_VOTE_YEARS,
  ),
  foundingCitizenCutoffDate:
    config?.foundingCitizenCutoffDate || DEFAULT_FOUNDING_CUTOFF,
  funnelRecommendedLimit: Number(
    config?.funnelRecommendedLimit ?? DEFAULT_RECOMMENDED_LIMIT,
  ),
  funnelRecommendedMinNights: Number(
    config?.funnelRecommendedMinNights ?? DEFAULT_RECOMMENDED_MIN_NIGHTS,
  ),
  recommendedReadinessThreshold: Number(
    config?.recommendedReadinessThreshold ?? DEFAULT_READINESS_THRESHOLD,
  ),
  recommendedNightsWeight: Number(
    config?.recommendedNightsWeight ?? DEFAULT_NIGHTS_WEIGHT,
  ),
  recommendedTokensWeight: Number(
    config?.recommendedTokensWeight ?? DEFAULT_TOKENS_WEIGHT,
  ),
  atRiskMonthsBeforeWindowEnd: Number(
    config?.atRiskMonthsBeforeWindowEnd ??
      config?.presenceReminderMonths ??
      DEFAULT_AT_RISK_MONTHS,
  ),
  presenceReminderMonths: Number(
    config?.presenceReminderMonths ?? DEFAULT_AT_RISK_MONTHS,
  ),
});

export const isCitizenRole = (roles: string[] | undefined): boolean =>
  Boolean(roles?.includes('member') || roles?.includes('citizen'));

export const hasCitizenshipApplicationInProgress = (user: {
  roles?: string[];
  citizenship?: {
    why?: string | null;
    status?: string | null;
    appliedAt?: string | Date | null;
  } | null;
}): boolean => {
  if (isCitizenRole(user.roles)) return false;
  return Boolean(
    user.citizenship?.why ||
      user.citizenship?.status ||
      user.citizenship?.appliedAt,
  );
};

export const isFoundingCitizen = (
  signals: Pick<
    CitizenFunnelUserSignals,
    'created' | 'citizenshipDate' | 'citizenshipAppliedAt'
  >,
  cutoffDate: string,
): boolean => {
  const cutoff = dayjs(cutoffDate);
  if (!cutoff.isValid()) return false;
  const candidate =
    signals.citizenshipDate ||
    signals.citizenshipAppliedAt ||
    signals.created;
  if (!candidate) return false;
  const when = dayjs(candidate);
  if (!when.isValid()) return false;
  return when.isBefore(cutoff, 'day') || when.isSame(cutoff, 'day');
};

export const evaluateCitizenVoting = (
  votesInPrimaryWindow: number | null,
  votesInAltWindow: number | null,
  config: Pick<
    ResolvedCitizenshipFunnelConfig,
    'maintenanceMinVotes' | 'maintenanceAltMinVotes'
  >,
): boolean | null => {
  if (votesInPrimaryWindow === null && votesInAltWindow === null) {
    return null;
  }
  const primaryOk =
    votesInPrimaryWindow !== null &&
    votesInPrimaryWindow >= config.maintenanceMinVotes;
  const altOk =
    votesInAltWindow !== null &&
    votesInAltWindow >= config.maintenanceAltMinVotes;
  if (votesInPrimaryWindow === null) return altOk;
  if (votesInAltWindow === null) return primaryOk;
  return primaryOk || altOk;
};

export const derivePresenceStatus = (
  nightsInWindow: number | null,
  minNights: number,
  nightsProgressFallback?: number | null,
): CitizenPresenceStatus => {
  if (nightsInWindow === null) {
    if (
      nightsProgressFallback !== null &&
      nightsProgressFallback !== undefined
    ) {
      if (nightsProgressFallback >= minNights) return 'met';
      if (nightsProgressFallback >= minNights * 0.5) return 'on-track';
      return 'risk';
    }
    return 'on-track';
  }
  if (nightsInWindow >= minNights) return 'met';
  if (nightsInWindow >= minNights * 0.5) return 'on-track';
  return 'risk';
};

export const evaluateCitizenAtRisk = (
  signals: CitizenFunnelUserSignals,
  config: ResolvedCitizenshipFunnelConfig,
): CitizenAtRiskEvaluation => {
  const founding = isFoundingCitizen(signals, config.foundingCitizenCutoffDate);
  const tokensHeldOrFinanced =
    Number(signals.tokenBalance || 0) + Number(signals.financedTokens || 0);
  const meetsTokens = founding
    ? true
    : tokensHeldOrFinanced >= config.tokensRequired;
  const meetsFinance = !signals.hasDelinquentFinancePlan;

  const nightsInWindow = signals.nightsInMaintenanceWindow;
  const meetsPresence =
    nightsInWindow === null
      ? null
      : nightsInWindow >= config.maintenanceMinNights;

  const meetsVoting = evaluateCitizenVoting(
    signals.votesInPrimaryWindow,
    signals.votesInAltWindow,
    config,
  );

  const presenceStatus = derivePresenceStatus(
    nightsInWindow,
    config.maintenanceMinNights,
    null,
  );

  const reasons: CitizenAtRiskReason[] = [];
  if (meetsPresence === false) reasons.push('presence');
  if (meetsTokens === false) reasons.push('tokens');
  if (!meetsFinance) reasons.push('finance');
  if (meetsVoting === false) reasons.push('voting');

  return {
    isAtRisk: reasons.length > 0,
    isFoundingCitizen: founding,
    reasons,
    tokensHeldOrFinanced,
    nightsInWindow,
    meetsPresence,
    meetsTokens,
    meetsVoting,
    meetsFinance,
    presenceStatus:
      nightsInWindow === null && signals.totalNights !== null
        ? derivePresenceStatus(
            null,
            config.maintenanceMinNights,
            signals.totalNights,
          )
        : presenceStatus,
  };
};

export const deriveApplicationStage = (
  signals: CitizenFunnelUserSignals,
  config: Pick<
    ResolvedCitizenshipFunnelConfig,
    'minStayDuration' | 'tokensRequired' | 'minVouches'
  >,
): CitizenApplicationStage => {
  const nights = signals.totalNights ?? 0;
  const tokens = signals.tokenBalance + signals.financedTokens;
  const minVouches = Math.max(
    1,
    signals.minVouchesNeeded ?? config.minVouches,
  );
  const hasPresence = nights >= config.minStayDuration;
  const hasTokens = tokens >= config.tokensRequired;
  const hasVouches = signals.vouchCount >= minVouches;

  if (hasPresence && hasTokens && hasVouches) return 'ready';
  if (hasPresence && hasTokens) return 'vouching';
  if (hasPresence) return 'tokens';
  if (nights > 0 || tokens > 0) return 'presence';
  return 'applied';
};

export const scoreCitizenRecommendation = (
  nights: number,
  tokens: number,
  nightsRequired: number,
  tokensRequired: number,
  nightsWeight = DEFAULT_NIGHTS_WEIGHT,
  tokensWeight = DEFAULT_TOKENS_WEIGHT,
): CitizenRecommendedScore => {
  const safeNightsRequired = nightsRequired > 0 ? nightsRequired : 1;
  const safeTokensRequired = tokensRequired > 0 ? tokensRequired : 1;
  const weightSum = nightsWeight + tokensWeight;
  const nWeight = weightSum > 0 ? nightsWeight / weightSum : 0.5;
  const tWeight = weightSum > 0 ? tokensWeight / weightSum : 0.5;
  const nightsProgress = Math.min(1, Math.max(0, nights / safeNightsRequired));
  const tokensProgress = Math.min(1, Math.max(0, tokens / safeTokensRequired));
  return {
    nightsProgress,
    tokensProgress,
    score: nightsProgress * nWeight + tokensProgress * tWeight,
    nights,
    tokens,
    nightsRequired: safeNightsRequired,
    tokensRequired: safeTokensRequired,
    nightsShort: Math.max(0, safeNightsRequired - nights),
    tokensShort: Math.max(0, safeTokensRequired - tokens),
  };
};

export const buildApplicationsWhere = () => ({
  $and: [
    { roles: { $nin: ['member', 'citizen'] } },
    {
      $or: [
        { 'citizenship.appliedAt': { $exists: true } },
        { 'citizenship.why': { $exists: true, $ne: '' } },
        { 'citizenship.status': { $exists: true } },
      ],
    },
  ],
});

export const buildCitizensWhere = () => ({
  roles: { $in: ['member', 'citizen'] },
});

export const buildRecommendedWhere = (minNights: number) => ({
  roles: { $nin: ['member', 'citizen'] },
  $or: [
    { 'stats.all_time.presence': { $gte: minNights } },
    { presence: { $gte: minNights } },
    { 'stats.presence.totalNights': { $gte: minNights } },
  ],
});

export const extractTokenBalance = (user: any): number => {
  const wallet = user?.stats?.wallet;
  return (
    Number(wallet?.tdf ?? wallet?.TDF ?? user?.tokenBalance ?? 0) || 0
  );
};

export const extractTotalNights = (user: any): number => {
  return (
    Number(
      user?.stats?.all_time?.presence ??
        user?.stats?.presence?.totalNights ??
        user?.presence ??
        0,
    ) || 0
  );
};

export const extractVouchCount = (user: any): number => {
  const raw = user?.vouched;
  if (!raw) return 0;
  if (typeof raw.toArray === 'function') return raw.toArray().length;
  if (Array.isArray(raw)) return raw.length;
  return 0;
};

export const mapUserToFunnelSignals = (
  user: any,
  extras: Partial<
    Pick<
      CitizenFunnelUserSignals,
      | 'financedTokens'
      | 'hasDelinquentFinancePlan'
      | 'nightsInMaintenanceWindow'
      | 'votesInPrimaryWindow'
      | 'votesInAltWindow'
      | 'totalNights'
      | 'minVouchesNeeded'
    >
  > = {},
): CitizenFunnelUserSignals => {
  const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  const totalNights =
    extras.totalNights !== undefined
      ? extras.totalNights
      : extractTotalNights(user);

  return {
    userId: String(user?._id || ''),
    screenname: user?.screenname,
    slug: user?.slug,
    email: user?.email,
    photo: user?.photo ?? null,
    roles,
    created: user?.created ?? null,
    citizenshipAppliedAt: user?.citizenship?.appliedAt ?? null,
    citizenshipStatus: user?.citizenship?.status ?? null,
    citizenshipWhy: user?.citizenship?.why ?? null,
    citizenshipDate: user?.citizenship?.date ?? null,
    tokenBalance: extractTokenBalance(user),
    financedTokens: extras.financedTokens ?? 0,
    hasDelinquentFinancePlan: extras.hasDelinquentFinancePlan ?? false,
    totalNights,
    nightsInMaintenanceWindow: extras.nightsInMaintenanceWindow ?? null,
    vouchCount: extractVouchCount(user),
    votesInPrimaryWindow: extras.votesInPrimaryWindow ?? null,
    votesInAltWindow: extras.votesInAltWindow ?? null,
    minVouchesNeeded: extras.minVouchesNeeded,
  };
};

export const countVotesForUserInWindow = (
  proposals: Array<{
    votes?: {
      yes?: Array<{ userId?: string; votedAt?: string | Date }>;
      no?: Array<{ userId?: string; votedAt?: string | Date }>;
      abstain?: Array<{ userId?: string; votedAt?: string | Date }>;
    };
  }>,
  userId: string,
  windowYears: number,
  now: Date = new Date(),
): number => {
  const since = dayjs(now).subtract(windowYears, 'year');
  let count = 0;
  for (const proposal of proposals) {
    const buckets = [
      ...(proposal.votes?.yes || []),
      ...(proposal.votes?.no || []),
      ...(proposal.votes?.abstain || []),
    ];
    const voted = buckets.some((vote) => {
      if (String(vote.userId) !== String(userId)) return false;
      if (!vote.votedAt) return true;
      const when = dayjs(vote.votedAt);
      return when.isValid() && (when.isAfter(since) || when.isSame(since));
    });
    if (voted) count += 1;
  }
  return count;
};

export const sortRecommendedByScore = <
  T extends { score: number; nights: number; tokens: number },
>(
  rows: T[],
): T[] =>
  [...rows].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.nights !== a.nights) return b.nights - a.nights;
    return b.tokens - a.tokens;
  });

export const countStages = (
  rows: CitizenFunnelUserSignals[],
  config: Pick<
    ResolvedCitizenshipFunnelConfig,
    'minStayDuration' | 'tokensRequired' | 'minVouches'
  >,
): Record<CitizenApplicationStage | 'citizen', number> => {
  const counts = CITIZEN_APPLICATION_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = 0;
      return acc;
    },
    { citizen: 0 } as Record<CitizenApplicationStage | 'citizen', number>,
  );
  rows.forEach((signals) => {
    const stage = deriveApplicationStage(signals, config);
    counts[stage] += 1;
  });
  return counts;
};

export { CITIZEN_APPLICATION_STAGES };
