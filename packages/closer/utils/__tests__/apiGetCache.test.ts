/**
 * GETs are cached for 5 minutes, which goes stale the moment a mutation lands.
 * `cache: false` is what callers such as refetchUser use to reload state after
 * subscribing, changing or cancelling a plan, so it has to both skip the cached
 * value and replace it — otherwise the next cached read serves the pre-mutation
 * user again.
 */
jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
  ensureInteractionSession: jest.fn(async () => undefined),
  getStoredInteractionSessionKey: jest.fn(() => 'valid-key'),
  refreshInteractionSession: jest.fn(async () => undefined),
}));

import api from '../api';

type Attempt = { url?: string };

/** Serves an incrementing payload so each round trip is distinguishable. */
const installAdapter = () => {
  const attempts: Attempt[] = [];
  let version = 0;
  (api.defaults as any).adapter = async (config: any) => {
    attempts.push({ url: config.url });
    version += 1;
    return {
      data: { results: { version } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
  };
  return attempts;
};

describe('api GET cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('serves a repeated GET from the cache', async () => {
    const attempts = installAdapter();

    const first = await api.get('/mine/user');
    const second = await api.get('/mine/user');

    expect(first.data.results.version).toBe(1);
    expect(second.data.results.version).toBe(1);
    expect(attempts).toHaveLength(1);
  });

  it('bypasses the cache when cache is false', async () => {
    const attempts = installAdapter();

    await api.get('/cache-false/bypass');
    const forced = await api.get('/cache-false/bypass', {
      cache: false,
    } as any);

    expect(forced.data.results.version).toBe(2);
    expect(attempts).toHaveLength(2);
  });

  it('replaces the cached value so later cached reads are post-mutation', async () => {
    const attempts = installAdapter();

    await api.get('/cache-false/replace');
    await api.get('/cache-false/replace', { cache: false } as any);
    const cached = await api.get('/cache-false/replace');

    expect(cached.data.results.version).toBe(2);
    expect(attempts).toHaveLength(2);
  });

  it('does not join an in-flight request that started before the mutation', async () => {
    const attempts = installAdapter();

    const inFlight = api.get('/cache-false/inflight');
    const forced = api.get('/cache-false/inflight', { cache: false } as any);

    const [stale, fresh] = await Promise.all([inFlight, forced]);

    expect(stale.data.results.version).toBe(1);
    expect(fresh.data.results.version).toBe(2);
    expect(attempts).toHaveLength(2);
  });
});
