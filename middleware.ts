import createMiddleware from 'next-intl/middleware';
import {
  pathnames,
  locales,
  localePrefix,
  defaultLocale,
} from './locales.config';

export default createMiddleware({
  defaultLocale: defaultLocale,
  locales,
  pathnames,
  localePrefix,
});

export const config = {
  matcher: [
    '/',
  ],
};
