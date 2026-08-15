const {
  BASE_LOCALES,
  SNAPSHOT_PATH,
  normalizeLocale,
  readJson,
  warnNoBaseBundle,
} = require('./localeConstants.cjs');

function readSnapshot(snapshotPath = SNAPSHOT_PATH, log = console) {
  return readJson(
    snapshotPath,
    `[village-i18n] Could not read appConfig snapshot at ${snapshotPath}; falling back to English-only i18n.`,
    log,
  );
}

function resolveVillageI18n(snapshot = readSnapshot(), log = console) {
  const general =
    snapshot?.general && typeof snapshot.general === 'object'
      ? snapshot.general
      : {};
  const configured = Array.isArray(general.locales) ? general.locales : [];
  const locales = [];
  for (const entry of configured) {
    const locale = normalizeLocale(entry);
    if (!locale) {
      log.warn(
        `[village-i18n] Ignoring malformed general.locales entry ${JSON.stringify(
          entry,
        )}: expected a locale string.`,
      );
      continue;
    }
    if (!BASE_LOCALES.includes(locale)) {
      warnNoBaseBundle(
        log,
        '[village-i18n]',
        `Configured general.locales entry "${locale}"`,
        'dropping it.',
      );
      continue;
    }
    if (!locales.includes(locale)) locales.push(locale);
  }
  if (locales.length === 0) locales.push('en');

  const language = normalizeLocale(general.language);
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
