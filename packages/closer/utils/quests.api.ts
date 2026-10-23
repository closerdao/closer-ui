import type { NextApiRequest } from 'next';

import type {
  Quest,
  QuestAction,
  QuestActionProof,
  QuestActionStatus,
  QuestAudit,
  QuestAward,
  QuestEntry,
  QuestLeaderboard,
  QuestMe,
  QuestStatus,
} from '../types/quest';
import api, { formatSearch, invalidateGetCache } from './api';
import { getBearerAuthHeaders, getBearerToken } from './authHeaders.helpers';
import { normalizeQuestCurrency } from './quests.helpers';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
  trpcFor,
} from './trpc';
import { fetchUsers } from './users';

type ListInput = Exclude<
  Parameters<typeof trpc.quest.list.query>[0],
  void | undefined
>;
type CreateInput = Parameters<typeof trpc.quest.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.quest.update.mutate>[0]['data'];
type ActionStatus = Parameters<typeof trpc.quest.actions.query>[0]['status'];

type RequestOptions = {
  /** Pass the incoming request when calling from getInitialProps / SSR. */
  req?: NextApiRequest;
};

const withHeaders = ({ req }: RequestOptions = {}) => {
  const headers = getBearerAuthHeaders(req);
  return headers ? { headers } : {};
};

// A server render gets its own client with the cookie token; the browser's shared one cannot see it.
const clientFor = ({ req }: RequestOptions = {}) =>
  req ? trpcFor(getBearerToken(req)) : trpc;

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
  category?: ListInput['category'];
  limit?: number;
  page?: number;
  sortBy?: string;
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
  force,
  req,
}: GetQuestsParams = {}): Promise<Quest[]> => {
  if (!isTrpcEnabled()) {
    const filter: Record<string, unknown> = {};
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
  }
  const results = await clientFor({ req })
    .quest.list.query({
      status: status as ListInput['status'],
      category,
      limit,
      page,
      sortBy,
    })
    .catch(throwApiError);
  return (results as unknown as Quest[]).map(normalizeQuest);
};

/** :slug accepts a slug or an ObjectId on every quest route. */
export const getQuest = async (
  slug: string,
  { force, ...options }: RequestOptions & { force?: boolean } = {},
): Promise<Quest | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/quest/${slug}`, {
      ...(force ? noCache : {}),
      ...withHeaders(options),
    });
    const quest = res?.data?.results;
    return quest ? normalizeQuest(quest) : null;
  }
  const quest = await clientFor(options)
    .quest.get.query({ idOrSlug: slug })
    .catch(throwApiErrorWithLegacy404);
  return normalizeQuest(quest as unknown as Quest);
};

/** The caller's derived view: tickets, rank, odds, pending actions. */
export const getQuestMe = async (
  slug: string,
  options: RequestOptions = {},
): Promise<QuestMe | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/quest/${slug}/me`, {
      ...noCache,
      ...withHeaders(options),
    });
    return res?.data?.results || null;
  }
  const me = await clientFor(options)
    .quest.mine.query({ idOrSlug: slug })
    .catch(throwApiError);
  return me as unknown as QuestMe;
};

export const getQuestLeaderboard = async (
  slug: string,
  {
    limit,
    includeMe = true,
    ...options
  }: RequestOptions & { limit?: number; includeMe?: boolean } = {},
): Promise<QuestLeaderboard | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/quest/${slug}/leaderboard`, {
      params: {
        ...(limit ? { limit } : {}),
        ...(includeMe ? {} : { includeMe: false }),
      },
      ...noCache,
      ...withHeaders(options),
    });
    return res?.data?.results || null;
  }
  const board = await clientFor(options)
    .quest.leaderboard.query({ idOrSlug: slug, limit, includeMe })
    .catch(throwApiError);
  return board as unknown as QuestLeaderboard;
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
  if (!isTrpcEnabled()) {
    const res = await api.post(`/quest/${slug}/action`, {
      ...(sourceKey ? { sourceKey } : {}),
      ...(proof ? { proof } : {}),
    });
    invalidateQuestReads();
    return res?.data?.results || null;
  }
  const action = await trpc.quest.submitAction
    .mutate({ idOrSlug: slug, sourceKey: sourceKey || undefined, proof })
    .catch(throwApiError);
  invalidateQuestReads();
  return action as unknown as QuestAction;
};

/** A member's own action history — standard CRUD, scoped to them. */
export const getMyQuestActions = async (
  questId: string,
  options: RequestOptions = {},
): Promise<QuestAction[]> => {
  if (!isTrpcEnabled()) {
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
  }
  const actions = await clientFor(options)
    .quest.actions.query({ questId, limit: 100, sortBy: '-created' })
    .catch(throwApiError);
  return actions as unknown as QuestAction[];
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
  const users = await fetchUsers(
    { where: { _id: { $in: ids } }, limit: ids.length },
    { token: getBearerToken(options.req) },
  );
  return users || [];
};

/** Public once the quest is locked — 409 before that. */
export const getQuestAudit = async (
  slug: string,
  options: RequestOptions = {},
): Promise<QuestAudit | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/quest/${slug}/audit`, withHeaders(options));
    return res?.data?.results || null;
  }
  const audit = await clientFor(options)
    .quest.audit.query({ idOrSlug: slug })
    .catch(throwApiError);
  return audit as unknown as QuestAudit;
};

/**
 * Quests use the standard CRUD routes — there is no bespoke quest create.
 * Integrity rules (window, config shape, prize ranks) are enforced server-side.
 */
export const createQuest = async (
  payload: Partial<Quest>,
): Promise<Quest | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/quest', payload);
    invalidateQuestReads();
    const quest = res?.data?.results;
    return quest ? normalizeQuest(quest) : null;
  }
  const quest = await trpc.quest.create
    .mutate(payload as CreateInput)
    .catch(throwApiError);
  invalidateQuestReads();
  return normalizeQuest(quest as unknown as Quest);
};

/**
 * PATCH by slug. Once a quest leaves draft/scheduled the server freezes type,
 * window, prize and configs, so only copy and visuals get through.
 */
export const updateQuest = async (
  slug: string,
  payload: Partial<Quest>,
): Promise<Quest | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.patch(`/quest/${slug}`, payload);
    invalidateQuestReads();
    const quest = res?.data?.results;
    return quest ? normalizeQuest(quest) : null;
  }
  const quest = await trpc.quest.update
    .mutate({ idOrSlug: slug, data: payload as UpdateInput })
    .catch(throwApiError);
  invalidateQuestReads();
  return normalizeQuest(quest as unknown as Quest);
};

/** Only allowed while the quest is still draft/scheduled — cancel it otherwise. */
export const deleteQuest = async (id: string): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.delete(`/quest/${id}`);
    invalidateQuestReads();
    return;
  }
  await trpc.quest.remove.mutate({ id }).catch(throwApiError);
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
  if (!isTrpcEnabled()) {
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
  }
  const actions = await clientFor(options)
    .quest.actions.query({
      questId,
      status: status as ActionStatus,
      limit,
      sortBy: '-created',
    })
    .catch(throwApiError);
  return actions as unknown as QuestAction[];
};

export const getQuestEntries = async (
  questId: string,
  { limit = 200, ...options }: RequestOptions & { limit?: number } = {},
): Promise<QuestEntry[]> => {
  if (!isTrpcEnabled()) {
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
  }
  const entries = await clientFor(options)
    .quest.entries.query({ questId, limit, sortBy: '-ticketCount' })
    .catch(throwApiError);
  return entries as unknown as QuestEntry[];
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
  if (!isTrpcEnabled()) {
    const res = await api.post(`/quest/${slug}/action/${actionId}/verify`, {
      decision,
      ...(note ? { note } : {}),
    });
    invalidateQuestReads();
    return res?.data?.results || null;
  }
  const action = await trpc.quest.verifyAction
    .mutate({ idOrSlug: slug, actionId, decision, note: note || undefined })
    .catch(throwApiError);
  invalidateQuestReads();
  return action as unknown as QuestAction;
};

export const disqualifyQuestEntry = async (
  slug: string,
  entryId: string,
  reason: string,
): Promise<QuestEntry | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/quest/${slug}/entry/${entryId}/disqualify`, {
      reason,
    });
    invalidateQuestReads();
    return res?.data?.results || null;
  }
  const entry = await trpc.quest.disqualify
    .mutate({ idOrSlug: slug, entryId, reason })
    .catch(throwApiError);
  invalidateQuestReads();
  return entry as unknown as QuestEntry;
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
  if (!isTrpcEnabled()) {
    const res = await api.post(`/quest/${slug}/lock`, force ? { force } : {});
    invalidateQuestReads();
    const quest = res?.data?.results;
    return quest ? normalizeQuest(quest) : null;
  }
  const quest = await trpc.quest.lock
    .mutate({ idOrSlug: slug, force })
    .catch(throwApiError);
  invalidateQuestReads();
  return normalizeQuest(quest as unknown as Quest);
};

/**
 * Requires a locked quest. `seed` is required when drawMethod is externalSeed;
 * otherwise the server generates and records one. Idempotent.
 */
export const drawQuest = async (
  slug: string,
  { seed }: { seed?: string } = {},
): Promise<Quest | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/quest/${slug}/draw`, seed ? { seed } : {});
    invalidateQuestReads();
    const quest = res?.data?.results;
    return quest ? normalizeQuest(quest) : null;
  }
  const quest = await trpc.quest.draw
    .mutate({ idOrSlug: slug, seed: seed || undefined })
    .catch(throwApiError);
  invalidateQuestReads();
  return normalizeQuest(quest as unknown as Quest);
};

/** Re-running settle retries only what failed; anything paid is left alone. */
export const settleQuest = async (slug: string): Promise<Quest | null> => {
  const res = await api.post(`/quest/${slug}/settle`);
  invalidateQuestReads();
  const quest = res?.data?.results;
  return quest ? normalizeQuest(quest) : null;
};
