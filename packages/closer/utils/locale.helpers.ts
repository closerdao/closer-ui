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
      case 'foz':
        switch (localeKey) {
          case 'en':
          default:
            return import('../generated/locales/foz/en.json');
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
      default:
        console.warn(
          `Unsupported app: ${appKey}, falling back to base English locale`,
        );
        return import('../generated/locales/closer/en.json');
    }
  }

  let localeKey = locale || 'en';

  if (!appName) {
    console.warn('appName is undefined, falling back to base English locale');
    const res = await import('../generated/locales/closer/en.json');
    return (res.default || {}) as AbstractIntlMessages;
  }

  const mod = await importMergedLocale(localeKey, appName);
  return (mod.default || {}) as AbstractIntlMessages;
}
