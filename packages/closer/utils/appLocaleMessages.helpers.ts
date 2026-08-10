import App from 'next/app';
import type { AppContext, AppInitialProps } from 'next/app';

import type { AbstractIntlMessages } from 'next-intl';

import { loadLocaleData } from './locale.helpers';

export async function appGetInitialPropsWithMessages(
  appContext: AppContext,
): Promise<AppInitialProps & { messages: AbstractIntlMessages }> {
  const appProps = await App.getInitialProps(appContext);
  const locale = appContext.ctx.locale || 'en';
  const messages = await loadLocaleData(
    locale,
    process.env.NEXT_PUBLIC_APP_NAME,
  );
  return { ...appProps, messages };
}
