require('./ensureBuildLocalesExist.cjs');

const fs = require('fs');
const path = require('path');

const LOCALES_ROOT = path.join(__dirname, '..', 'locales');
const OUT_ROOT = path.join(__dirname, '..', 'generated', 'locales');
const SNAPSHOT_PATH = path.join(
  __dirname,
  '..',
  'generated',
  'appConfig.snapshot.json',
);

/**
 * Every locale that has a locales/base-<locale>.json file. Adding a new base
 * translation file automatically extends the village bundle to that locale.
 */
function listBaseLocales(localesRoot = LOCALES_ROOT) {
  const locales = fs
    .readdirSync(localesRoot)
    .map((name) => {
      const match = /^base-([a-z]{2}(?:-[a-z0-9]+)?)\.json$/i.exec(name);
      return match ? match[1].toLowerCase() : null;
    })
    .filter(Boolean)
    .sort();
  // English first: it is the fallback underlay and the default locale.
  return ['en', ...locales.filter((locale) => locale !== 'en')];
}

const BASE_LOCALES = listBaseLocales();

const APP_LOCALES = {
  lios: ['en', 'pl'],
  tdf: ['en', 'pt'],
  moos: ['en', 'pt'],
  'per-auset': ['en'],
  earthbound: ['en'],
  closer: ['en'],
  // No locales/village/ overlay directory exists on purpose: every village
  // shares the same brand-neutral base bundle. Per-village customization
  // arrives exclusively through the build-time config snapshot's `locales`
  // bucket (see readVillageLocalesOverlay) so a village's strings live in its
  // own DB, never in this repo. The bundle is built for every base locale so
  // a village's configured language (general.language) can pick one.
  village: BASE_LOCALES,
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[sync-build-locales] Invalid JSON: ${filePath}`);
    throw e;
  }
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Extract the per-locale message overlay a village stores in its own config
 * (the `locales` bucket of the /config payload snapshotted by
 * syncBuildConfig.cjs). Expected shape:
 *
 *   { "locales": { "en": { "key": "message", ... }, "pt": { ... } } }
 *
 * Absent bucket (every current village) → {} and the pure-base bundle ships
 * exactly as today. A malformed bucket, locale, or message value is warned
 * about and skipped — a bad overlay row must never fail the build.
 */
function readVillageLocalesOverlay(snapshot, log = console) {
  if (!isPlainObject(snapshot)) return {};
  const bucket = snapshot.locales;
  if (bucket == null) return {};
  if (!isPlainObject(bucket)) {
    log.warn(
      '[sync-build-locales] Ignoring config `locales` bucket: expected an object keyed by locale, got ' +
        (Array.isArray(bucket) ? 'array' : typeof bucket),
    );
    return {};
  }
  const overlay = {};
  for (const [locale, messages] of Object.entries(bucket)) {
    if (!isPlainObject(messages)) {
      log.warn(
        `[sync-build-locales] Ignoring config locales overlay for "${locale}": expected an object of messages, got ` +
          (Array.isArray(messages) ? 'array' : typeof messages),
      );
      continue;
    }
    const clean = {};
    for (const [key, value] of Object.entries(messages)) {
      if (typeof value !== 'string') {
        log.warn(
          `[sync-build-locales] Ignoring config locales overlay key "${locale}.${key}": message must be a string`,
        );
        continue;
      }
      clean[key] = value;
    }
    overlay[locale] = clean;
  }
  return overlay;
}

/**
 * Merge order for an app bundle:
 *
 *   base-en  <  base-<locale>  <  locales/<app>/<locale>.json  <  config overlay
 *
 * The base-en underlay applies only to the village bundle: base-pt/base-pl
 * are partial translations, and next-intl renders raw key paths for missing
 * messages, so a village building in a non-en language must fall back to
 * English per key. Legacy apps keep their historical merge (no underlay) so
 * their bundles stay byte-identical.
 */
function mergeMessages(app, locale, villageOverlay = {}) {
  const base = readJson(path.join(LOCALES_ROOT, `base-${locale}.json`));
  const appMessages = readJson(path.join(LOCALES_ROOT, app, `${locale}.json`));
  if (app !== 'village') {
    return { ...base, ...appMessages };
  }
  const baseEn =
    locale === 'en'
      ? {}
      : readJson(path.join(LOCALES_ROOT, 'base-en.json'));
  const configOverlay = isPlainObject(villageOverlay[locale])
    ? villageOverlay[locale]
    : {};
  return { ...baseEn, ...base, ...appMessages, ...configOverlay };
}

function main() {
  const snapshot = readJson(SNAPSHOT_PATH);
  const villageOverlay = readVillageLocalesOverlay(snapshot);
  for (const [app, locales] of Object.entries(APP_LOCALES)) {
    const appDir = path.join(OUT_ROOT, app);
    fs.mkdirSync(appDir, { recursive: true });
    for (const locale of locales) {
      const merged = mergeMessages(app, locale, villageOverlay);
      const outPath = path.join(appDir, `${locale}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(merged)}\n`, 'utf8');
      console.log('[sync-build-locales] wrote', outPath);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  APP_LOCALES,
  BASE_LOCALES,
  SNAPSHOT_PATH,
  listBaseLocales,
  mergeMessages,
  readVillageLocalesOverlay,
};
