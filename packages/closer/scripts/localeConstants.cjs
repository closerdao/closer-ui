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

const SNAPSHOT_PATH = path.join(
  __dirname,
  '..',
  'generated',
  'appConfig.snapshot.json',
);

function listBaseLocales(localesRoot = LOCALES_ROOT) {
  const locales = fs
    .readdirSync(localesRoot)
    .map((name) => {
      const match = /^base-([a-z]{2}(?:-[a-z0-9]+)?)\.json$/i.exec(name);
      return match ? match[1].toLowerCase() : null;
    })
    .filter(Boolean)
    .sort();
  return ['en', ...locales.filter((locale) => locale !== 'en')];
}

const BASE_LOCALES = listBaseLocales();

function normalizeLocale(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null;
}

function readJson(filePath, failureMessage, log = console) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (failureMessage) {
      log.warn(
        `${failureMessage} (${error && error.message ? error.message : error})`,
      );
      return {};
    }
    if (error.code === 'ENOENT') return {};
    throw new Error(`Invalid JSON: ${filePath} (${error.message})`);
  }
}

function warnNoBaseBundle(log, prefix, subject, consequence) {
  log.warn(
    `${prefix} ${subject} has no base locale bundle (${BASE_LOCALES.join(
      ', ',
    )}); ${consequence}`,
  );
}

module.exports = {
  BASE_LOCALES,
  LOCALES_ROOT,
  SNAPSHOT_PATH,
  listBaseLocales,
  normalizeLocale,
  readJson,
  warnNoBaseBundle,
};
