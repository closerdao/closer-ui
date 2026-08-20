const {
  fetchWithRetry,
  getMissingExpectedSlugs,
  isStaleSnapshotAllowed,
  redactUrl,
  resolveConfigApiUrl,
  EXPECTED_CONFIG_SLUGS,
  FETCH_TIMEOUT_MS,
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
  touchTailwindConfigs,
} = require('../syncBuildConfig.cjs');

const fs = require('fs');
const path = require('path');

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

describe('redactUrl', () => {
  it('strips userinfo credentials from a URL', () => {
    expect(redactUrl('https://user:s3cret@api.example.com/config?limit=500')).toBe(
      'https://api.example.com/config?limit=500',
    );
  });

  it('leaves credential-free URLs unchanged', () => {
    expect(redactUrl(URL)).toBe(URL);
  });

  it('strips userinfo even from unparseable URL-like strings', () => {
    expect(redactUrl('notaurl//user:pass@host/path')).not.toContain('s3cret');
    expect(redactUrl('http://user:pass@[bad')).not.toContain('pass');
  });
});

describe('fetchWithRetry URL redaction', () => {
  const CRED_URL = 'https://builder:s3cret@api.example.com/config?limit=500';

  it('never emits URL credentials in warnings or the thrown error', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValue(networkError('ENETUNREACH'));
    let thrown;
    try {
      await fetchWithRetry(CRED_URL, {
        fetchImpl,
        sleep: instantSleep,
        log: silentLog,
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown.message).not.toContain('s3cret');
    expect(thrown.message).not.toContain('builder:');
    for (const [msg] of silentLog.warn.mock.calls) {
      expect(msg).not.toContain('s3cret');
    }
    expect(fetchImpl).toHaveBeenCalledWith(CRED_URL, expect.anything());
  });

  it('never emits URL credentials on HTTP-failure exhaustion', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(errorResponse(502, 'Bad Gateway'));
    let thrown;
    try {
      await fetchWithRetry(CRED_URL, {
        fetchImpl,
        sleep: instantSleep,
        log: silentLog,
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown.message).not.toContain('s3cret');
    for (const [msg] of silentLog.warn.mock.calls) {
      expect(msg).not.toContain('s3cret');
    }
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

describe('isStaleSnapshotAllowed', () => {
  it('is allowed only when ALLOW_STALE_CONFIG_SNAPSHOT is exactly "1"', () => {
    expect(isStaleSnapshotAllowed({ ALLOW_STALE_CONFIG_SNAPSHOT: '1' })).toBe(
      true,
    );
    expect(isStaleSnapshotAllowed({})).toBe(false);
    expect(isStaleSnapshotAllowed({ ALLOW_STALE_CONFIG_SNAPSHOT: '' })).toBe(
      false,
    );
    expect(isStaleSnapshotAllowed({ ALLOW_STALE_CONFIG_SNAPSHOT: 'true' })).toBe(
      false,
    );
    expect(isStaleSnapshotAllowed({ ALLOW_STALE_CONFIG_SNAPSHOT: '0' })).toBe(
      false,
    );
  });
});

describe('getMissingExpectedSlugs', () => {
  const fullMap = () =>
    Object.fromEntries(EXPECTED_CONFIG_SLUGS.map((slug) => [slug, {}]));

  it('returns no missing slugs when every expected bucket is present', () => {
    expect(getMissingExpectedSlugs(fullMap())).toEqual([]);
  });

  it('tolerates extra, unexpected slugs', () => {
    expect(
      getMissingExpectedSlugs({ ...fullMap(), 'photo-gallery': {} }),
    ).toEqual([]);
  });

  it('lists every expected bucket that disappeared from the response', () => {
    const map = fullMap();
    delete map.general;
    delete map.booking;
    expect(getMissingExpectedSlugs(map)).toEqual(['booking', 'general']);
  });

  it('reports everything missing for an empty or absent payload', () => {
    expect(getMissingExpectedSlugs({})).toEqual(EXPECTED_CONFIG_SLUGS);
    expect(getMissingExpectedSlugs(undefined)).toEqual(EXPECTED_CONFIG_SLUGS);
  });
});

/**
 * A colour saved in /dashboard/theming only reaches a running dev server if
 * something tells Tailwind to rebuild. Tailwind watches its own config file and
 * nothing else in the chain, so the snapshot write has to nudge it — without
 * this, `yarn build:config` updates the JSON and the browser keeps the palette
 * the server booted with.
 */
describe('touchTailwindConfigs', () => {
  const appsDir = path.join(__dirname, '..', '..', '..', '..', 'apps');

  it('bumps the mtime of every app tailwind config it can find', () => {
    const before = fs
      .readdirSync(appsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(appsDir, e.name, 'tailwind.config.js'))
      .filter((p) => fs.existsSync(p))
      .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }));

    expect(before.length).toBeGreaterThan(0);

    const touched = touchTailwindConfigs({ log: () => {} });
    expect(touched.length).toBe(before.length);

    for (const { p, mtime } of before) {
      expect(fs.statSync(p).mtimeMs).toBeGreaterThanOrEqual(mtime);
    }
  });

  it('leaves the file contents alone — it is a signal, not an edit', () => {
    const target = path.join(appsDir, 'tdf', 'tailwind.config.js');
    const before = fs.readFileSync(target, 'utf8');
    touchTailwindConfigs({ log: () => {} });
    expect(fs.readFileSync(target, 'utf8')).toBe(before);
  });

  it('does not throw when the apps directory is unreadable', () => {
    const spy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw new Error('nope');
    });
    expect(() => touchTailwindConfigs({ log: () => {} })).not.toThrow();
    expect(touchTailwindConfigs({ log: () => {} })).toEqual([]);
    spy.mockRestore();
  });
});
