export type QuestType = 'raffle' | 'singleAction';

export type QuestStatus =
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'locked'
  | 'settled'
  | 'cancelled';

export type QuestCategory =
  | 'tokenGrowth'
  | 'knowledge'
  | 'connection'
  | 'adoption';

export type QuestVerification = 'automatic' | 'admin' | string;

export type QuestActionStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'reversed';

export type QuestEntryStatus = 'active' | 'withdrawn' | 'disqualified';

export interface QuestCurrencyAward {
  kind: 'currency';
  cur: string;
  val: number;
}

export interface QuestPerkAward {
  kind: 'perk';
  type?: string;
  title: string;
  description?: string;
}

export interface QuestCreditAward {
  kind: 'credit';
  productId: string;
  qty: number;
}

export type QuestAward = QuestCurrencyAward | QuestPerkAward | QuestCreditAward;

export interface QuestPrize {
  /** Keyed by rank, contiguous from "1". */
  ranked?: Record<string, QuestAward>;
  eachAction?: QuestAward;
  participation?: QuestAward;
  notes?: string;
}

export interface QuestTicketSource {
  key: string;
  label: string;
  hint?: string;
  ticketsPerUnit: number;
  maxTickets: number;
  verification: QuestVerification;
  trigger?: {
    event: string;
    filter?: Record<string, unknown>;
  };
}

export interface QuestRaffleConfig {
  ticketSources: QuestTicketSource[];
  maxTicketsPerUser?: number;
  winnerCount: number;
  allowRepeatWinners?: boolean;
  drawMethod?: 'random' | 'externalSeed' | string;
  showLeaderboard?: boolean;
  leaderboardSize?: number;
}

export interface QuestActionConfig {
  actionLabel: string;
  proofType: 'url' | 'text' | 'image' | 'automatic' | string;
  proofPrompt?: string;
  maxActionsPerUser?: number;
  pointsPerAction?: number;
  requiresApproval?: boolean;
}

export interface QuestVisual {
  coverImage?: string;
  accentColor?: string;
  emoji?: string;
}

export interface QuestEligibility {
  minAccountAgeDays?: number;
  requiresVerifiedEmail?: boolean;
  excludeUserIds?: string[];
}

export interface QuestWinner {
  rank: number;
  userId: string;
  screenname?: string;
  slug?: string;
  photo?: string;
  ticketIndex?: number;
  award?: QuestAward;
}

export interface QuestResults {
  lockedAt?: string;
  ticketsHash?: string;
  drawSeed?: string;
  winners?: QuestWinner[];
  settledAt?: string;
}

export interface QuestStats {
  participantCount?: number;
  totalTickets?: number;
  totalActions?: number;
}

export interface Quest {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category?: QuestCategory;
  type: QuestType;
  status: QuestStatus;
  visual?: QuestVisual;
  start: string;
  /** Exclusive: entries close here. */
  end: string;
  timezone?: string;
  roleRequired?: string[];
  eligibility?: QuestEligibility;
  prize?: QuestPrize;
  raffleConfig?: QuestRaffleConfig;
  actionConfig?: QuestActionConfig;
  results?: QuestResults;
  stats?: QuestStats;
  created?: string;
  updated?: string;
}

/** A full QuestEntry row, as read over CRUD by a quest admin. */
export interface QuestEntry {
  _id: string;
  questId?: string;
  userId?: string;
  status: QuestEntryStatus;
  ticketCount?: number;
  ticketsBySource?: Record<string, number>;
  points?: number;
  actionCount?: number;
  joinedAt?: string;
  disqualifiedReason?: string;
  user?: {
    _id?: string;
    screenname?: string;
    slug?: string;
    photo?: string;
  };
}

export interface QuestEntrySummary {
  status: QuestEntryStatus;
  ticketCount?: number;
  ticketsBySource?: Record<string, number>;
  points?: number;
  actionCount?: number;
  joinedAt?: string;
}

/** GET /quest/:slug/me — derived, never stored on the quest. */
export interface QuestMe {
  entry?: QuestEntrySummary | null;
  pendingActions?: number;
  potentialTickets?: number;
  rank?: number | null;
  odds?: number | null;
}

export interface QuestLeaderboardRow {
  userId?: string;
  rank?: number;
  ticketCount?: number;
  points?: number;
  ticketsBySource?: Record<string, number>;
  joinedAt?: string;
  /** Set on the caller's row when they sit outside the visible top N. */
  pinned?: boolean;
  user?: {
    _id?: string;
    screenname?: string;
    slug?: string;
    photo?: string;
  };
  screenname?: string;
  slug?: string;
  photo?: string;
}

export interface QuestLeaderboard {
  top: QuestLeaderboardRow[];
  me?: QuestLeaderboardRow | null;
  totalParticipants?: number;
  totalTickets?: number;
}

export interface QuestActionProof {
  type: string;
  value: string;
}

export interface QuestAction {
  _id: string;
  questId?: string;
  entryId?: string;
  userId?: string;
  sourceKey?: string;
  status: QuestActionStatus;
  tickets?: number;
  points?: number;
  proof?: QuestActionProof;
  note?: string;
  sourceEvent?: {
    type?: string;
    refId?: string;
    occurredAt?: string;
  };
  reversedAfterLockAt?: string;
  created?: string;
  updated?: string;
}

/** What POST /quest/:slug/draw publishes. */
export interface QuestDrawResults {
  drawSeed?: string;
  ticketsHash?: string;
  winners?: QuestWinner[];
}

export interface QuestAuditTicket {
  userId: string;
  sourceKey?: string;
  actionId?: string;
  screenname?: string;
  slug?: string;
}

export interface QuestAudit {
  tickets?: QuestAuditTicket[];
  ticketsHash?: string;
  drawSeed?: string;
  winners?: QuestWinner[];
  /** The one-line rule a reader can use to re-run the draw themselves. */
  derivation?: string;
}
