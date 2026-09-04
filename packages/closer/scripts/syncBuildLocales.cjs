require('./ensureBuildLocalesExist.cjs');

const fs = require('fs');
const path = require('path');

const {
  BASE_LOCALES,
  LOCALES_ROOT,
  SNAPSHOT_PATH,
  normalizeLocale,
  readJson,
  warnNoBaseBundle,
} = require('./localeConstants.cjs');

const OUT_ROOT = path.join(__dirname, '..', 'generated', 'locales');

const APP_LOCALES = {
  lios: ['en', 'pl'],
  tdf: ['en', 'pt'],
  moos: ['en', 'pt'],
  'per-auset': ['en'],
  earthbound: ['en'],
  closer: ['en'],
  village: BASE_LOCALES,
};

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function readVillageLocalesOverlay(snapshot, log = console) {
  if (!isPlainObject(snapshot)) return {};
  const bucket = snapshot.locales;
  if (bucket == null) return {};
  if (!isPlainObject(bucket)) {
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
    const locale = normalizeLocale(rawLocale);
    if (!isPlainObject(messages)) {
      log.warn(
        `[sync-build-locales] Ignoring config locales overlay for "${locale}": expected an object of messages, got ` +
          (Array.isArray(messages) ? 'array' : typeof messages),
      );
      continue;
    }
    if (!BASE_LOCALES.includes(locale)) {
      warnNoBaseBundle(
        log,
        '[sync-build-locales]',
        `Config locales overlay for "${locale}"`,
        'its messages will not appear in any built bundle.',
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
  mergeMessages,
  readVillageLocalesOverlay,
};
