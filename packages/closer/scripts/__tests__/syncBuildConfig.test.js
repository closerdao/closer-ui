const {
  fetchWithRetry,
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
} = require('../syncBuildConfig.cjs');

const URL = 'https://api.example.closer.earth/config?limit=500';

const silentLog = { warn: jest.fn(), error: jest.fn(), log: jest.fn() };
const instantSleep = jest.fn(() => Promise.resolve());

const okResponse = () => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  text: async () => '',
  json: async () => ({ results: [] }),
});

const errorResponse = (status, statusText, body = '') => ({
  ok: false,
  status,
  statusText,
  text: async () => body,
});

const networkError = (code) => {
  const err = new TypeError('fetch failed');
  err.cause = { code, message: 'network trouble' };
  return err;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchWithRetry', () => {
  it('returns the response on first success without retrying', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse());
    const res = await fetchWithRetry(URL, {
      fetchImpl,
      sleep: instantSleep,
      log: silentLog,
    });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(instantSleep).not.toHaveBeenCalled();
  });

  it('retries network errors with 2/4/8/16s backoff and succeeds', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(networkError('ENETUNREACH'))
      .mockRejectedValueOnce(networkError('ENETUNREACH'))
      .mockResolvedValue(okResponse());
    const res = await fetchWithRetry(URL, {
      fetchImpl,
      sleep: instantSleep,
      log: silentLog,
    });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(instantSleep.mock.calls.map(([ms]) => ms)).toEqual([2000, 4000]);
  });

  it('retries non-200 responses and succeeds', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(errorResponse(503, 'Service Unavailable'))
      .mockResolvedValue(okResponse());
    const res = await fetchWithRetry(URL, {
      fetchImpl,
      sleep: instantSleep,
      log: silentLog,
    });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports "unreachable after N attempts" when every attempt is a network error', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(networkError('ENETUNREACH'));
    await expect(
      fetchWithRetry(URL, { fetchImpl, sleep: instantSleep, log: silentLog }),
    ).rejects.toThrow(
      `Config API unreachable after ${MAX_ATTEMPTS} attempts (ENETUNREACH: network trouble)`,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(instantSleep.mock.calls.map(([ms]) => ms)).toEqual(RETRY_DELAYS_MS);
  });

  it('reports the HTTP status when every attempt gets a non-200', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(errorResponse(502, 'Bad Gateway', 'upstream down'));
    await expect(
      fetchWithRetry(URL, { fetchImpl, sleep: instantSleep, log: silentLog }),
    ).rejects.toThrow(
      `Config request failed after ${MAX_ATTEMPTS} attempts: HTTP 502 Bad Gateway`,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it('classifies the failure by the last attempt (network error after HTTP errors)', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(errorResponse(500, 'Internal Server Error'))
      .mockRejectedValue(networkError('ECONNREFUSED'));
    await expect(
      fetchWithRetry(URL, { fetchImpl, sleep: instantSleep, log: silentLog }),
    ).rejects.toThrow(
      `Config API unreachable after ${MAX_ATTEMPTS} attempts (ECONNREFUSED: network trouble)`,
    );
  });

  it('caps total backoff at ~30s across attempts', () => {
    const total = RETRY_DELAYS_MS.reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(35000);
    expect(MAX_ATTEMPTS).toBe(5);
  });
});
