import type { PageSection, SectionType } from '../types/page';
import standardPageDefaults from './standardPages.defaults.json';

export type StandardPageKey =
  | 'home'
  | 'volunteer'
  | 'projects'
  | 'cohousing'
  | 'events'
  | 'stay'
  | 'token'
  | 'subscriptions'
  | 'citizenship'
  | 'fundraiser'
  | 'team'
  | 'press'
  | 'dataroom';

export interface StandardPageDefinition {
  key: StandardPageKey;
  slug: string;
  titleKey: string;
  feature: StandardPageFeature;
}

export type StandardPageFeature =
  | 'home'
  | 'volunteering'
  | 'cohousing'
  | 'events'
  | 'booking'
  | 'token'
  | 'subscriptions'
  | 'citizenship'
  | 'fundraiser'
  | 'team'
  | 'press'
  | 'dataroom';

export const STANDARD_PAGE_IDS_PREFIX = 'std:';

export const STANDARD_PAGES: Record<string, StandardPageDefinition> = {
  '/': {
    key: 'home',
    slug: '/',
    titleKey: 'pages_editor_standard_home',
    feature: 'home',
  },
  '/volunteer': {
    key: 'volunteer',
    slug: '/volunteer',
    titleKey: 'pages_editor_standard_volunteer',
    feature: 'volunteering',
  },
  '/projects': {
    key: 'projects',
    slug: '/projects',
    titleKey: 'pages_editor_standard_projects',
    feature: 'volunteering',
  },
  '/cohousing': {
    key: 'cohousing',
    slug: '/cohousing',
    titleKey: 'pages_editor_standard_cohousing',
    feature: 'cohousing',
  },
  '/events': {
    key: 'events',
    slug: '/events',
    titleKey: 'pages_editor_standard_events',
    feature: 'events',
  },
  '/stay': {
    key: 'stay',
    slug: '/stay',
    titleKey: 'pages_editor_standard_stay',
    feature: 'booking',
  },
  '/token': {
    key: 'token',
    slug: '/token',
    titleKey: 'pages_editor_standard_token',
    feature: 'token',
  },
  '/subscriptions': {
    key: 'subscriptions',
    slug: '/subscriptions',
    titleKey: 'pages_editor_standard_subscriptions',
    feature: 'subscriptions',
  },
  '/citizenship': {
    key: 'citizenship',
    slug: '/citizenship',
    titleKey: 'pages_editor_standard_citizenship',
    feature: 'citizenship',
  },
  '/fundraiser': {
    key: 'fundraiser',
    slug: '/fundraiser',
    titleKey: 'pages_editor_standard_fundraiser',
    feature: 'fundraiser',
  },
  '/team': {
    key: 'team',
    slug: '/team',
    titleKey: 'pages_editor_standard_team',
    feature: 'team',
  },
  '/press': {
    key: 'press',
    slug: '/press',
    titleKey: 'pages_editor_standard_press',
    feature: 'press',
  },
  '/dataroom': {
    key: 'dataroom',
    slug: '/dataroom',
    titleKey: 'pages_editor_standard_dataroom',
    feature: 'dataroom',
  },
};

export interface StandardPageDefaultDoc {
  title: string;
  slug: string;
  description?: string;
  ogImage?: string;
  sections: Array<{ type: string; data: Record<string, unknown> }>;
}

export const STANDARD_PAGE_DEFAULTS = standardPageDefaults as Record<
  string,
  StandardPageDefaultDoc
>;

export interface StandardPageFeatureToggle {
  enabled?: boolean;
}

export interface AppConfigForStandardPages {
  volunteering?: StandardPageFeatureToggle;
  cohousing?: StandardPageFeatureToggle;
  events?: StandardPageFeatureToggle;
  booking?: StandardPageFeatureToggle;
  subscriptions?: StandardPageFeatureToggle;
  citizenship?: StandardPageFeatureToggle;
  fundraiser?: StandardPageFeatureToggle;
}

export const isStandardPageFeatureEnabled = (
  feature: StandardPageFeature,
  config: AppConfigForStandardPages | null | undefined,
): boolean => {
  switch (feature) {
    // Every platform has a landing page, so the home page is never gated.
    case 'home':
      return true;
    case 'volunteering':
      return (
        process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true' &&
        Boolean(config?.volunteering?.enabled)
      );
    case 'cohousing':
      return Boolean(config?.cohousing?.enabled);
    case 'events':
      return config?.events?.enabled === true;
    case 'booking':
      return (
        process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true' &&
        Boolean(config?.booking?.enabled)
      );
    case 'token':
      return process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true';
    case 'subscriptions':
      return (
        process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true' &&
        Boolean(config?.subscriptions?.enabled)
      );
    case 'citizenship':
      return (
        process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' &&
        Boolean(config?.citizenship?.enabled)
      );
    case 'fundraiser':
      return (
        process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
        Boolean(config?.fundraiser?.enabled)
      );
    case 'team':
    case 'press':
    case 'dataroom':
      return true;
    default:
      return false;
  }
};

export const normalizePageSlug = (slug: string | undefined | null): string => {
  if (!slug) return '/';
  const trimmed = String(slug).trim();
  if (!trimmed || trimmed === '/') return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, '') || '/';
};

export const getStandardPageDefinition = (
  slug: string | undefined | null,
): StandardPageDefinition | null => {
  const normalized = normalizePageSlug(slug);
  return STANDARD_PAGES[normalized] ?? null;
};

export const isStandardPageSlug = (slug: string | undefined | null): boolean =>
  Boolean(getStandardPageDefinition(slug));

export const toStandardPageVirtualId = (slug: string): string =>
  `${STANDARD_PAGE_IDS_PREFIX}${normalizePageSlug(slug)}`;

export const isStandardPageVirtualId = (id: string | undefined | null): boolean =>
  Boolean(id && String(id).startsWith(STANDARD_PAGE_IDS_PREFIX));

export const slugFromStandardPageVirtualId = (
  id: string,
): string | null => {
  if (!isStandardPageVirtualId(id)) return null;
  return normalizePageSlug(String(id).slice(STANDARD_PAGE_IDS_PREFIX.length));
};

/**
 * The home page's slug is `/`, which leaves nothing to put in the editor route.
 * It gets this segment instead — `/home` is not a standard page, so nothing else
 * can claim it.
 */
export const HOME_PAGE_EDITOR_SEGMENT = 'home';

export const editorPathSegmentForPage = (page: {
  _id?: string;
  slug?: string;
  isStandard?: boolean;
}): string => {
  const slug = normalizePageSlug(page.slug);
  const isStandard =
    page.isStandard === true || Boolean(getStandardPageDefinition(slug));
  if (isStandard && slug === '/') {
    return HOME_PAGE_EDITOR_SEGMENT;
  }
  if (isStandard && slug) {
    return encodeURIComponent(slug.replace(/^\//, ''));
  }
  return String(page._id ?? '');
};

export const editorHrefForPage = (page: {
  _id?: string;
  slug?: string;
  isStandard?: boolean;
}): string => `/dashboard/pages/${editorPathSegmentForPage(page)}`;

export const resolveEditorRouteParam = (
  param: string | undefined | null,
): string => {
  if (!param) return '';
  const decoded = decodeURIComponent(String(param)).trim();
  if (!decoded) return '';
  if (isStandardPageVirtualId(decoded)) {
    return slugFromStandardPageVirtualId(decoded) ?? decoded;
  }
  if (decoded === HOME_PAGE_EDITOR_SEGMENT) {
    return '/';
  }
  if (decoded.startsWith('/')) {
    return normalizePageSlug(decoded);
  }
  if (/^[a-f\d]{24}$/i.test(decoded)) {
    return decoded;
  }
  if (
    getStandardPageDefinition(`/${decoded}`) ||
    getStandardPageDefinition(decoded)
  ) {
    return normalizePageSlug(decoded.startsWith('/') ? decoded : `/${decoded}`);
  }
  return decoded;
};

export const getEnabledStandardPages = (
  config: AppConfigForStandardPages | null | undefined,
): StandardPageDefinition[] =>
  Object.values(STANDARD_PAGES).filter((page) =>
    isStandardPageFeatureEnabled(page.feature, config),
  );

export const buildDefaultStandardPageDoc = (
  slug: string,
): {
  _id: string;
  title: string;
  slug: string;
  description: string;
  ogImage: string;
  sections: PageSection[];
  isStandard: true;
  isDefault: true;
} | null => {
  const normalized = normalizePageSlug(slug);
  const def = STANDARD_PAGES[normalized];
  const defaults = STANDARD_PAGE_DEFAULTS[normalized];
  if (!def || !defaults) return null;
  return {
    _id: toStandardPageVirtualId(normalized),
    title: defaults.title ?? '',
    slug: normalized,
    description: defaults.description ?? '',
    ogImage: defaults.ogImage ?? '',
    sections: (defaults.sections ?? []).map((section) => ({
      type: section.type as SectionType,
      data: section.data ?? {},
    })),
    isStandard: true,
    isDefault: true,
  };
};
