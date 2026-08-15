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

function resolveVillageI18n(snapshot = readSnapshot(), log = console) {
  const general =
    snapshot?.general && typeof snapshot.general === 'object'
      ? snapshot.general
      : {};
  const configured = Array.isArray(general.locales) ? general.locales : [];
  const locales = [];
  for (const entry of configured) {
    const locale =
      typeof entry === 'string' ? entry.trim().toLowerCase() : null;
    if (!locale) {
      log.warn(
        `[village-i18n] Ignoring malformed general.locales entry ${JSON.stringify(
          entry,
        )}: expected a locale string.`,
      );
      continue;
    }
    if (!BASE_LOCALES.includes(locale)) {
      log.warn(
        `[village-i18n] Configured general.locales entry "${locale}" has no base locale bundle (${BASE_LOCALES.join(
          ', ',
        )}); dropping it.`,
      );
      continue;
    }
    if (!locales.includes(locale)) locales.push(locale);
  }
  if (locales.length === 0) locales.push('en');

  const language =
    typeof general.language === 'string'
      ? general.language.trim().toLowerCase()
      : null;
  if (language && !locales.includes(language)) {
    log.warn(
      `[village-i18n] Configured general.language "${language}" is not an enabled locale (${locales.join(
        ', ',
      )}); falling back.`,
    );
  }
  const defaultLocale =
    language && locales.includes(language)
      ? language
      : locales.includes('en')
      ? 'en'
      : locales[0];
  return { locales, defaultLocale };
}

module.exports = { readSnapshot, resolveVillageI18n };
