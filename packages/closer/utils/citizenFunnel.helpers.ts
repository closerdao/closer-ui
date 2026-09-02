import dayjs from 'dayjs';

import { CitizenshipConfig } from '../types/api';
import {
  CitizenApplicationStage,
  CitizenAtRiskEvaluation,
  CitizenAtRiskReason,
  CitizenFunnelTab,
  CitizenFunnelUserSignals,
  CitizenFunnelVouch,
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
const DEFAULT_NIGHTS_WEIGHT = 0.6;
const DEFAULT_TOKENS_WEIGHT = 0.4;
const DEFAULT_AT_RISK_MONTHS = 6;

export const computeMinVouches = (totalCitizens: number): number =>
  Math.max(1, Math.round(totalCitizens * 0.1));

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
  recommendedNightsWeight: number;
  recommendedTokensWeight: number;
  atRiskMonthsBeforeWindowEnd: number;
  presenceReminderMonths: number;
};

export const resolveCitizenshipFunnelConfig = (
  config: CitizenshipConfig | null | undefined,
  totalCitizens = 0,
): ResolvedCitizenshipFunnelConfig => ({
  tokensRequired: Number(config?.tokensRequired ?? DEFAULT_TOKENS_REQUIRED),
  minStayDuration: Number(
    config?.minVouchingStayDuration ?? DEFAULT_MIN_STAY,
  ),
  minVouches: computeMinVouches(totalCitizens),
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
    presenceStatus,
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

/**
 * Statuses that mean the guest was actually hosted, mirroring closer-api
 * `utils/bookingPresence.js` STAYED_STATUSES. The dashboard has to reproduce
 * the server's counting rules by hand: `/stays/nights/:userId` answers with a
 * lifetime total and takes no date range, and `/sum/booking/duration` sums one
 * user per request. Counting the same stays here keeps the window figure
 * comparable with the lifetime one the rest of the product shows.
 */
export const CITIZEN_PRESENCE_STATUSES = [
  'paid',
  'checked-in',
  'checked-out',
] as const;

/**
 * Stays that ended inside the maintenance window, for every citizen at once.
 * Reproduces getGuestNights' filters: only checked-in, ended, non-day-ticket
 * stays with a real duration count.
 */
export const buildWindowBookingsWhere = (
  userIds: string[],
  windowStart: Date,
  now: Date = new Date(),
) => ({
  createdBy: { $in: userIds },
  status: { $in: [...CITIZEN_PRESENCE_STATUSES] },
  checkedIn: { $exists: true, $ne: null },
  isDayTicket: { $ne: true },
  duration: { $gt: 0 },
  end: { $gte: windowStart.toISOString(), $lt: now.toISOString() },
});

/**
 * Nights per user from a flat list of bookings. Every requested id gets an
 * entry so a citizen with no qualifying stay reads as 0 rather than unknown —
 * the caller decides what "no booking data at all" means (see
 * `loadNightsByUser`).
 */
export const sumNightsByUser = (
  bookings: Array<{ createdBy?: unknown; duration?: unknown }> | null | undefined,
  userIds: string[],
): Record<string, number> => {
  const totals: Record<string, number> = {};
  userIds.forEach((id) => {
    totals[String(id)] = 0;
  });
  (bookings || []).forEach((booking) => {
    const userId = String(booking?.createdBy ?? '');
    if (!userId || !(userId in totals)) return;
    const duration = Number(booking?.duration);
    if (!Number.isFinite(duration) || duration <= 0) return;
    totals[userId] += duration;
  });
  return totals;
};

/**
 * `stats.all_time.presence` is the only nights field the API will accept.
 * `where` keys are checked against the user model's field list before the query
 * runs, and a top-level `presence` field does not exist there — so the legacy
 * `$or` fallback did not widen the query, it made the whole request 400.
 */
export const buildRecommendedWhere = (minNights: number) => ({
  roles: { $nin: ['member', 'citizen'] },
  'stats.all_time.presence': { $gte: minNights },
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

/**
 * `vouched` arrives as an Immutable List on the platform path and a plain array
 * from a raw API read, and each entry can itself be an Immutable Map.
 */
export const extractVouches = (user: any): CitizenFunnelVouch[] => {
  const raw = user?.vouched;
  const list =
    typeof raw?.toJS === 'function'
      ? raw.toJS()
      : typeof raw?.toArray === 'function'
      ? raw.toArray()
      : Array.isArray(raw)
      ? raw
      : [];
  return list.map((entry: any) => {
    const vouch = typeof entry?.toJS === 'function' ? entry.toJS() : entry;
    return {
      vouchedBy: vouch?.vouchedBy ?? null,
      vouchedAt: vouch?.vouchedAt ?? null,
      message: vouch?.message ?? null,
    };
  });
};

export const extractVouchCount = (user: any): number =>
  extractVouches(user).length;

/** `stats.wallet` holds the $TDF, $Presence and $Sweat balances. */
export const extractWalletBalance = (user: any, key: string): number =>
  Number(user?.stats?.wallet?.[key] ?? 0) || 0;

const toFiniteOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

  const vouches = extractVouches(user);

  return {
    userId: String(user?._id || ''),
    screenname: user?.screenname,
    slug: user?.slug,
    email: user?.email,
    photo: user?.photo ?? null,
    roles,
    created: user?.created ?? null,
    lastActive: user?.lastactive ?? null,
    citizenshipAppliedAt: user?.citizenship?.appliedAt ?? null,
    citizenshipStatus: user?.citizenship?.status ?? null,
    citizenshipWhy: user?.citizenship?.why ?? null,
    citizenshipDate: user?.citizenship?.date ?? null,
    citizenshipTokensToFinance: toFiniteOrNull(
      user?.citizenship?.tokensToFinance,
    ),
    citizenshipTotalToPayInFiat: toFiniteOrNull(
      user?.citizenship?.totalToPayInFiat,
    ),
    tokenBalance: extractTokenBalance(user),
    presenceBalance: extractWalletBalance(user, 'presence'),
    sweatBalance: extractWalletBalance(user, 'sweat'),
    walletAddress: user?.walletAddress ?? null,
    kycPassed: Boolean(user?.kycPassed),
    subscriptionPlan: user?.subscription?.plan ?? null,
    financedTokens: extras.financedTokens ?? 0,
    hasDelinquentFinancePlan: extras.hasDelinquentFinancePlan ?? false,
    totalNights,
    nightsInMaintenanceWindow: extras.nightsInMaintenanceWindow ?? null,
    vouchCount: vouches.length,
    vouches,
    votesInPrimaryWindow: extras.votesInPrimaryWindow ?? null,
    votesInAltWindow: extras.votesInAltWindow ?? null,
    minVouchesNeeded: extras.minVouchesNeeded,
  };
};

const proposalHasVoteBuckets = (proposal: {
  votes?: {
    yes?: unknown;
    no?: unknown;
    abstain?: unknown;
  };
}): boolean =>
  Array.isArray(proposal.votes?.yes) ||
  Array.isArray(proposal.votes?.no) ||
  Array.isArray(proposal.votes?.abstain);

export const countVotesForUserInWindow = (
  proposals:
    | Array<{
        votes?: {
          yes?: Array<{ userId?: string; votedAt?: string | Date }>;
          no?: Array<{ userId?: string; votedAt?: string | Date }>;
          abstain?: Array<{ userId?: string; votedAt?: string | Date }>;
        };
      }>
    | null
    | undefined,
  userId: string,
  windowYears: number,
  now: Date = new Date(),
): number | null => {
  if (!Array.isArray(proposals)) return null;
  if (proposals.length > 0 && !proposals.some(proposalHasVoteBuckets)) {
    return null;
  }
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
