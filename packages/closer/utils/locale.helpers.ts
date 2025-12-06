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
          default:
            return Promise.all([
              import('../locales/lios/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'tdf':
        switch (locale) {
          case 'en':
            return Promise.all([
              import('../locales/tdf/en.json'),
              import('../locales/base-en.json'),
            ]);
          case 'pt':
            return Promise.all([
              import('../locales/tdf/pt.json'),
              import('../locales/base-pt.json'),
            ]);
          case 'pl':
            return Promise.all([
              import('../locales/tdf/pl.json'),
              import('../locales/base-pl.json'),
            ]);
          default:
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
          case 'pt':
            return Promise.all([
              import('../locales/moos/pt.json'),
              import('../locales/base-pt.json'),
            ]);
          default:
            return Promise.all([
              import('../locales/moos/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'foz':
        switch (locale) {
          case 'en':
          default:
            return Promise.all([
              import('../locales/foz/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'per-auset':
        switch (locale) {
          case 'en':
          default:
            return Promise.all([
              import('../locales/per-auset/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'earthbound':
        switch (locale) {
          case 'en':
          default:
            return Promise.all([
              import('../locales/earthbound/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      case 'closer':
        switch (locale) {
          case 'en':
          default:
            return Promise.all([
              import('../locales/closer/en.json'),
              import('../locales/base-en.json'),
            ]);
        }
      default:
        console.warn(
          `Unsupported app: ${appName}, falling back to base English locale`,
        );
        return Promise.all([
          Promise.resolve({ default: {} }),
          import('../locales/base-en.json'),
        ]);
    }
  }

  if (!locale) {
    locale = 'en';
  }

  if (!appName) {
    console.warn('appName is undefined, falling back to base English locale');
    return import('../locales/base-en.json').then((res) => res.default || {});
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
