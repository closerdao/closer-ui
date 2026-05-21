import axios from 'axios';

import {
  clearTokens,
  getAccessToken,
  getAccessTokenExpiryMs,
  getRefreshToken,
  setTokens,
} from './authStorage';
import { invalidateConfigCache } from './configCache';
import {
  applyInteractionIsHumanFromResponse,
  ensureInteractionSession,
  getStoredInteractionSessionKey,
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

function omitCacheOption(config) {
  if (!config || config.cache === undefined) return config;
  const next = { ...config };
  delete next.cache;
  return next;
}

const axiosGet = api.get.bind(api);
api.get = function getWithCache(url, config) {
  const merged = config ?? {};
  if (merged.cache === false || typeof window === 'undefined') {
    return axiosGet(url, omitCacheOption(merged));
  }
  const axiosConfig = omitCacheOption(merged);
  const key = buildGetCacheKey(url, axiosConfig);
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
      getResponseCache.set(key, {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
      });
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

export function setOnSessionInvalid(fn) {
  onSessionInvalid = fn;
}

function isRefreshRequest(config) {
  const url = config?.url ?? '';
  return typeof url === 'string' && url.includes('/auth/refresh');
}

function notifySessionInvalid() {
  clearTokens();
  if (typeof onSessionInvalid === 'function') {
    onSessionInvalid();
  }
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
    refreshPromise = axios
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
          setTokens(newAccess, newRefresh);
          return { access_token: newAccess, results };
        }
        throw new Error('Invalid refresh response');
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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

function shouldApplyInteractionIsHuman(url) {
  if (typeof url !== 'string') return false;
  return INTERACTION_HUMAN_RESPONSE_PATHS.some(
    (path) => url === path || url.endsWith(path),
  );
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
