import dayjs from 'dayjs';

import type {
  Quest,
  QuestAward,
  QuestLeaderboardRow,
  QuestMe,
  QuestStatus,
  QuestTicketSource,
} from '../types/quest';
import { slugify } from './common';

/** Where the quest sits relative to now, regardless of its stored status. */
export type QuestPhase = 'upcoming' | 'open' | 'closed';

export type QuestListSection = 'live' | 'upcoming' | 'drafts' | 'past';

export const getQuestPhase = (quest: Quest): QuestPhase => {
  if (quest.status === 'locked' || quest.status === 'settled') return 'closed';
  const now = dayjs();
  if (quest.start && now.isBefore(dayjs(quest.start))) return 'upcoming';
  // end is exclusive: entries close there.
  if (quest.end && !now.isBefore(dayjs(quest.end))) return 'closed';
  return 'open';
};

/** List sections follow stored status; the clock only closes a live window. */
export const getQuestListSection = (quest: Quest): QuestListSection | null => {
  switch (quest.status) {
    case 'cancelled':
      return null;
    case 'draft':
      return 'drafts';
    case 'scheduled':
      return 'upcoming';
    case 'live':
      return getQuestPhase(quest) === 'closed' ? 'past' : 'live';
    default:
      return 'past';
  }
};

export const isQuestOpen = (quest: Quest): boolean =>
  quest.status === 'live' && getQuestPhase(quest) === 'open';

/** The moment a countdown should run towards, or null when there is none. */
export const getQuestCountdownTarget = (quest: Quest): string | null => {
  const phase = getQuestPhase(quest);
  if (phase === 'upcoming') return quest.start || null;
  if (phase === 'open') return quest.end || null;
  return null;
};

export const getQuestStatusTone = (
  status: QuestStatus,
): 'live' | 'upcoming' | 'closed' | 'cancelled' => {
  switch (status) {
    case 'live':
      return 'live';
    case 'draft':
    case 'scheduled':
      return 'upcoming';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'closed';
  }
};

export const getTicketSources = (quest: Quest): QuestTicketSource[] =>
  quest.raffleConfig?.ticketSources || [];

/** The ceiling a member can reach, respecting maxTicketsPerUser. */
export const getPotentialTickets = (quest: Quest): number => {
  const sourceTotal = getTicketSources(quest).reduce(
    (total, source) => total + (source.maxTickets || 0),
    0,
  );
  const cap = quest.raffleConfig?.maxTicketsPerUser;
  return cap ? Math.min(sourceTotal, cap) : sourceTotal;
};

export const getTicketsForSource = (
  me: QuestMe | null | undefined,
  sourceKey: string,
): number => me?.entry?.ticketsBySource?.[sourceKey] || 0;

export const getMyTicketCount = (me: QuestMe | null | undefined): number =>
  me?.entry?.ticketCount || 0;

/**
 * Odds come from the API when it has them; falling back to the ticket pot keeps
 * the number sensible while a leaderboard is still loading.
 */
export const formatOdds = (
  odds: number | null | undefined,
  myTickets: number,
  totalTickets: number | undefined,
): string | null => {
  const ratio =
    typeof odds === 'number'
      ? odds
      : totalTickets && totalTickets > 0
      ? myTickets / totalTickets
      : null;
  if (ratio === null || !Number.isFinite(ratio)) return null;
  const percent = ratio * 100;
  if (percent > 0 && percent < 0.1) return '<0.1%';
  return `${percent.toFixed(1)}%`;
};

export const getLeaderboardRowUser = (row: QuestLeaderboardRow) => ({
  _id: row.user?._id || row.userId,
  screenname: row.user?.screenname || row.screenname,
  slug: row.user?.slug || row.slug,
  photo: row.user?.photo || row.photo,
});

/** "1 + 0 + 3" — how a row's tickets were earned, in source order. */
export const getTicketBreakdown = (
  quest: Quest,
  ticketsBySource: Record<string, number> | undefined,
): string | null => {
  const sources = getTicketSources(quest);
  if (!sources.length || !ticketsBySource) return null;
  return sources.map((source) => ticketsBySource[source.key] || 0).join(' + ');
};

export const getRankedPrizeEntries = (
  quest: Quest,
): { rank: number; award: QuestAward }[] => {
  const ranked = quest.prize?.ranked;
  if (!ranked) return [];
  return Object.entries(ranked)
    .map(([rank, award]) => ({ rank: Number(rank), award }))
    .filter(({ rank }) => Number.isFinite(rank))
    .sort((a, b) => a.rank - b.rank);
};

export const getQuestDateRange = (quest: Quest): string => {
  const start = dayjs(quest.start);
  const end = dayjs(quest.end);
  if (!start.isValid() || !end.isValid()) return '';
  const sameYear = start.isSame(end, 'year');
  const format = sameYear ? 'MMM D' : 'MMM D, YYYY';
  return `${start.format(format)} – ${end.format('MMM D, YYYY')}`;
};

/** Loose enough to take next-intl's translator without fighting its key generics. */
type Translate = (key: any, values?: any) => string;

// 'carrots' is the legacy spelling of 'credits' still stored on old quests —
// both settle through the credits ledger and render identically.
const CURRENCY_LABELS: Record<string, string> = {
  credits: '🥕',
  carrots: '🥕',
};

/** Collapse the legacy quest prize currency into the canonical one. */
export const normalizeQuestCurrency = (cur: string): string =>
  cur === 'carrots' ? 'credits' : cur;

export const formatQuestCurrency = (val: number, cur: string): string => {
  const symbol = CURRENCY_LABELS[cur];
  return symbol ? `${val} ${symbol}` : `${val} ${cur}`;
};

/** One line describing what an award actually gives you. */
export const getAwardLabel = (
  award: QuestAward | undefined,
  t: Translate,
): string => {
  if (!award) return '';
  switch (award.kind) {
    case 'currency':
      return formatQuestCurrency(award.val, award.cur);
    case 'perk':
      return award.title;
    case 'credit':
      return t('quests_award_credit', { count: award.qty });
    default:
      return '';
  }
};

export const getAwardDescription = (
  award: QuestAward | undefined,
): string | null => {
  if (!award) return null;
  if (award.kind === 'perk') return award.description || null;
  return null;
};

/**
 * Members never see a ticket source's key — it is the internal handle the
 * backend aggregates against and the ticketsBySource map uses. Mint one from
 * the label,
 * keeping any key an existing source already carries so tickets already
 * awarded under it still line up.
 */
export const withTicketSourceKeys = <T extends { key?: string; label: string }>(
  sources: T[],
): (T & { key: string })[] => {
  const taken = new Set(
    sources.map((source) => source.key?.trim()).filter(Boolean) as string[],
  );
  return sources.map((source) => {
    const existing = source.key?.trim();
    if (existing) return { ...source, key: existing };
    const base =
      slugify(source.label)
        .replace(/-/g, '_')
        .replace(/^_+|_+$/g, '') || 'source';
    let key = base;
    let suffix = 2;
    while (taken.has(key)) {
      key = `${base}_${suffix}`;
      suffix += 1;
    }
    taken.add(key);
    return { ...source, key };
  });
};

/** Where a member goes to actually earn a ticket from a given source. */
export interface TicketSourceAction {
  href: string;
  labelKey: string;
  values?: Record<string, string>;
}

/**
 * A ticket source describes what the pipeline listens for; this turns that back
 * into somewhere a member can go and do it. Sources verified by hand have no
 * destination — those are submitted on the quest page itself.
 */
export interface TriggerActionOptions {
  eventsById?: Record<string, { slug?: string; name?: string }>;
  bookingToken?: string;
}

/**
 * Turns a trigger back into somewhere a member can go and cause it. `custom`
 * has no destination — that one is submitted on the quest page itself.
 */
export const getTriggerAction = (
  trigger: { event?: string; filter?: Record<string, unknown> } | undefined,
  { eventsById = {}, bookingToken }: TriggerActionOptions = {},
): TicketSourceAction | null => {
  const event = trigger?.event;
  if (!event || event === 'custom') return null;
  const source = { trigger } as QuestTicketSource;

  switch (event) {
    case 'booking.confirmed': {
      const eventId = source.trigger?.filter?.eventId as string | undefined;
      const linkedEvent = eventId ? eventsById[eventId] : undefined;
      if (linkedEvent?.slug) {
        return {
          href: `/events/${linkedEvent.slug}`,
          labelKey: 'quests_entry_cta_event',
          values: { name: linkedEvent.name || '' },
        };
      }
      return { href: '/events', labelKey: 'quests_entry_cta_events' };
    }
    case 'stay.completed':
      return { href: '/stay', labelKey: 'quests_entry_cta_stay' };
    case 'token.purchased': {
      const token =
        (source.trigger?.filter?.token as string | undefined) ||
        bookingToken ||
        '';
      return {
        href: '/token',
        labelKey: token
          ? 'quests_entry_cta_token'
          : 'quests_entry_cta_token_generic',
        ...(token ? { values: { token } } : {}),
      };
    }
    default:
      return null;
  }
};

/** Ticket sources verified by hand are submitted, not visited. */
export const getTicketSourceAction = (
  source: QuestTicketSource,
  options: TriggerActionOptions = {},
): TicketSourceAction | null => {
  if (source.verification !== 'automatic') return null;
  return getTriggerAction(source.trigger, options);
};

/** True when the backend counts the quest's actions rather than members submitting them. */
export const isQuestActionCounted = (quest: Quest): boolean => {
  if (quest.type !== 'singleAction') return false;
  const event = quest.actionConfig?.trigger?.event;
  return Boolean(event) && event !== 'custom';
};

/** Where a member goes to perform a counted singleAction quest's action. */
export const getQuestActionCta = (
  quest: Quest,
  options: TriggerActionOptions = {},
): TicketSourceAction | null => {
  if (!isQuestActionCounted(quest)) return null;
  return getTriggerAction(quest.actionConfig?.trigger, options);
};

/** The event ids a quest's triggers point at, for resolving their pages. */
export const getLinkedEventIds = (quest: Quest): string[] => {
  const ids = [
    ...getTicketSources(quest).map((source) => source.trigger?.filter?.eventId),
    quest.actionConfig?.trigger?.filter?.eventId,
  ].filter((id): id is string => typeof id === 'string' && id.length > 0);
  return [...new Set(ids)];
};

/**
 * On a singleAction quest the number that means something to a member is what
 * their actions have earned, not the abstract points behind the ranking. Only
 * a per-action currency award can be totalled this way — a perk or a credit has
 * no running total.
 */
export const getEarnedFromActions = (
  quest: Quest,
  me: QuestMe | null | undefined,
): { amount: number; cur: string } | null => {
  const award = quest.prize?.eachAction;
  if (!award || award.kind !== 'currency') return null;

  const actionCount = getVerifiedActionCount(quest, me);
  if (actionCount === null) return null;

  return { amount: actionCount * award.val, cur: award.cur };
};

/** The API reports the count directly when it can; points are the fallback. */
export const getVerifiedActionCount = (
  quest: Quest,
  me: QuestMe | null | undefined,
): number | null => {
  const entry = me?.entry;
  if (!entry) return null;
  if (typeof entry.actionCount === 'number') return entry.actionCount;

  const pointsPerAction = quest.actionConfig?.pointsPerAction;
  if (typeof entry.points === 'number' && pointsPerAction) {
    return Math.floor(entry.points / pointsPerAction);
  }
  return null;
};
