require('./ensureBuildConfigSnapshotExists.cjs');

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'generated', 'appConfig.snapshot.json');

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

function loadEnvFromDir(dir) {
  for (const name of ['.env.local', '.env']) {
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
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvFromDir(process.cwd());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.warn(
      '[sync-build-config] NEXT_PUBLIC_API_URL is not set; keeping existing snapshot.',
    );
    process.exit(0);
  }

  const base = apiUrl.replace(/\/$/, '');
  const url = `${base}/config?limit=500`;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    const cause = err.cause;
    let detail = err.message || 'unknown error';
    if (cause && typeof cause === 'object') {
      if (cause.code) detail = `${cause.code}${cause.message ? `: ${cause.message}` : ''}`;
      else if (Array.isArray(cause.errors) && cause.errors.length > 0) {
        const first = cause.errors[0];
        detail =
          first && typeof first === 'object' && first.code
            ? `${first.code}${first.message ? `: ${first.message}` : ''}`
            : detail;
      }
    }
    console.error(
      `[sync-build-config] Failed to fetch config (${detail}). URL: ${url}`,
    );
    process.exit(1);
  }

  if (!res.ok) {
    let bodyHint = '';
    try {
      const text = await res.text();
      if (text) bodyHint = ` Response: ${text.slice(0, 500)}`;
    } catch {
      /* ignore */
    }
    console.error(
      `[sync-build-config] Config request failed: ${res.status} ${res.statusText}. URL: ${url}.${bodyHint}`,
    );
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

main().catch((err) => {
  console.error(
    `[sync-build-config] Unexpected error: ${err && err.message ? err.message : String(err)}`,
  );
  process.exit(1);
});
