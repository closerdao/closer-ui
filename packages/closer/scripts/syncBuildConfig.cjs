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
 *
 * A build that cannot fetch real config fails loudly: when neither API URL
 * env var is set the script exits 1 instead of silently keeping whatever
 * snapshot is on disk (which is how TDF's production config used to ship in
 * other builds). Deliberate offline work can opt back into the old behaviour
 * with ALLOW_STALE_CONFIG_SNAPSHOT=1.
 *
 * The fetched payload must also contain every slug in EXPECTED_CONFIG_SLUGS
 * (the buckets closer-api's ensureConfigs guarantees on every deployment);
 * a bucket silently disappearing from the API response would otherwise
 * degrade the build to schema defaults without any failure signal.
 */
require('./ensureBuildConfigSnapshotExists.cjs');

const fs = require('fs');
const path = require('path');

// Shared with syncBuildLocales.cjs / villageI18n.cjs, which read this
// snapshot back at build time — one definition so writer and readers agree.
const { SNAPSHOT_PATH: OUT } = require('./localeConstants.cjs');

const APPS_DIR = path.join(__dirname, '..', '..', '..', 'apps');

/**
 * Tailwind rebuilds its CSS when `tailwind.config.js` changes, and that config
 * builds the palette from the snapshot this script writes — but the snapshot is
 * a plain require, not something Tailwind watches. So writing a new colour into
 * it leaves a running dev server compiling the palette it started with, and the
 * only way out is restarting the process.
 *
 * Bumping each config's mtime is the signal Tailwind is already listening for.
 * It leaves file contents untouched, and only runs when the snapshot actually
 * changed, so a no-op sync does not trigger a rebuild.
 */
function touchTailwindConfigs(log = console) {
  let entries;
  try {
    entries = fs.readdirSync(APPS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const now = new Date();
  const touched = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(APPS_DIR, entry.name, 'tailwind.config.js');
    try {
      fs.utimesSync(configPath, now, now);
      touched.push(entry.name);
    } catch {
      // No config, or not writable — nothing to invalidate for this app.
    }
  }
  if (touched.length > 0) {
    log.log(
      `[sync-build-config] theme changed, nudged tailwind config for: ${touched.join(', ')}`,
    );
  }
  return touched;
}

/**
 * Config buckets that closer-api's ensureConfigs seeds on boot for every
 * deployment, so their absence from a /config response always indicates a
 * broken or misconfigured API rather than a legitimately empty platform.
 */
const EXPECTED_CONFIG_SLUGS = [
  'accounting-entities',
  'affiliate',
  'booking',
  'citizenship',
  'engagement',
  'fundraiser',
  'general',
  'payment',
  'subscriptions',
  'volunteering',
  'webinar',
];

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

/**
 * Strip userinfo (user:pass@) from a URL before logging so credentials
 * embedded in CONFIG_BUILD_API_URL / NEXT_PUBLIC_API_URL never reach
 * build logs or error output.
 */
function redactUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return String(url).replace(/\/\/[^@/]*@/, '//');
  }
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
        `[sync-build-config] Attempt ${attempt}/${MAX_ATTEMPTS} failed (${lastNetworkDetail}). URL: ${redactUrl(url)}`,
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
        `[sync-build-config] Attempt ${attempt}/${MAX_ATTEMPTS} got HTTP ${res.status} ${res.statusText}. URL: ${redactUrl(url)}`,
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
      `Config request failed after ${MAX_ATTEMPTS} attempts: HTTP ${lastHttpFailure.status} ${lastHttpFailure.statusText}. URL: ${redactUrl(url)}`,
    );
  }
  throw new Error(
    `Config API unreachable after ${MAX_ATTEMPTS} attempts (${lastNetworkDetail}). URL: ${redactUrl(url)}`,
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

/**
 * Opt-in escape hatch for deliberate offline work: when set to '1' a build
 * with no API URL keeps whatever snapshot is on disk instead of failing.
 */
function isStaleSnapshotAllowed(env) {
  return env.ALLOW_STALE_CONFIG_SNAPSHOT === '1';
}

/**
 * Return the EXPECTED_CONFIG_SLUGS missing from a fetched slug map.
 */
function getMissingExpectedSlugs(bySlug) {
  return EXPECTED_CONFIG_SLUGS.filter(
    (slug) => !Object.prototype.hasOwnProperty.call(bySlug || {}, slug),
  );
}

async function main() {
  const packageRoot = path.join(__dirname, '..');
  loadEnvFromDir(packageRoot);
  loadEnvFromDir(process.cwd(), { override: true });

  const { apiUrl, isOverride } = resolveConfigApiUrl(process.env);
  if (!apiUrl) {
    if (isStaleSnapshotAllowed(process.env)) {
      console.warn(
        '[sync-build-config] Neither CONFIG_BUILD_API_URL nor NEXT_PUBLIC_API_URL is set; ALLOW_STALE_CONFIG_SNAPSHOT=1, keeping existing snapshot.',
      );
      process.exit(0);
    }
    console.error(
      '[sync-build-config] Neither CONFIG_BUILD_API_URL nor NEXT_PUBLIC_API_URL is set. ' +
        'Refusing to build with a stale config snapshot. ' +
        'Set NEXT_PUBLIC_API_URL (or CONFIG_BUILD_API_URL), or set ALLOW_STALE_CONFIG_SNAPSHOT=1 for deliberate offline work.',
    );
    process.exit(1);
  }
  if (isOverride) {
    console.log(
      '[sync-build-config] Using CONFIG_BUILD_API_URL override instead of NEXT_PUBLIC_API_URL.',
    );
  }

  const base = apiUrl.replace(/\/$/, '');
  const url = `${base}/config?limit=500`;
  console.log('[sync-build-config] fetching', redactUrl(url));

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
      `[sync-build-config] Config response was not valid JSON. URL: ${redactUrl(url)}. ${err.message}`,
    );
    process.exit(1);
  }
  const bySlug = configPayloadToSlugMap(data);
  const missingSlugs = getMissingExpectedSlugs(bySlug);
  if (missingSlugs.length > 0) {
    console.error(
      `[sync-build-config] Config response is missing expected slug(s): ${missingSlugs.join(', ')}. ` +
        `URL: ${redactUrl(url)}. Refusing to build with an incomplete config.`,
    );
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const next = `${JSON.stringify(bySlug)}\n`;
  let previous = null;
  try {
    previous = fs.readFileSync(OUT, 'utf8');
  } catch {
    // First run — no snapshot to compare against.
  }
  fs.writeFileSync(OUT, next, 'utf8');
  console.log('[sync-build-config] wrote', OUT);
  if (previous !== next) {
    touchTailwindConfigs();
  }
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
  touchTailwindConfigs,
  fetchWithRetry,
  getMissingExpectedSlugs,
  isStaleSnapshotAllowed,
  redactUrl,
  resolveConfigApiUrl,
  EXPECTED_CONFIG_SLUGS,
  FETCH_TIMEOUT_MS,
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
};
