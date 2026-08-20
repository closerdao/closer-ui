/**
 * Client GETs are cached for five minutes, so a quest page that never busts it
 * shows a member yesterday's standings and an admin a quest that never seems to
 * change state. These pin the two halves of that fix.
 */
const invalidateGetCache = jest.fn();
const get = jest.fn(() => Promise.resolve({ data: { results: [] } }));
const post = jest.fn(() => Promise.resolve({ data: { results: {} } }));
const patch = jest.fn(() => Promise.resolve({ data: { results: {} } }));
const del = jest.fn(() => Promise.resolve({ data: {} }));

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => get(...(args as [])),
    post: (...args: unknown[]) => post(...(args as [])),
    patch: (...args: unknown[]) => patch(...(args as [])),
    delete: (...args: unknown[]) => del(...(args as [])),
  },
  formatSearch: (where: unknown) => JSON.stringify(where),
  cdn: '',
  invalidateGetCache: (...args: unknown[]) =>
    invalidateGetCache(...(args as [])),
}));

import {
  createQuest,
  drawQuest,
  getQuest,
  getQuestLeaderboard,
  getQuestMe,
  getQuests,
  lockQuest,
  settleQuest,
  updateQuest,
  verifyQuestAction,
} from '../quests.api';

const configOf = (call: unknown[]) => call[1] as { cache?: boolean };

describe('reads that must not come from cache', () => {
  beforeEach(() => get.mockClear());

  test('the caller entry always hits the network', async () => {
    await getQuestMe('citizen-raffle');
    expect(configOf(get.mock.calls[0]).cache).toBe(false);
  });

  test('the leaderboard always hits the network', async () => {
    await getQuestLeaderboard('citizen-raffle');
    expect(configOf(get.mock.calls[0]).cache).toBe(false);
  });

  test('a forced quest read skips the cache', async () => {
    await getQuest('citizen-raffle', { force: true });
    expect(configOf(get.mock.calls[0]).cache).toBe(false);
  });

  test('an ordinary quest read may still be cached', async () => {
    await getQuest('citizen-raffle');
    expect(configOf(get.mock.calls[0]).cache).toBeUndefined();
  });

  test('a forced list read skips the cache', async () => {
    await getQuests({ force: true });
    expect(configOf(get.mock.calls[0]).cache).toBe(false);
  });
});

describe('writes that must drop what they invalidated', () => {
  beforeEach(() => invalidateGetCache.mockClear());

  test.each([
    ['create', () => createQuest({ title: 'x' })],
    ['update', () => updateQuest('citizen-raffle', { title: 'x' })],
    ['lock', () => lockQuest('citizen-raffle')],
    ['draw', () => drawQuest('citizen-raffle')],
    ['settle', () => settleQuest('citizen-raffle')],
    ['verify', () => verifyQuestAction('citizen-raffle', 'a1', { decision: 'verified' })],
  ])('%s clears the cached quest reads', async (_name, run) => {
    await run();
    expect(invalidateGetCache).toHaveBeenCalledWith('/quest');
  });
});
