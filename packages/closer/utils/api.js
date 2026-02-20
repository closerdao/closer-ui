import axios from 'axios';

import {
  clearTokens,
  getAccessToken,
  getAccessTokenExpiryMs,
  getRefreshToken,
  setTokens,
} from './authStorage';
import { invalidateConfigCache } from './configCache';

export const formatSearch = (where) =>
  encodeURIComponent(JSON.stringify(where));
export const cdn = process.env.NEXT_PUBLIC_CDN_URL;

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({ baseURL });

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
      const err = new Error(hadSession ? 'Session expired' : 'Not authenticated');
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

api.interceptors.request.use((config) => {
  if (isRefreshRequest(config)) return config;
  const token = getAccessToken();
  if (token) {
    const headers = config.headers ?? {};
    if (typeof headers.set === 'function') {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
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

api.interceptors.response.use(
  (response) => {
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
  },
  normalizeApiError,
);

if (process.env.NEXT_PUBLIC_LOG_REQUESTS === 'true') {
  api.interceptors.request.use((req) => {
    console.log(req.method, req.url, req.params);
    return req;
  });
}

export default api;
