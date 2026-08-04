const {
  fetchWithRetry,
  resolveConfigApiUrl,
  FETCH_TIMEOUT_MS,
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

  it('retries timeouts (AbortError) like other network errors and reports the timeout duration', async () => {
    const abortError = () => {
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      return err;
    };
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(abortError())
      .mockRejectedValueOnce(abortError())
      .mockResolvedValue(okResponse());
    const res = await fetchWithRetry(URL, {
      fetchImpl,
      sleep: instantSleep,
      log: silentLog,
    });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(instantSleep.mock.calls.map(([ms]) => ms)).toEqual([2000, 4000]);
    expect(silentLog.warn.mock.calls[0][0]).toContain(
      `timed out after ${FETCH_TIMEOUT_MS}ms`,
    );
  });

  it('reports the timeout in the final error when every attempt aborts', async () => {
    const fetchImpl = jest.fn().mockImplementation(() => {
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });
    await expect(
      fetchWithRetry(URL, { fetchImpl, sleep: instantSleep, log: silentLog }),
    ).rejects.toThrow(
      `Config API unreachable after ${MAX_ATTEMPTS} attempts (timed out after ${FETCH_TIMEOUT_MS}ms)`,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(instantSleep.mock.calls.map(([ms]) => ms)).toEqual(RETRY_DELAYS_MS);
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
      .mockResolvedValue(
        errorResponse(502, 'Bad Gateway', 'secret upstream detail'),
      );
    await expect(
      fetchWithRetry(URL, { fetchImpl, sleep: instantSleep, log: silentLog }),
    ).rejects.toThrow(
      `Config request failed after ${MAX_ATTEMPTS} attempts: HTTP 502 Bad Gateway. URL: ${URL}`,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it('never includes the response body in the thrown error or logs', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        errorResponse(500, 'Internal Server Error', 'db password leaked'),
      );
    let thrown;
    try {
      await fetchWithRetry(URL, {
        fetchImpl,
        sleep: instantSleep,
        log: silentLog,
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown.message).not.toContain('db password leaked');
    for (const [msg] of silentLog.warn.mock.calls) {
      expect(msg).not.toContain('db password leaked');
    }
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

describe('resolveConfigApiUrl', () => {
  it('prefers CONFIG_BUILD_API_URL over NEXT_PUBLIC_API_URL', () => {
    expect(
      resolveConfigApiUrl({
        CONFIG_BUILD_API_URL: 'https://app.ondigitalocean.app',
        NEXT_PUBLIC_API_URL: 'https://api.example.closer.earth',
      }),
    ).toEqual({ apiUrl: 'https://app.ondigitalocean.app', isOverride: true });
  });

  it('falls back to NEXT_PUBLIC_API_URL when no override is set', () => {
    expect(
      resolveConfigApiUrl({
        NEXT_PUBLIC_API_URL: 'https://api.example.closer.earth',
      }),
    ).toEqual({
      apiUrl: 'https://api.example.closer.earth',
      isOverride: false,
    });
  });

  it('returns null when neither variable is set', () => {
    expect(resolveConfigApiUrl({})).toEqual({
      apiUrl: null,
      isOverride: false,
    });
  });

  it('ignores an empty-string override', () => {
    expect(
      resolveConfigApiUrl({
        CONFIG_BUILD_API_URL: '',
        NEXT_PUBLIC_API_URL: 'https://api.example.closer.earth',
      }),
    ).toEqual({
      apiUrl: 'https://api.example.closer.earth',
      isOverride: false,
    });
  });
});
