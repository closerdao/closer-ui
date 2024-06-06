import { Pathnames } from 'next-intl/navigation';

export type Locales = readonly string[];

export const locales: Locales = ['en'] as const;

export const defaultLocale = 'en';

export const pathnames = {
  '/': '/',
} satisfies Pathnames<typeof locales>;

export const localePrefix = 'as-needed';

export type AppPathnames = keyof typeof pathnames;
