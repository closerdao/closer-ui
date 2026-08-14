require('./ensureBuildLocalesExist.cjs');

const fs = require('fs');
const path = require('path');

const {
  BASE_LOCALES,
  LOCALES_ROOT,
  SNAPSHOT_PATH,
  listBaseLocales,
} = require('./localeConstants.cjs');

const OUT_ROOT = path.join(__dirname, '..', 'generated', 'locales');

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
    // The whole overlay is being dropped — make that impossible to miss in a
    // build log, without failing the build.
    log.warn(
      [
        '[sync-build-locales] ============================================================',
        '[sync-build-locales] VILLAGE LOCALES OVERLAY IGNORED — malformed `locales` bucket.',
        '[sync-build-locales] Expected an object keyed by locale, e.g.',
        '[sync-build-locales]   { "en": { "stay_title": "..." }, "pt": { ... } }',
        '[sync-build-locales] but the config snapshot holds ' +
          (Array.isArray(bucket) ? 'an array' : `a ${typeof bucket}`) +
          '.',
        '[sync-build-locales] Every village string customization in this bucket is being',
        '[sync-build-locales] skipped; the build continues with pure base translations.',
        '[sync-build-locales] ============================================================',
      ].join('\n'),
    );
    return {};
  }
  const overlay = {};
  for (const [rawLocale, messages] of Object.entries(bucket)) {
    // Normalize the locale key the same way general.language is normalized
    // (villageI18n.cjs), so a "PT" or " pt " bucket still applies.
    const locale =
      typeof rawLocale === 'string'
        ? rawLocale.trim().toLowerCase()
        : rawLocale;
    if (!isPlainObject(messages)) {
      log.warn(
        `[sync-build-locales] Ignoring config locales overlay for "${locale}": expected an object of messages, got ` +
          (Array.isArray(messages) ? 'array' : typeof messages),
      );
      continue;
    }
    if (!BASE_LOCALES.includes(locale)) {
      // Only base locales are built (APP_LOCALES.village), so this overlay
      // would otherwise vanish without a trace.
      log.warn(
        `[sync-build-locales] Config locales overlay for "${locale}" has no base locale bundle (${BASE_LOCALES.join(
          ', ',
        )}); its messages will not appear in any built bundle.`,
      );
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
    overlay[locale] = { ...overlay[locale], ...clean };
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
