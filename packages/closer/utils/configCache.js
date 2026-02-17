import { buildMergedConfig } from './config.utils';

const CONFIG_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedRawConfigs = null;
let cachedKeyedConfig = null;
let cachedAt = 0;
let invalidatedAt = 0;

export const CONFIG_CACHE_TTL = CONFIG_CACHE_TTL_MS;

export function invalidateConfigCache() {
  invalidatedAt = Date.now();
  cachedRawConfigs = null;
  cachedKeyedConfig = null;
}

function isCacheValid() {
  if (!cachedRawConfigs || cachedAt === 0) return false;
  if (invalidatedAt > cachedAt) return false;
  if (Date.now() - cachedAt > CONFIG_CACHE_TTL_MS) return false;
  return true;
}

async function fetchAndCacheConfig(apiClient) {
  const res = await apiClient.get('/config', { params: { limit: 500 } });
  cachedRawConfigs = res.data?.results ?? [];
  cachedKeyedConfig = buildMergedConfig(cachedRawConfigs);
  cachedAt = Date.now();
}

export async function getConfig(apiClient) {
  if (!isCacheValid()) await fetchAndCacheConfig(apiClient);
  return cachedKeyedConfig;
}

export async function getConfigArray(apiClient) {
  if (!isCacheValid()) await fetchAndCacheConfig(apiClient);
  return cachedRawConfigs;
}

export function getConfigBySlug(keyedConfig, slug) {
  if (!keyedConfig || typeof keyedConfig !== 'object') return null;
  const value = keyedConfig[slug];
  return value != null ? { slug, value } : null;
}

export function getConfigValueBySlug(keyedConfig, slug) {
  if (!keyedConfig || typeof keyedConfig !== 'object') return null;
  return keyedConfig[slug] ?? null;
}

export const CONFIG_FILTER_KEY = '__';
