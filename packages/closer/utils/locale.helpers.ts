import type { AbstractIntlMessages } from 'next-intl';

export async function loadLocaleData(
  locale: string | undefined,
  appName: string | undefined,
): Promise<AbstractIntlMessages> {
  async function importMergedLocale(localeKey: string, appKey: string) {
    switch (appKey) {
      case 'lios':
        switch (localeKey) {
          case 'pl':
            return import('../generated/locales/lios/pl.json');
          case 'en':
          default:
            return import('../generated/locales/lios/en.json');
        }
      case 'tdf':
        switch (localeKey) {
          case 'pt':
            return import('../generated/locales/tdf/pt.json');
          case 'en':
          default:
            return import('../generated/locales/tdf/en.json');
        }
      case 'moos':
        switch (localeKey) {
          case 'pt':
            return import('../generated/locales/moos/pt.json');
          case 'en':
          default:
            return import('../generated/locales/moos/en.json');
        }
      case 'per-auset':
        switch (localeKey) {
          case 'en':
          default:
            return import('../generated/locales/per-auset/en.json');
        }
      case 'earthbound':
        switch (localeKey) {
          case 'en':
          default:
            return import('../generated/locales/earthbound/en.json');
        }
      case 'closer':
        switch (localeKey) {
          case 'en':
          default:
            return import('../generated/locales/closer/en.json');
        }
      case 'village':
        return importVillageLocale(localeKey);
      default:
        // Any app name outside the legacy list is a provisioned village slug
        // (NEXT_PUBLIC_APP_NAME, see #948): serve the shared village bundle
        // in the requested locale. This is the correct path, not an error —
        // only a missing appName (handled below) warrants a warning. The
        // bundle exists for every base locale (syncBuildLocales.cjs builds
        // village/<locale>.json from locales/base-<locale>.json); adding a
        // new base language means adding a case here too, since Next.js
        // needs static import paths.
        return importVillageLocale(localeKey);
    }
  }

  async function importVillageLocale(localeKey: string) {
    switch (localeKey) {
      case 'pt':
        return import('../generated/locales/village/pt.json');
      case 'pl':
        return import('../generated/locales/village/pl.json');
      case 'en':
      default:
        return import('../generated/locales/village/en.json');
    }
  }

  let localeKey = locale || 'en';

  if (!appName) {
    console.warn('appName is undefined, falling back to base English locale');
    const res = await import('../generated/locales/village/en.json');
    return (res.default || {}) as AbstractIntlMessages;
  }

  const mod = await importMergedLocale(localeKey, appName);
  return (mod.default || {}) as AbstractIntlMessages;
}
