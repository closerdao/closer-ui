import { TRPCClientError } from '@trpc/client';
import type { NextApiRequest } from 'next';

import api, { invalidateGetCache } from '../api';
import {
  createQuest,
  deleteQuest,
  disqualifyQuestEntry,
  drawQuest,
  getMyQuestActions,
  getQuest,
  getQuestActions,
  getQuestAudit,
  getQuestEntries,
  getQuestLeaderboard,
  getQuestMe,
  getQuests,
  lockQuest,
  publishQuest,
  submitQuestAction,
  updateQuest,
  verifyQuestAction,
} from '../quests.api';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  formatSearch: (where: unknown) => JSON.stringify(where),
  invalidateGetCache: jest.fn(),
}));

jest.mock('../users', () => ({ fetchUsers: jest.fn() }));

const mockServerQuest = {
  list: { query: jest.fn() },
  get: { query: jest.fn() },
  audit: { query: jest.fn() },
};

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ quest: mockServerQuest })),
  trpc: {
    quest: {
      list: { query: jest.fn() },
      get: { query: jest.fn() },
      mine: { query: jest.fn() },
      leaderboard: { query: jest.fn() },
      actions: { query: jest.fn() },
      entries: { query: jest.fn() },
      audit: { query: jest.fn() },
      submitAction: { mutate: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
      verifyAction: { mutate: jest.fn() },
      disqualify: { mutate: jest.fn() },
      lock: { mutate: jest.fn() },
      draw: { mutate: jest.fn() },
    },
  },
}));

type Procedures = Record<string, { query: jest.Mock } & { mutate: jest.Mock }>;
const mockQuest = trpc.quest as unknown as Procedures;
const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const mockedInvalidate = invalidateGetCache as jest.Mock;

const req = {
  cookies: { access_token: 'cookie-token' },
} as never as NextApiRequest;

// Stored before the credits rename; both branches hand back "credits".
const raffle = {
  _id: 'q1',
  slug: 'citizen-raffle',
  status: 'live',
  prize: { eachAction: { kind: 'currency', amount: 5, cur: 'carrots' } },
};
const normalized = {
  ...raffle,
  prize: { eachAction: { kind: 'currency', amount: 5, cur: 'credits' } },
};
const action = { _id: 'a1', questId: 'q1', status: 'pending' };
const entry = { _id: 'e1', questId: 'q1', ticketCount: 3 };

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32004,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('lists with GET /quest and the status filter', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [raffle] } });
    await expect(getQuests({ status: ['live', 'locked'] })).resolves.toEqual([
      normalized,
    ]);
    expect(mockedApi.get).toHaveBeenCalledWith('/quest', {
      params: {
        where: JSON.stringify({ status: { $in: ['live', 'locked'] } }),
        limit: 50,
        sort_by: '-start',
      },
    });
  });

  it('reads one with GET /quest/:slug and the cookie token', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: raffle } });
    await expect(getQuest('citizen-raffle', { req })).resolves.toEqual(
      normalized,
    );
    expect(mockedApi.get).toHaveBeenCalledWith('/quest/citizen-raffle', {
      headers: { Authorization: 'Bearer cookie-token' },
    });
  });

  it('reads the caller view with GET /quest/:slug/me', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: { tickets: 2 } } });
    await expect(getQuestMe('citizen-raffle')).resolves.toEqual({
      tickets: 2,
    });
    expect(mockedApi.get.mock.calls[0][0]).toBe('/quest/citizen-raffle/me');
  });

  it('reads standings with GET /quest/:slug/leaderboard', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: { rows: [] } } });
    await getQuestLeaderboard('citizen-raffle', { limit: 10 });
    expect(mockedApi.get.mock.calls[0][0]).toBe(
      '/quest/citizen-raffle/leaderboard',
    );
    expect(mockedApi.get.mock.calls[0][1].params).toEqual({ limit: 10 });
  });

  it('submits with POST /quest/:slug/action', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: action } });
    await expect(
      submitQuestAction('citizen-raffle', { sourceKey: 'manual' }),
    ).resolves.toEqual(action);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/quest/citizen-raffle/action',
      { sourceKey: 'manual' },
    );
    expect(mockedInvalidate).toHaveBeenCalledWith('/quest');
  });

  it("reads the member's actions with GET /questaction", async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [action] } });
    await expect(getMyQuestActions('q1')).resolves.toEqual([action]);
    expect(mockedApi.get.mock.calls[0][0]).toBe('/questaction');
    expect(mockedApi.get.mock.calls[0][1].params).toEqual({
      where: JSON.stringify({ questId: 'q1' }),
      limit: 100,
      sort_by: '-created',
    });
  });

  it('reads the review queue with GET /questaction and a status', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [action] } });
    await getQuestActions('q1', { status: 'pending' });
    expect(mockedApi.get.mock.calls[0][1].params).toEqual({
      where: JSON.stringify({ questId: 'q1', status: 'pending' }),
      limit: 100,
      sort_by: '-created',
    });
  });

  it('reads entries with GET /questentry', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [entry] } });
    await expect(getQuestEntries('q1')).resolves.toEqual([entry]);
    expect(mockedApi.get.mock.calls[0][1].params).toEqual({
      where: JSON.stringify({ questId: 'q1' }),
      limit: 200,
      sort_by: '-ticketCount',
    });
  });

  it('reads the audit with GET /quest/:slug/audit', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: { hash: 'h' } } });
    await expect(getQuestAudit('citizen-raffle')).resolves.toEqual({
      hash: 'h',
    });
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/quest/citizen-raffle/audit',
      {},
    );
  });

  it('creates with POST /quest', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: raffle } });
    await expect(createQuest({ title: 'Raffle' })).resolves.toEqual(normalized);
    expect(mockedApi.post).toHaveBeenCalledWith('/quest', { title: 'Raffle' });
  });

  it('updates with PATCH /quest/:slug', async () => {
    mockedApi.patch.mockResolvedValue({ data: { results: raffle } });
    await expect(
      updateQuest('citizen-raffle', { title: 'Raffle' }),
    ).resolves.toEqual(normalized);
    expect(mockedApi.patch).toHaveBeenCalledWith('/quest/citizen-raffle', {
      title: 'Raffle',
    });
  });

  it('publishes a draft with one PATCH per step', async () => {
    mockedApi.patch.mockResolvedValue({ data: { results: raffle } });
    await publishQuest('citizen-raffle', 'draft');
    expect(mockedApi.patch.mock.calls.map(([, body]) => body)).toEqual([
      { status: 'scheduled' },
      { status: 'live' },
    ]);
  });

  it('deletes with DELETE /quest/:id', async () => {
    mockedApi.delete.mockResolvedValue({ data: {} });
    await deleteQuest('q1');
    expect(mockedApi.delete).toHaveBeenCalledWith('/quest/q1');
    expect(mockedInvalidate).toHaveBeenCalledWith('/quest');
  });

  it('verifies with POST /quest/:slug/action/:id/verify', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: action } });
    await verifyQuestAction('citizen-raffle', 'a1', { decision: 'verified' });
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/quest/citizen-raffle/action/a1/verify',
      { decision: 'verified' },
    );
  });

  it('disqualifies with POST /quest/:slug/entry/:id/disqualify', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: entry } });
    await disqualifyQuestEntry('citizen-raffle', 'e1', 'duplicate');
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/quest/citizen-raffle/entry/e1/disqualify',
      { reason: 'duplicate' },
    );
  });

  it('locks with POST /quest/:slug/lock', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: raffle } });
    await expect(lockQuest('citizen-raffle', { force: true })).resolves.toEqual(
      normalized,
    );
    expect(mockedApi.post).toHaveBeenCalledWith('/quest/citizen-raffle/lock', {
      force: true,
    });
  });

  it('draws with POST /quest/:slug/draw', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: raffle } });
    await expect(drawQuest('citizen-raffle')).resolves.toEqual(normalized);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/quest/citizen-raffle/draw',
      {},
    );
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists with quest.list and the UI defaults', async () => {
    mockQuest.list.query.mockResolvedValue([raffle]);
    await expect(
      getQuests({ status: ['scheduled', 'draft'] }),
    ).resolves.toEqual([normalized]);
    expect(mockQuest.list.query).toHaveBeenCalledWith({
      status: ['scheduled', 'draft'],
      category: undefined,
      limit: 50,
      page: undefined,
      sortBy: '-start',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('lists on a server render with the cookie token', async () => {
    mockServerQuest.list.query.mockResolvedValue([]);
    await getQuests({ status: ['live'], req });
    expect(mockedTrpcFor).toHaveBeenCalledWith('cookie-token');
    expect(mockServerQuest.list.query).toHaveBeenCalled();
    expect(mockQuest.list.query).not.toHaveBeenCalled();
  });

  it('reads one with quest.get on a server render', async () => {
    mockServerQuest.get.query.mockResolvedValue(raffle);
    await expect(getQuest('citizen-raffle', { req })).resolves.toEqual(
      normalized,
    );
    expect(mockServerQuest.get.query).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
    });
  });

  it("rejects a missing quest with legacy's 404", async () => {
    mockQuest.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Quest not found'),
    );
    await expect(getQuest('gone')).rejects.toMatchObject({
      message: 'Request failed with status code 404',
      response: { status: 404 },
    });
  });

  it('reads the caller view with quest.mine', async () => {
    mockQuest.mine.query.mockResolvedValue({ tickets: 2 });
    await expect(getQuestMe('citizen-raffle')).resolves.toEqual({
      tickets: 2,
    });
    expect(mockQuest.mine.query).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
    });
  });

  it('reads standings with quest.leaderboard', async () => {
    mockQuest.leaderboard.query.mockResolvedValue({ rows: [] });
    await getQuestLeaderboard('citizen-raffle', { limit: 10 });
    expect(mockQuest.leaderboard.query).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      limit: 10,
      includeMe: true,
    });
  });

  it('submits with quest.submitAction and drops cached reads', async () => {
    mockQuest.submitAction.mutate.mockResolvedValue(action);
    await expect(
      submitQuestAction('citizen-raffle', { sourceKey: 'manual' }),
    ).resolves.toEqual(action);
    expect(mockQuest.submitAction.mutate).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      sourceKey: 'manual',
      proof: undefined,
    });
    expect(mockedInvalidate).toHaveBeenCalledWith('/quest');
  });

  it("reads the member's actions with quest.actions", async () => {
    mockQuest.actions.query.mockResolvedValue([action]);
    await expect(getMyQuestActions('q1')).resolves.toEqual([action]);
    expect(mockQuest.actions.query).toHaveBeenCalledWith({
      questId: 'q1',
      limit: 100,
      sortBy: '-created',
    });
  });

  it('reads the review queue with quest.actions and a status', async () => {
    mockQuest.actions.query.mockResolvedValue([action]);
    await getQuestActions('q1', { status: 'pending' });
    expect(mockQuest.actions.query).toHaveBeenCalledWith({
      questId: 'q1',
      status: 'pending',
      limit: 100,
      sortBy: '-created',
    });
  });

  it('reads entries with quest.entries', async () => {
    mockQuest.entries.query.mockResolvedValue([entry]);
    await expect(getQuestEntries('q1')).resolves.toEqual([entry]);
    expect(mockQuest.entries.query).toHaveBeenCalledWith({
      questId: 'q1',
      limit: 200,
      sortBy: '-ticketCount',
    });
  });

  it('reads the audit with quest.audit on a server render', async () => {
    mockServerQuest.audit.query.mockResolvedValue({ hash: 'h' });
    await expect(getQuestAudit('citizen-raffle', { req })).resolves.toEqual({
      hash: 'h',
    });
    expect(mockServerQuest.audit.query).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
    });
  });

  it('creates with quest.create', async () => {
    mockQuest.create.mutate.mockResolvedValue(raffle);
    await expect(createQuest({ title: 'Raffle' })).resolves.toEqual(normalized);
    expect(mockQuest.create.mutate).toHaveBeenCalledWith({ title: 'Raffle' });
    expect(mockedInvalidate).toHaveBeenCalledWith('/quest');
  });

  it("surfaces a failed create's message", async () => {
    mockQuest.create.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Duplicate entry.'),
    );
    await expect(createQuest({ title: 'Raffle' })).rejects.toMatchObject({
      response: { data: { error: 'Duplicate entry.' } },
    });
  });

  it('updates with quest.update', async () => {
    mockQuest.update.mutate.mockResolvedValue(raffle);
    await expect(
      updateQuest('citizen-raffle', { title: 'Raffle' }),
    ).resolves.toEqual(normalized);
    expect(mockQuest.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      data: { title: 'Raffle' },
    });
  });

  it('publishes a draft with one quest.update per step', async () => {
    mockQuest.update.mutate.mockResolvedValue(raffle);
    await publishQuest('citizen-raffle', 'draft');
    expect(
      mockQuest.update.mutate.mock.calls.map(([input]) => input.data),
    ).toEqual([{ status: 'scheduled' }, { status: 'live' }]);
  });

  it('deletes with quest.remove', async () => {
    mockQuest.remove.mutate.mockResolvedValue({ deleted: true });
    await deleteQuest('q1');
    expect(mockQuest.remove.mutate).toHaveBeenCalledWith({ id: 'q1' });
    expect(mockedInvalidate).toHaveBeenCalledWith('/quest');
  });

  it('verifies with quest.verifyAction', async () => {
    mockQuest.verifyAction.mutate.mockResolvedValue(action);
    await verifyQuestAction('citizen-raffle', 'a1', { decision: 'rejected' });
    expect(mockQuest.verifyAction.mutate).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      actionId: 'a1',
      decision: 'rejected',
      note: undefined,
    });
  });

  it('disqualifies with quest.disqualify', async () => {
    mockQuest.disqualify.mutate.mockResolvedValue(entry);
    await disqualifyQuestEntry('citizen-raffle', 'e1', 'duplicate');
    expect(mockQuest.disqualify.mutate).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      entryId: 'e1',
      reason: 'duplicate',
    });
  });

  it('locks with quest.lock', async () => {
    mockQuest.lock.mutate.mockResolvedValue(raffle);
    await expect(lockQuest('citizen-raffle', { force: true })).resolves.toEqual(
      normalized,
    );
    expect(mockQuest.lock.mutate).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      force: true,
    });
  });

  it('draws with quest.draw', async () => {
    mockQuest.draw.mutate.mockResolvedValue(raffle);
    await expect(
      drawQuest('citizen-raffle', { seed: 'block-1' }),
    ).resolves.toEqual(normalized);
    expect(mockQuest.draw.mutate).toHaveBeenCalledWith({
      idOrSlug: 'citizen-raffle',
      seed: 'block-1',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
