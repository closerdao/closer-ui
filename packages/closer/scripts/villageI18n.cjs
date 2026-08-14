/**
 * Build-time i18n resolution for provisioned village apps.
 *
 * A village's language choice lives in its own DB config (`general.language`,
 * mirroring how `general.timeZone` beats the env fallback) and reaches the
 * build via the appConfig snapshot written by syncBuildConfig.cjs. The
 * village-app's next.config.js calls resolveVillageI18n() to turn that into
 * Next's static i18n block: all base locales are routable, and the configured
 * language becomes the default locale.
 *
 * An absent, malformed, or unsupported language value falls back to 'en' —
 * today's behavior — and never fails the build.
 */
const fs = require('fs');

// localeConstants.cjs, not syncBuildLocales.cjs: this module is loaded by the
// village-app's next.config.js, and config resolution must not pull in the
// sync script (whose require runs ensureBuildLocalesExist as a side effect).
const { BASE_LOCALES, SNAPSHOT_PATH } = require('./localeConstants.cjs');

function readSnapshot(snapshotPath = SNAPSHOT_PATH, log = console) {
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } catch (error) {
    // A corrupt/unreadable snapshot silently building an English-only village
    // would be hard to trace, so say what happened — but still never fail.
    log.warn(
      `[village-i18n] Could not read appConfig snapshot at ${snapshotPath} (${
        error && error.message ? error.message : error
      }); falling back to default English i18n.`,
    );
    return {};
  }
}

/**
 * @param {object} [snapshot] parsed appConfig.snapshot.json (slug-keyed);
 *   defaults to reading it from disk.
 * @returns {{ locales: string[], defaultLocale: string }}
 */
function resolveVillageI18n(snapshot = readSnapshot(), log = console) {
  const locales = [...BASE_LOCALES];
  const language =
    snapshot &&
    typeof snapshot === 'object' &&
    snapshot.general &&
    typeof snapshot.general === 'object' &&
    typeof snapshot.general.language === 'string'
      ? snapshot.general.language.toLowerCase().trim()
      : null;
  if (language && !locales.includes(language)) {
    log.warn(
      `[village-i18n] Configured general.language "${language}" has no base locale bundle (${locales.join(
        ', ',
      )}); defaulting to en.`,
    );
  }
  const defaultLocale =
    language && locales.includes(language) ? language : 'en';
  return { locales, defaultLocale };
}

module.exports = { readSnapshot, resolveVillageI18n };
