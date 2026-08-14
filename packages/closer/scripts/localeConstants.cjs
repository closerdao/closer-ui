/**
 * Shared build-time locale/config constants.
 *
 * This module is deliberately tiny and side-effect-free (no ensure-* scripts,
 * no bundle writing): it is required both by the sync scripts and by the
 * village-app's next.config.js (via villageI18n.cjs), which is evaluated on
 * every `next build`/`next dev` — config resolution must not run the locale
 * sync machinery.
 */
const fs = require('fs');
const path = require('path');

const LOCALES_ROOT = path.join(__dirname, '..', 'locales');

/**
 * Where syncBuildConfig.cjs writes the per-app config snapshot and where the
 * locale overlay + village i18n resolution read it back. Single definition so
 * writer and readers can never drift apart.
 */
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

module.exports = { BASE_LOCALES, LOCALES_ROOT, SNAPSHOT_PATH, listBaseLocales };
