/**
 * sync-build-config
 *
 * Fetches the platform config from the API at build time and writes it to
 * generated/appConfig.snapshot.json.
 *
 * Environment variables:
 * - CONFIG_BUILD_API_URL: optional override for the API base URL used ONLY by
 *   this build-time fetch. When set, config is fetched from
 *   `<CONFIG_BUILD_API_URL>/config?limit=500` instead of NEXT_PUBLIC_API_URL.
 *   Provisioning sets this to the app's default ingress hostname
 *   (e.g. https://<app>.ondigitalocean.app), which is immune to the DNS
 *   churn a freshly provisioned custom domain goes through.
 * - NEXT_PUBLIC_API_URL: the default API base URL (also used at runtime).
 *
 * The fetch is retried with exponential backoff (see RETRY_DELAYS_MS) on both
 * network-level errors and non-200 responses, because Vercel build containers
 * have transiently failed to resolve/route to freshly provisioned domains.
 */
require('./ensureBuildConfigSnapshotExists.cjs');

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'generated', 'appConfig.snapshot.json');

const FETCH_TIMEOUT_MS = 20000;
const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

function configPayloadToSlugMap(data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  const out = {};
  for (const row of results) {
    if (!row || typeof row.slug !== 'string') continue;
    const v = row.value;
    out[row.slug] =
      v != null && typeof v === 'object' && !Array.isArray(v) ? v : {};
  }
  return out;
}

function loadEnvFromDir(dir, { override = false } = {}) {
  const names = override
    ? ['.env', '.env.local']
    : ['.env.local', '.env'];
  for (const name of names) {
    const filePath = path.join(dir, name);
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (override || process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function describeFetchError(err) {
  const cause = err.cause;
  let detail = err.message || 'unknown error';
  if (cause && typeof cause === 'object') {
    if (cause.code) {
      detail = `${cause.code}${cause.message ? `: ${cause.message}` : ''}`;
    } else if (Array.isArray(cause.errors) && cause.errors.length > 0) {
      const first = cause.errors[0];
      detail =
        first && typeof first === 'object' && first.code
          ? `${first.code}${first.message ? `: ${first.message}` : ''}`
          : detail;
    }
  }
  if (err && err.name === 'AbortError') {
    detail = `timed out after ${FETCH_TIMEOUT_MS}ms`;
  }
  return detail;
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch `url` with bounded retries. Retries on network-level errors AND
 * non-200 responses, backing off per RETRY_DELAYS_MS between attempts.
 * Resolves with the ok Response; rejects with an Error whose message
 * distinguishes "unreachable after N attempts" (network) from
 * "HTTP <status>" (server responded, never ok).
 */
async function fetchWithRetry(
  url,
  { fetchImpl = fetch, sleep = defaultSleep, log = console } = {},
) {
  let lastNetworkDetail = null;
  let lastHttpFailure = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetchImpl(url, { signal: controller.signal });
    } catch (err) {
      lastNetworkDetail = describeFetchError(err);
      lastHttpFailure = null;
      log.warn(
        `[sync-build-config] Attempt ${attempt}/${MAX_ATTEMPTS} failed (${lastNetworkDetail}). URL: ${url}`,
      );
      res = null;
    } finally {
      clearTimeout(timeoutId);
    }

    if (res) {
      if (res.ok) return res;
      lastNetworkDetail = null;
      lastHttpFailure = { status: res.status, statusText: res.statusText };
      log.warn(
        `[sync-build-config] Attempt ${attempt}/${MAX_ATTEMPTS} got HTTP ${res.status} ${res.statusText}. URL: ${url}`,
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_DELAYS_MS[attempt - 1];
      log.warn(`[sync-build-config] Retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
  }

  if (lastHttpFailure) {
    throw new Error(
      `Config request failed after ${MAX_ATTEMPTS} attempts: HTTP ${lastHttpFailure.status} ${lastHttpFailure.statusText}. URL: ${url}`,
    );
  }
  throw new Error(
    `Config API unreachable after ${MAX_ATTEMPTS} attempts (${lastNetworkDetail}). URL: ${url}`,
  );
}

/**
 * Pick the API base URL for the build-time config fetch:
 * CONFIG_BUILD_API_URL wins over NEXT_PUBLIC_API_URL; null when neither is
 * set. Returns { apiUrl, isOverride }.
 */
function resolveConfigApiUrl(env) {
  const overrideUrl = env.CONFIG_BUILD_API_URL;
  const apiUrl = overrideUrl || env.NEXT_PUBLIC_API_URL || null;
  return { apiUrl, isOverride: Boolean(overrideUrl) };
}

async function main() {
  const packageRoot = path.join(__dirname, '..');
  loadEnvFromDir(packageRoot);
  loadEnvFromDir(process.cwd(), { override: true });

  const { apiUrl, isOverride } = resolveConfigApiUrl(process.env);
  if (!apiUrl) {
    console.warn(
      '[sync-build-config] Neither CONFIG_BUILD_API_URL nor NEXT_PUBLIC_API_URL is set; keeping existing snapshot.',
    );
    process.exit(0);
  }
  if (isOverride) {
    console.log(
      '[sync-build-config] Using CONFIG_BUILD_API_URL override instead of NEXT_PUBLIC_API_URL.',
    );
  }

  const base = apiUrl.replace(/\/$/, '');
  const url = `${base}/config?limit=500`;
  console.log('[sync-build-config] fetching', url);

  let res;
  try {
    res = await fetchWithRetry(url);
  } catch (err) {
    console.error(`[sync-build-config] ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error(
      `[sync-build-config] Config response was not valid JSON. URL: ${url}. ${err.message}`,
    );
    process.exit(1);
  }
  const bySlug = configPayloadToSlugMap(data);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(bySlug)}\n`, 'utf8');
  console.log('[sync-build-config] wrote', OUT);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(
      `[sync-build-config] Unexpected error: ${err && err.message ? err.message : String(err)}`,
    );
    process.exit(1);
  });
}

module.exports = {
  configPayloadToSlugMap,
  fetchWithRetry,
  resolveConfigApiUrl,
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
};
