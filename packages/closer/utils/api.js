import axios from 'axios';

import {
  clearTokens,
  getAccessToken,
  getAccessTokenExpiryMs,
  getRefreshToken,
  getStoredAccountId,
  setStoredAccountId,
  setTokens,
} from './authStorage';
import { invalidateConfigCache } from './configCache';
import {
  applyInteractionIsHumanFromResponse,
  ensureInteractionSession,
  getStoredInteractionSessionKey,
  refreshInteractionSession,
} from './interactionSession';

export const formatSearch = (where) =>
  encodeURIComponent(JSON.stringify(where));
export const cdn = process.env.NEXT_PUBLIC_CDN_URL;

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({ baseURL });

const GET_CACHE_TTL_MS = 5 * 60 * 1000;
const getResponseCache = new Map();
const getInflight = new Map();

function stableSerializeParams(params) {
  if (params == null || typeof params !== 'object') return '';
  const keys = Object.keys(params).sort();
  const sorted = {};
  for (const k of keys) sorted[k] = params[k];
  return JSON.stringify(sorted);
}

function buildGetCacheKey(url, config) {
  const paramsPart = stableSerializeParams(config?.params);
  const auth = getAccessToken() ?? '';
  return `${url}\u0000${paramsPart}\u0000${auth}`;
}

function cloneResponseData(data) {
  if (data === null || typeof data !== 'object') return data;
  try {
    return structuredClone(data);
  } catch {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return data;
    }
  }
}

/**
 * Drops cached GETs whose url starts with the given prefix, so a mutation can
 * make the reads it invalidates go back to the network. Without a prefix the
 * whole GET cache goes.
 */
export function invalidateGetCache(urlPrefix) {
  if (!urlPrefix) {
    getResponseCache.clear();
    return;
  }
  for (const key of [...getResponseCache.keys()]) {
    if (key.split('\u0000')[0].startsWith(urlPrefix)) {
      getResponseCache.delete(key);
    }
  }
}

function omitCacheOption(config) {
  if (!config || config.cache === undefined) return config;
  const next = { ...config };
  delete next.cache;
  return next;
}

function storeGetResponse(key, response) {
  getResponseCache.set(key, {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    expiresAt: Date.now() + GET_CACHE_TTL_MS,
  });
}

const axiosGet = api.get.bind(api);
api.get = function getWithCache(url, config) {
  const merged = config ?? {};
  if (typeof window === 'undefined') {
    return axiosGet(url, omitCacheOption(merged));
  }
  const axiosConfig = omitCacheOption(merged);
  const key = buildGetCacheKey(url, axiosConfig);
  // `cache: false` is how callers refresh after a mutation, so it both skips the
  // cached value and replaces it: a request that was already in flight when the
  // mutation landed may return stale data, so we never join one, and whoever
  // reads through the cache next gets the post-mutation value rather than the
  // pre-mutation one that would otherwise sit there for the rest of the TTL.
  if (merged.cache === false) {
    getResponseCache.delete(key);
    return axiosGet(url, axiosConfig).then((response) => {
      storeGetResponse(key, response);
      return response;
    });
  }
  const now = Date.now();
  const hit = getResponseCache.get(key);
  if (hit && hit.expiresAt > now) {
    return Promise.resolve({
      data: cloneResponseData(hit.data),
      status: hit.status,
      statusText: hit.statusText,
      headers: hit.headers,
      config: { ...axiosConfig, url, method: 'get' },
      request: {},
    });
  }
  if (getInflight.has(key)) {
    return getInflight.get(key);
  }
  const pending = axiosGet(url, axiosConfig)
    .then((response) => {
      storeGetResponse(key, response);
      return response;
    })
    .finally(() => {
      getInflight.delete(key);
    });
  getInflight.set(key, pending);
  return pending;
};

if (!baseURL) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('NEXT_PUBLIC_API_URL is not set. API requests may fail.');
  }
}

const PROACTIVE_REFRESH_BUFFER_MS = 10 * 60 * 1000;

function getDisplayMessage(error) {
  if (!error || typeof error !== 'object') return 'Something went wrong';
  const fromBody = error?.response?.data?.error;
  if (typeof fromBody === 'string') return fromBody;
  if (error?.message && typeof error.message === 'string') return error.message;
  const status = error?.response?.status;
  if (status === 403) return 'You do not have permission to do this.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500)
    return 'The server encountered an error. Please try again later.';
  return 'Something went wrong. Please try again.';
}

function normalizeApiError(error) {
  const message = getDisplayMessage(error);
  if (error?.silentAuthRedirect) return Promise.reject(error);
  if (error instanceof Error) {
    if (typeof error.message !== 'string') error.message = message;
    return Promise.reject(error);
  }
  return Promise.reject(new Error(message));
}

let refreshPromise = null;
let onSessionInvalid = null;

// --- Cross-tab refresh coordination ------------------------------------
//
// The refresh token lives in localStorage, shared by every tab of the
// origin, but the backend rotates it single-use: a second /auth/refresh
// call with an already-consumed token gets a 401. `refreshPromise` above
// only dedupes concurrent refreshes *within* one tab -- two tabs racing to
// refresh at the same time will have one succeed and one get 401'd into a
// spurious logout. This lock makes only one tab actually hit the network;
// the rest wait for it to finish and reuse the tokens it wrote to storage.
const REFRESH_LOCK_KEY = 'closer_refresh_token_lock';
// How long a held lock is honoured before another tab is allowed to
// reclaim it. Covers a tab being closed or crashing mid-refresh.
const REFRESH_LOCK_STALE_MS = 15000;
// After claiming a free/stale lock, wait this long before trusting that no
// other tab claimed it in the same instant. localStorage has no
// compare-and-swap across tabs, so this is a write-then-verify pattern
// rather than a true atomic acquire.
const REFRESH_LOCK_CONFIRM_MS = 30;
const REFRESH_LOCK_POLL_MS = 150;
// Overall ceiling on how long a waiting tab sits in the acquire loop
// before giving up on coordination and refreshing itself. Second line of
// defence behind REFRESH_LOCK_STALE_MS: if this is ever hit, the worst
// case is one extra tab racing the network call, same as pre-fix
// behaviour, not a hang.
const REFRESH_LOCK_MAX_WAIT_MS = REFRESH_LOCK_STALE_MS * 2;

const refreshTabId = `${Date.now().toString(36)}-${Math.random()
  .toString(36)
  .slice(2)}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Returns a usable localStorage, or null if it's unavailable/throws
// (private browsing, blocked site data). Callers fall back to today's
// single-tab behaviour when this is null.
function getLockStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    const probeKey = '__closer_refresh_lock_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

function readRefreshLock(storage) {
  try {
    const raw = storage.getItem(REFRESH_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.owner !== 'string' ||
      typeof parsed.ts !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isRefreshLockStale(lock) {
  return !lock || Date.now() - lock.ts > REFRESH_LOCK_STALE_MS;
}

function writeRefreshLock(storage) {
  try {
    storage.setItem(
      REFRESH_LOCK_KEY,
      JSON.stringify({ owner: refreshTabId, ts: Date.now() }),
    );
    return true;
  } catch {
    return false;
  }
}

function releaseRefreshLock(storage) {
  try {
    const lock = readRefreshLock(storage);
    if (lock && lock.owner === refreshTabId) {
      storage.removeItem(REFRESH_LOCK_KEY);
    }
  } catch {
    // Best-effort -- a lock left behind here is reclaimed by
    // REFRESH_LOCK_STALE_MS anyway.
  }
}

// Waits for whichever tab holds the lock to finish (release it or go
// stale). Never rejects; just returns once the lock is free or the
// deadline passes.
async function waitForRefreshLockRelease(storage, deadline) {
  while (Date.now() < deadline) {
    const lock = readRefreshLock(storage);
    if (isRefreshLockStale(lock)) return;
    await sleep(REFRESH_LOCK_POLL_MS);
  }
}

// Tries to become the tab that performs the actual network refresh.
// Returns true once this tab owns the lock, false if it gave up waiting
// for/competing for it within the wait budget.
async function acquireRefreshLock(storage) {
  const deadline = Date.now() + REFRESH_LOCK_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const lock = readRefreshLock(storage);
    if (!isRefreshLockStale(lock)) {
      await waitForRefreshLockRelease(storage, deadline);
      continue;
    }
    if (!writeRefreshLock(storage)) return false;
    await sleep(REFRESH_LOCK_CONFIRM_MS);
    const confirmed = readRefreshLock(storage);
    if (confirmed && confirmed.owner === refreshTabId) return true;
    // Another tab's write landed after ours in the same window -- retry.
  }
  return false;
}

// Runs `performNetworkRefresh` on at most one tab at a time. Other tabs
// wait for that tab to finish and then re-read whatever it wrote to
// storage instead of racing it with their own /auth/refresh call.
async function coordinateCrossTabRefresh(performNetworkRefresh) {
  const storage = getLockStorage();
  if (!storage) {
    return performNetworkRefresh();
  }

  const existingLock = readRefreshLock(storage);
  if (!isRefreshLockStale(existingLock)) {
    // Someone else is already refreshing -- wait for them and reuse
    // whatever they wrote rather than duplicating the call. Snapshot the
    // refresh token first: the backend rotates it single-use, so the only
    // reliable sign the other tab actually succeeded is that this token
    // changed. A refresh that fails without an account mismatch (network
    // error, bad response) leaves the old token sitting in storage --
    // still truthy, but stale -- and treating that as success would hand
    // a dead access token back to the caller instead of a real one.
    const refreshTokenBeforeWait = getRefreshToken();
    await waitForRefreshLockRelease(
      storage,
      Date.now() + REFRESH_LOCK_MAX_WAIT_MS,
    );
    const token = getAccessToken();
    const tokenAfterWait = getRefreshToken();
    if (
      token &&
      tokenAfterWait &&
      tokenAfterWait !== refreshTokenBeforeWait
    ) {
      return { access_token: token, results: null };
    }
    // The other tab's refresh didn't rotate the token (it failed, or its
    // lock simply went stale while it was still mid-flight) -- fall
    // through and try to become the refresher ourselves.
  }

  const acquired = await acquireRefreshLock(storage);
  if (!acquired) {
    // Gave up waiting/competing for the lock -- do it ourselves rather
    // than hang. Worst case this duplicates the network call, the same
    // risk profile as before this coordination existed.
    return performNetworkRefresh();
  }

  try {
    return await performNetworkRefresh();
  } finally {
    releaseRefreshLock(storage);
  }
}

export function setOnSessionInvalid(fn) {
  onSessionInvalid = fn;
}

function isRefreshRequest(config) {
  const url = config?.url ?? '';
  return typeof url === 'string' && url.includes('/auth/refresh');
}

// Endpoints where a 401 means "wrong credentials", not "no interaction
// session". Retrying these would silently double every failed login attempt.
const CREDENTIAL_PATHS = ['/login', '/auth/'];

function isCredentialRequest(config) {
  const url = config?.url ?? '';
  if (typeof url !== 'string') return false;
  return CREDENTIAL_PATHS.some((path) => url.includes(path));
}

function notifySessionInvalid() {
  clearTokens();
  if (typeof onSessionInvalid === 'function') {
    onSessionInvalid();
  }
}

// Actually hits the network. Only ever invoked by the tab that holds the
// cross-tab refresh lock (or, in a degraded/no-storage environment, by
// whichever tab is refreshing at all -- see coordinateCrossTabRefresh).
function performNetworkRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    const err = new Error('Not authenticated');
    err.silentAuthRedirect = true;
    return Promise.reject(err);
  }
  return axios
    .post(
      `${baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
    .then((res) => {
      const {
        access_token: newAccess,
        refresh_token: newRefresh,
        results,
      } = res?.data ?? {};
      if (newAccess && newRefresh) {
        // The refresh token lives in localStorage, which is shared across
        // tabs and can hold a token from a different account than the one
        // this session belongs to. Never let a refresh silently switch
        // accounts: if the refreshed identity doesn't match, drop the
        // session and force a fresh login.
        const storedAccountId = getStoredAccountId();
        const refreshedAccountId = results?._id;
        if (
          storedAccountId &&
          refreshedAccountId &&
          storedAccountId !== refreshedAccountId
        ) {
          notifySessionInvalid();
          throw new Error('Refresh token belongs to a different account');
        }
        setTokens(newAccess, newRefresh);
        if (refreshedAccountId) {
          setStoredAccountId(refreshedAccountId);
        }
        return { access_token: newAccess, results };
      }
      throw new Error('Invalid refresh response');
    });
}

function doRefresh() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      const hadSession = Boolean(getAccessToken());
      if (hadSession) {
        notifySessionInvalid();
      }
      const err = new Error(
        hadSession ? 'Session expired' : 'Not authenticated',
      );
      err.silentAuthRedirect = true;
      refreshPromise = Promise.reject(err).finally(() => {
        refreshPromise = null;
      });
      return refreshPromise;
    }
    // The in-tab dedupe above only stops this tab from firing more than
    // one refresh at a time; coordinateCrossTabRefresh stops every other
    // tab of the origin from doing the same against the same (single-use)
    // refresh token. A tab that logs out mid-refresh (revokeRefreshToken)
    // doesn't touch this lock -- whichever tab holds it always releases it
    // in the `finally` inside coordinateCrossTabRefresh, success or not,
    // so there's nothing here for logout to deadlock against.
    refreshPromise = coordinateCrossTabRefresh(performNetworkRefresh).finally(
      () => {
        refreshPromise = null;
      },
    );
  }
  return refreshPromise;
}

// Best-effort server-side revocation of the current refresh token. Uses raw
// axios rather than the api instance so a 401 here can never trigger the
// refresh-and-retry interceptor mid-logout. Errors are swallowed: local
// logout must always complete even if the endpoint is down or not deployed.
export async function revokeRefreshToken() {
  if (typeof window === 'undefined') return;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  const accessToken = getAccessToken();
  try {
    await axios.post(
      `${baseURL}/auth/logout`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        timeout: 5000,
      },
    );
  } catch (err) {
    console.error('Failed to revoke refresh token on logout:', err);
  }
}

export async function refreshTokensProactively() {
  if (typeof window === 'undefined') return null;
  if (!getRefreshToken()) return null;
  const expiryMs = getAccessTokenExpiryMs();
  if (
    expiryMs === null ||
    expiryMs > Date.now() + PROACTIVE_REFRESH_BUFFER_MS
  ) {
    return null;
  }
  try {
    const r = await doRefresh();
    return { results: r?.results ?? null };
  } catch {
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  if (isRefreshRequest(config)) return config;

  if (typeof window !== 'undefined') {
    if (!getStoredInteractionSessionKey()) {
      await ensureInteractionSession();
    }
  }

  // Protect against Axios 1.x default paramsSerializer serializing nested JSON
  // objects into bracket notation (e.g. where[date][$gte]=...).
  // This automatically strings them just like formatSearch does.
  if (
    config.params &&
    typeof config.params.where === 'object' &&
    config.params.where !== null
  ) {
    config.params = {
      ...config.params,
      where: JSON.stringify(config.params.where),
    };
  }

  const headers = config.headers ?? {};
  const token = getAccessToken();
  if (token) {
    if (typeof headers.set === 'function') {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  const sessionKey = getStoredInteractionSessionKey();
  if (sessionKey) {
    if (typeof headers.set === 'function') {
      headers.set('X-Interaction-Session', sessionKey);
    } else {
      headers['X-Interaction-Session'] = sessionKey;
    }
  }
  config.headers = headers;
  return config;
});

const INTERACTION_HUMAN_RESPONSE_PATHS = [
  '/webinar',
  '/signup',
  '/login',
  '/subscribe',
];

function normalizeRequestPathname(url) {
  if (typeof url !== 'string' || !url.length) return null;
  let pathname;
  try {
    if (/^https?:\/\//i.test(url)) {
      pathname = new URL(url).pathname;
    } else {
      const withoutQuery = url.split('?')[0];
      pathname = withoutQuery.startsWith('/')
        ? withoutQuery
        : `/${withoutQuery}`;
    }
  } catch {
    return null;
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function shouldApplyInteractionIsHuman(url) {
  const pathname = normalizeRequestPathname(url);
  if (!pathname) return false;
  return INTERACTION_HUMAN_RESPONSE_PATHS.includes(pathname);
}

api.interceptors.response.use(
  (response) => {
    const url = response?.config?.url ?? '';
    if (shouldApplyInteractionIsHuman(url)) {
      applyInteractionIsHumanFromResponse(response?.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    if (
      error?.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }
    if (isRefreshRequest(originalRequest)) {
      notifySessionInvalid();
      return Promise.reject(error);
    }
    // Anonymous requests (public form submissions) are authorised by the
    // interaction session rather than a bearer token. A 401 here means the
    // session key was stale or never sent, so get a fresh one and retry once.
    if (
      typeof window !== 'undefined' &&
      !getAccessToken() &&
      !isCredentialRequest(originalRequest) &&
      !originalRequest._interactionRetry
    ) {
      originalRequest._interactionRetry = true;
      await refreshInteractionSession();
      if (getStoredInteractionSessionKey()) {
        return api(originalRequest);
      }
    }
    try {
      await doRefresh();
      const token = getAccessToken();
      if (token) {
        const headers = originalRequest.headers ?? {};
        if (typeof headers.set === 'function') {
          headers.set('Authorization', `Bearer ${token}`);
        } else {
          headers.Authorization = `Bearer ${token}`;
        }
        originalRequest.headers = headers;
      }
      originalRequest._retry = true;
      return api(originalRequest);
    } catch (refreshErr) {
      if (refreshErr?.silentAuthRedirect) {
        return Promise.reject(refreshErr);
      }
      notifySessionInvalid();
      return Promise.reject(refreshErr);
    }
  },
);

api.interceptors.response.use((response) => {
  const method = response?.config?.method?.toLowerCase();
  const url = response?.config?.url ?? '';
  if (
    (method === 'patch' || method === 'post' || method === 'put') &&
    typeof url === 'string' &&
    url.includes('/config/')
  ) {
    invalidateConfigCache();
  }
  return response;
}, normalizeApiError);

if (process.env.NEXT_PUBLIC_LOG_REQUESTS === 'true') {
  api.interceptors.request.use((req) => {
    console.log(req.method, req.url, req.params);
    return req;
  });
}

export default api;
