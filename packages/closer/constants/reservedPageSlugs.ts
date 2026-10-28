import {
  getStandardPageDefinition,
  isStandardPageVirtualId,
  normalizePageSlug,
} from './standardPages';

/**
 * Top-level paths that Next serves from `pages/` or a redirect, so `pages/[slug]`
 * never renders them. Keyed by app folder (`NEXT_PUBLIC_APP_NAME`, with the
 * village-app sample alias). An unknown app uses only the routes every app
 * has, so a missing name does not block a path that belongs to one app.
 */
export const ALWAYS_RESERVED = [
  'api',
  '_next',
  'static',
  'images',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
];

export const APP_ROUTES: Record<string, readonly string[]> = {
  tdf: [
    '401',
    '404',
    'abela-art-faire',
    'admin',
    'affiliate',
    'airdrop',
    'applications',
    'artist',
    'artists',
    'ask',
    'blog',
    'bookings',
    'cafemenu',
    'channel',
    'chat',
    'citizenship',
    'cohousing',
    'community',
    'credits',
    'dashboard',
    'donate',
    'edit-channel',
    'events',
    'first-steps',
    'food',
    'fundraiser',
    'governance',
    'how-to-build-a-regenerative-village',
    'impact-map',
    'invest',
    'learn',
    'learn-more',
    'legacy',
    'legal',
    'listings',
    'login',
    'members',
    'pages',
    'privacy-policy',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roadmap',
    'roles',
    'sale',
    'search',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'tasks',
    'tickets',
    'token',
    'tokens',
    'volunteer',
    'webinar',
  ],
  earthbound: [
    '401',
    '404',
    'admin',
    'affiliate',
    'applications',
    'blog',
    'bookings',
    'channel',
    'citizenship',
    'cohousing',
    'community',
    'dashboard',
    'edit-channel',
    'events',
    'first-steps',
    'flyer',
    'food',
    'fundraiser',
    'invest',
    'learn',
    'legacy',
    'listings',
    'login',
    'members',
    'pages',
    'privacy-policy',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roles',
    'sale',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'tasks',
    'tickets',
    'token',
    'visit',
    'volunteer',
  ],
  closer: [
    '401',
    '404',
    'admin',
    'affiliate',
    'agent',
    'ambassadors',
    'applications',
    'blog',
    'bookings',
    'channel',
    'chat',
    'community',
    'credits',
    'dashboard',
    'donate',
    'edit-channel',
    'events',
    'first-steps',
    'food',
    'fundraiser',
    'invest',
    'learn',
    'legacy',
    'listings',
    'login',
    'map',
    'members',
    'pages',
    'philosophy',
    'pricing',
    'privacy-policy',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roadmap',
    'roles',
    'sale',
    'search',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'tasks',
    'tickets',
    'token',
    'village',
    'villages',
    'volunteer',
  ],
  lios: [
    '401',
    '404',
    'admin',
    'affiliate',
    'applications',
    'blog',
    'bookings',
    'channel',
    'community',
    'dashboard',
    'edit-channel',
    'events',
    'first-steps',
    'food',
    'learn',
    'legacy',
    'listings',
    'login',
    'members',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roles',
    'sale',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'tasks',
    'tickets',
    'token',
    'volunteer',
  ],
  moos: [
    '401',
    '404',
    'admin',
    'affiliate',
    'applications',
    'blog',
    'bookings',
    'channel',
    'community',
    'credits',
    'dashboard',
    'edit-channel',
    'events',
    'first-steps',
    'food',
    'history',
    'learn',
    'legacy',
    'legal',
    'listings',
    'login',
    'members',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roles',
    'sale',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'support-us',
    'tasks',
    'tickets',
    'token',
    'volunteer',
  ],
  'per-auset': [
    '401',
    '404',
    'admin',
    'affiliate',
    'applications',
    'blog',
    'bookings',
    'channel',
    'community',
    'dashboard',
    'edit-channel',
    'events',
    'first-steps',
    'food',
    'learn',
    'legacy',
    'listings',
    'login',
    'members',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roles',
    'sale',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'tasks',
    'tickets',
    'token',
    'volunteer',
  ],
  'village-app': [
    '401',
    '404',
    'admin',
    'affiliate',
    'applications',
    'blog',
    'bookings',
    'channel',
    'citizenship',
    'cohousing',
    'community',
    'dashboard',
    'edit-channel',
    'events',
    'first-steps',
    'food',
    'fundraiser',
    'learn',
    'legacy',
    'listings',
    'login',
    'members',
    'pages',
    'privacy-policy',
    'projects',
    'quests',
    'residencies',
    'resources',
    'roles',
    'sale',
    'settings',
    'signup',
    'social',
    'stay',
    'stripe-connect',
    'subscriptions',
    'tasks',
    'tickets',
    'token',
    'village',
    'visit',
    'volunteer',
  ],
  foz: ['dashboard', 'quests'],
};

/** Apps whose `pages/[slug].tsx` can render a custom page at the root. */
export const CUSTOM_PAGE_APPS = [
  'closer',
  'earthbound',
  'tdf',
  'village-app',
] as const;

const APP_ALIASES: Record<string, string> = {
  tdf: 'tdf',
  earthbound: 'earthbound',
  closer: 'closer',
  lios: 'lios',
  moos: 'moos',
  'per-auset': 'per-auset',
  perauset: 'per-auset',
  'village-app': 'village-app',
  'my-village': 'village-app',
  foz: 'foz',
};

const toSet = (segments: readonly string[]): Set<string> =>
  new Set([...ALWAYS_RESERVED, ...segments]);

const APP_SETS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(APP_ROUTES).map(([app, segments]) => [app, toSet(segments)]),
);

const SHARED = new Set<string>(ALWAYS_RESERVED);
const customPageRoutes = CUSTOM_PAGE_APPS.map((app) => APP_ROUTES[app]);
customPageRoutes[0]?.forEach((segment) => {
  if (customPageRoutes.every((list) => list?.includes(segment))) {
    SHARED.add(segment);
  }
});

const resolveAppKey = (appName?: string | null): string | null => {
  const raw =
    appName === undefined ? process.env.NEXT_PUBLIC_APP_NAME : appName;
  const key = String(raw ?? '')
    .trim()
    .toLowerCase();
  return APP_ALIASES[key] ?? null;
};

const reservedSegments = (appName?: string | null): Set<string> => {
  const app = resolveAppKey(appName);
  return app ? APP_SETS[app] : SHARED;
};

/** A slug the caller actually sent. Missing or blank is not treated as `/`. */
export const isProvidedSlugReserved = (
  slug: unknown,
  appName?: string | null,
): boolean => {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  return isReservedPageSlug(slug, appName);
};

const firstSegment = (slug: string): string => {
  const normalized = normalizePageSlug(slug);
  return normalized.replace(/^\//, '').split('/')[0]?.toLowerCase() ?? '';
};

export const isReservedPageSlug = (
  slug: string | null | undefined,
  appName?: string | null,
): boolean => {
  const normalized = normalizePageSlug(slug);
  if (getStandardPageDefinition(normalized)) return true;
  const segment = firstSegment(normalized);
  if (!segment) return true;
  return reservedSegments(appName).has(segment);
};

export const canSavePageSlug = (
  slug: string,
  page?: { isStandard?: boolean; _id?: string | null },
  appName?: string | null,
): boolean => {
  if (!isReservedPageSlug(slug, appName)) return true;
  const ownsStandardSlug =
    Boolean(getStandardPageDefinition(slug)) &&
    (page?.isStandard === true || isStandardPageVirtualId(page?._id));
  return ownsStandardSlug;
};
