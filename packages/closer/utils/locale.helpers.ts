export async function loadLocaleData(locale: string | undefined, appName: string | undefined) {
  let messagesLocalRes, messagesBaseRes;

  console.log('locale=', locale, 'appName=', appName);

  if (locale === 'en') {
    [messagesLocalRes, messagesBaseRes] = await Promise.all([
      import(`../locales/${appName}/en.json`),
      import('../locales/base-en.json'),
    ]);
  } else if (locale === 'pl') {
    [messagesLocalRes, messagesBaseRes] = await Promise.all([
      import(`../locales/${appName}/pl.json`),
      import('../locales/base-pl.json'),
    ]);
  }
  
  const messagesLocal = messagesLocalRes?.default;
  const messagesBase = messagesBaseRes?.default;
  const messages = { ...messagesBase, ...messagesLocal };

  return messages;
}
