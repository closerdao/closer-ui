export async function loadLocaleData(
  locale: string | undefined,
  appName: string | undefined,
) {
  // we have to hardcode all import paths because otherwise webpack wouldn't pick them up from variables
  async function importLocaleData(locale: string, appName: string) {
    switch (appName) {
      case 'lios':
        switch (locale) {
          case 'en':
            return Promise.all([
              import('../locales/lios/en.json'),
              import('../locales/base-en.json'),
            ]);
          case 'pl':
            return Promise.all([
              import('../locales/lios/pl.json'),
              import('../locales/base-pl.json'),
            ]);
        }
      case 'tdf':
        switch (locale) {
          case 'en':
            return Promise.all([
              import('../locales/tdf/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'moos':
        switch (locale) {
          case 'en':
            return Promise.all([
              import('../locales/moos/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'foz':
        switch (locale) {
          case 'en':
            return Promise.all([
              import('../locales/foz/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'per-auset':
        switch (locale) {
          case 'en':
            return Promise.all([
              import('../locales/per-auset/en.json'),
              import('../locales/base-en.json'),
            ]);
          default:
            return Promise.all([
              import('../locales/per-auset/en.json'),
              import('../locales/base-en.json'),
            ]);
        }

      default:
        throw new Error(`Unsupported app: ${appName}`);
    }
  }

  if (!locale) {
    throw new Error('Locale is undefined');
  }

  if (!appName) {
    throw new Error('appName is undefined');
  }

  const [messagesLocalRes, messagesBaseRes] = await importLocaleData(
    locale,
    appName,
  );

  const messagesLocal = messagesLocalRes?.default;
  const messagesBase = messagesBaseRes?.default;
  const messages = { ...messagesBase, ...messagesLocal };

  return messages || {};
}
