import type { NextApiRequest } from 'next';

import type {
  Quest,
  QuestAction,
  QuestActionProof,
  QuestActionStatus,
  QuestAudit,
  QuestAward,
  QuestDrawResults,
  QuestEntry,
  QuestLeaderboard,
  QuestMe,
  QuestStatus,
} from '../types/quest';
import api, { formatSearch, invalidateGetCache } from './api';
import { getBearerAuthHeaders } from './authHeaders.helpers';
import { normalizeQuestCurrency } from './quests.helpers';

type RequestOptions = {
  /** Pass the incoming request when calling from getInitialProps / SSR. */
  req?: NextApiRequest;
};

const withHeaders = ({ req }: RequestOptions = {}) => {
  const headers = getBearerAuthHeaders(req);
  return headers ? { headers } : {};
};

/**
 * Client GETs are cached for five minutes. Anything that moves while a member
 * watches — their entry, the standings, an action queue — has to skip that, and
 * anything that writes has to drop what it invalidated.
 */
const noCache = { cache: false } as const;

const invalidateQuestReads = () => invalidateGetCache('/quest');

/**
 * Quests created before the credits rename still store prize currency as
 * "carrots". Collapse it here so everything past the API boundary only ever
 * sees "credits"; writes always send "credits".
 */
const normalizeAward = (award: QuestAward): QuestAward =>
  award.kind === 'currency'
    ? { ...award, cur: normalizeQuestCurrency(award.cur) }
    : award;

const normalizeQuest = (quest: Quest): Quest => {
  const prize = quest.prize;
  if (!prize) return quest;
  return {
    ...quest,
    prize: {
      ...prize,
      ...(prize.eachAction
        ? { eachAction: normalizeAward(prize.eachAction) }
        : {}),
      ...(prize.participation
        ? { participation: normalizeAward(prize.participation) }
        : {}),
      ...(prize.ranked
        ? {
            ranked: Object.fromEntries(
              Object.entries(prize.ranked).map(([rank, award]) => [
                rank,
                normalizeAward(award),
              ]),
            ),
          }
        : {}),
    },
  };
};

export interface GetQuestsParams extends RequestOptions {
  /** Skip the client GET cache — use after a write, or when polling. */
  force?: boolean;
  status?: QuestStatus | QuestStatus[];
  category?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  where?: Record<string, unknown>;
}

/**
 * Quests are a standard CRUD model, so this is the usual
 * where/limit/page/sort_by query.
 */
export const getQuests = async ({
  status,
  category,
  limit = 50,
  page,
  sortBy = '-start',
  where,
  force,
  req,
}: GetQuestsParams = {}): Promise<Quest[]> => {
  const filter: Record<string, unknown> = { ...where };
  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }
  if (category) {
    filter.category = category;
  }
  const res = await api.get('/quest', {
    params: {
      where: formatSearch(filter),
      limit,
      sort_by: sortBy,
      ...(page ? { page } : {}),
    },
    ...(force ? noCache : {}),
    ...withHeaders({ req }),
  });
  return (res?.data?.results || []).map(normalizeQuest);
};

/** :slug accepts a slug or an ObjectId on every quest route. */
export const getQuest = async (
  slug: string,
  { force, ...options }: RequestOptions & { force?: boolean } = {},
): Promise<Quest | null> => {
  const res = await api.get(`/quest/${slug}`, {
    ...(force ? noCache : {}),
    ...withHeaders(options),
  });
  const quest = res?.data?.results;
  return quest ? normalizeQuest(quest) : null;
};

/** The caller's derived view: tickets, rank, odds, pending actions. */
export const getQuestMe = async (
  slug: string,
  options: RequestOptions = {},
): Promise<QuestMe | null> => {
  const res = await api.get(`/quest/${slug}/me`, {
    ...noCache,
    ...withHeaders(options),
  });
  return res?.data?.results || null;
};

export const getQuestLeaderboard = async (
  slug: string,
  {
    limit,
    includeMe = true,
    ...options
  }: RequestOptions & { limit?: number; includeMe?: boolean } = {},
): Promise<QuestLeaderboard | null> => {
  const res = await api.get(`/quest/${slug}/leaderboard`, {
    params: {
      ...(limit ? { limit } : {}),
      ...(includeMe ? {} : { includeMe: false }),
    },
    ...noCache,
    ...withHeaders(options),
  });
  return res?.data?.results || null;
};

/*
 * There is no join or withdraw wrapper on purpose: members are entered
 * automatically once they qualify, and `…/action` auto-joins whoever submits
 * one, so nothing in the UI ever calls those routes.
 */

/** Submit an action by hand. Auto-joins the caller first. */
export const submitQuestAction = async (
  slug: string,
  { sourceKey, proof }: { sourceKey?: string; proof?: QuestActionProof } = {},
): Promise<QuestAction | null> => {
  const res = await api.post(`/quest/${slug}/action`, {
    ...(sourceKey ? { sourceKey } : {}),
    ...(proof ? { proof } : {}),
  });
  invalidateQuestReads();
  return res?.data?.results || null;
};

/** A member's own action history — standard CRUD, scoped to them. */
export const getMyQuestActions = async (
  questId: string,
  options: RequestOptions = {},
): Promise<QuestAction[]> => {
  const res = await api.get('/questaction', {
    params: {
      where: formatSearch({ questId }),
      limit: 100,
      sort_by: '-created',
    },
    ...noCache,
    ...withHeaders(options),
  });
  return res?.data?.results || [];
};

/**
 * Winners come back as ids, so the UI has to put names and faces to them.
 */
export const getQuestUsers = async (
  ids: string[],
  options: RequestOptions = {},
): Promise<
  { _id: string; screenname?: string; slug?: string; photo?: string }[]
> => {
  if (!ids.length) return [];
  const res = await api.get('/user', {
    params: {
      where: formatSearch({ _id: { $in: ids } }),
      limit: ids.length,
    },
    ...withHeaders(options),
  });
  return res?.data?.results || [];
};

/** Public once the quest is locked — 409 before that. */
export const getQuestAudit = async (
  slug: string,
  options: RequestOptions = {},
): Promise<QuestAudit | null> => {
  const res = await api.get(`/quest/${slug}/audit`, withHeaders(options));
  return res?.data?.results || null;
};

/**
 * Quests use the standard CRUD routes — there is no bespoke quest create.
 * Integrity rules (window, config shape, prize ranks) are enforced server-side.
 */
export const createQuest = async (
  payload: Partial<Quest>,
): Promise<Quest | null> => {
  const res = await api.post('/quest', payload);
  invalidateQuestReads();
  const quest = res?.data?.results;
  return quest ? normalizeQuest(quest) : null;
};

/**
 * PATCH by slug. Once a quest leaves draft/scheduled the server freezes type,
 * window, prize and configs, so only copy and visuals get through.
 */
export const updateQuest = async (
  slug: string,
  payload: Partial<Quest>,
): Promise<Quest | null> => {
  const res = await api.patch(`/quest/${slug}`, payload);
  invalidateQuestReads();
  const quest = res?.data?.results;
  return quest ? normalizeQuest(quest) : null;
};

/** Only allowed while the quest is still draft/scheduled — cancel it otherwise. */
export const deleteQuest = async (id: string): Promise<void> => {
  await api.delete(`/quest/${id}`);
  invalidateQuestReads();
};

/* ── Admin: reviewing what members submitted ─────────────────────────── */

/**
 * Actions default to private visibility, so this returns the caller's own for
 * a member and every entrant's for a quest admin.
 */
export const getQuestActions = async (
  questId: string,
  {
    status,
    limit = 100,
    ...options
  }: RequestOptions & { status?: QuestActionStatus; limit?: number } = {},
): Promise<QuestAction[]> => {
  const res = await api.get('/questaction', {
    params: {
      where: formatSearch({ questId, ...(status ? { status } : {}) }),
      limit,
      sort_by: '-created',
    },
    ...noCache,
    ...withHeaders(options),
  });
  return res?.data?.results || [];
};

export const getQuestEntries = async (
  questId: string,
  { limit = 200, ...options }: RequestOptions & { limit?: number } = {},
): Promise<QuestEntry[]> => {
  const res = await api.get('/questentry', {
    params: {
      where: formatSearch({ questId }),
      limit,
      sort_by: '-ticketCount',
    },
    ...noCache,
    ...withHeaders(options),
  });
  return res?.data?.results || [];
};

/**
 * Ticket caps are re-applied here, not just at submission — the member may have
 * filled the source from another action while this one waited.
 */
export const verifyQuestAction = async (
  slug: string,
  actionId: string,
  { decision, note }: { decision: 'verified' | 'rejected'; note?: string },
): Promise<QuestAction | null> => {
  const res = await api.post(`/quest/${slug}/action/${actionId}/verify`, {
    decision,
    ...(note ? { note } : {}),
  });
  invalidateQuestReads();
  return res?.data?.results || null;
};

export const disqualifyQuestEntry = async (
  slug: string,
  entryId: string,
  reason: string,
): Promise<QuestEntry | null> => {
  const res = await api.post(`/quest/${slug}/entry/${entryId}/disqualify`, {
    reason,
  });
  invalidateQuestReads();
  return res?.data?.results || null;
};

/**
 * status moves one step at a time along draft → scheduled → live, so taking a
 * draft live means walking it rather than jumping. Each step is a plain PATCH;
 * the model's hooks reject anything that skips ahead.
 */
export const publishQuest = async (
  slug: string,
  currentStatus: QuestStatus,
): Promise<Quest | null> => {
  const path: QuestStatus[] = ['draft', 'scheduled', 'live'];
  const from = path.indexOf(currentStatus);
  if (from === -1 || currentStatus === 'live') return null;

  let quest: Quest | null = null;
  for (const status of path.slice(from + 1)) {
    quest = await updateQuest(slug, { status });
  }
  return quest;
};

/* ── Admin: the lifecycle that closes a quest out ────────────────────── */

/**
 * Freezes the ticket set and publishes its hash. Refuses while `end` is still
 * in the future unless forced, and refuses a raffle with no tickets.
 */
export const lockQuest = async (
  slug: string,
  { force }: { force?: boolean } = {},
): Promise<Quest | null> => {
  const res = await api.post(`/quest/${slug}/lock`, force ? { force } : {});
  invalidateQuestReads();
  const quest = res?.data?.results;
  return quest ? normalizeQuest(quest) : null;
};

/**
 * Requires a locked quest. `seed` is required when drawMethod is externalSeed;
 * otherwise the server generates and records one. Idempotent.
 */
export const drawQuest = async (
  slug: string,
  { seed }: { seed?: string } = {},
): Promise<QuestDrawResults | null> => {
  const res = await api.post(`/quest/${slug}/draw`, seed ? { seed } : {});
  invalidateQuestReads();
  return res?.data?.results || null;
};

/** Re-running settle retries only what failed; anything paid is left alone. */
export const settleQuest = async (slug: string): Promise<Quest | null> => {
  const res = await api.post(`/quest/${slug}/settle`);
  invalidateQuestReads();
  const quest = res?.data?.results;
  return quest ? normalizeQuest(quest) : null;
};
