import createMiddleware from 'next-intl/middleware';

import {
  defaultLocale,
  localePrefix,
  locales,
  pathnames,
} from './locales.config';

export default createMiddleware({
  defaultLocale: defaultLocale,
  locales,
  pathnames,
  localePrefix,
});

export const config = {
  matcher: ['/'],
};
