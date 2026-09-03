import type { PageSection, SectionType } from '../types/page';
import { getBuildTimeConfigValue } from '../utils/buildTimeConfig.helpers';
import { buildHomePageDefaults } from './homePageDefaults';
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
  | 'fundraiser';

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
  | 'fundraiser';

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
};

export interface StandardPageDefaultDoc {
  title: string;
  slug: string;
  description?: string;
  ogImage?: string;
  sections: Array<{ type: string; data: Record<string, unknown> }>;
}

/**
 * Shipped starting content for every standard page except `/`, which is
 * generated from the village's data (see `buildHomePageDefaults`). The copy is
 * village-neutral: anything that names the village goes through a
 * `{{placeholder}}` filled in by `interpolateVillageData`.
 */
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
    default:
      return false;
  }
};

const configSection = (slug: string): StandardPageFeatureToggle | undefined => {
  const value = getBuildTimeConfigValue(slug);
  return value ? (value as StandardPageFeatureToggle) : undefined;
};

/** The feature toggles the standard pages are gated on, from the build-time config snapshot. */
export const getStandardPagesFeatureConfig = (): AppConfigForStandardPages => ({
  volunteering: configSection('volunteering'),
  cohousing: configSection('cohousing'),
  events: configSection('events'),
  booking: configSection('booking'),
  subscriptions: configSection('subscriptions'),
  citizenship: configSection('citizenship'),
  fundraiser: configSection('fundraiser'),
});

/**
 * What the shipped defaults know about the village they are rendered for.
 * Everything comes from the build-time config snapshot, so it is available on
 * the server and the client alike and never changes between the two.
 */
export interface StandardPageVillageData {
  platformName: string;
  /** English display name of `general.country`, or '' when unset/unknown. */
  countryName: string;
  teamEmail: string;
  /** Booking token symbol without the `$`, or '' when the village has none. */
  tokenSymbol: string;
  citizenshipTokensRequired: number | null;
  citizenshipMinStayDays: number | null;
  features: Record<StandardPageFeature, boolean>;
}

const asString = (value: unknown): string =>
  value == null ? '' : String(value).trim();

const asPositiveNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const countryDisplayName = (code: string): string => {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return '';
  try {
    // Always English: the defaults are English copy, and a fixed locale keeps
    // the server and the visitor's browser rendering the same string.
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = names.of(normalized);
    return name && name !== normalized ? name : '';
  } catch {
    return '';
  }
};

export const getStandardPageVillageData = (): StandardPageVillageData => {
  const general = getBuildTimeConfigValue('general') ?? {};
  const token = getBuildTimeConfigValue('token') ?? {};
  const citizenship = getBuildTimeConfigValue('citizenship') ?? {};
  const featureConfig = getStandardPagesFeatureConfig();
  const features = (
    Object.values(STANDARD_PAGES).map((def) => def.feature) as StandardPageFeature[]
  ).reduce(
    (acc, feature) => {
      acc[feature] = isStandardPageFeatureEnabled(feature, featureConfig);
      return acc;
    },
    {} as Record<StandardPageFeature, boolean>,
  );
  return {
    platformName: asString(general.platformName),
    countryName: countryDisplayName(asString(general.country)),
    teamEmail: asString(general.teamEmail),
    tokenSymbol: asString(token.bookingToken).replace(/^\$/, ''),
    citizenshipTokensRequired: asPositiveNumber(citizenship.tokensRequired),
    citizenshipMinStayDays: asPositiveNumber(citizenship.minVouchingStayDuration),
    features,
  };
};

/**
 * The `{{placeholders}}` the defaults JSON may use, and what each resolves to
 * when the village has not configured the underlying value. Every fallback is
 * chosen so the surrounding sentence still reads correctly.
 */
export const villagePlaceholderValues = (
  village: StandardPageVillageData,
): Record<string, string> => {
  const platformName = village.platformName || 'our village';
  return {
    platformName,
    countryName: village.countryName,
    teamEmail: village.teamEmail,
    // "Learn about $TDF" / "Learn about Sunset Valley tokens"
    tokenName: village.tokenSymbol
      ? `$${village.tokenSymbol}`
      : `${platformName} tokens`,
    // "Hold 30+ tokens" / "Hold the required tokens"
    citizenshipTokensRequired:
      village.citizenshipTokensRequired != null
        ? `${village.citizenshipTokensRequired}+`
        : 'the required',
    // "Spend 14 days on the land" / "Spend time on the land"
    citizenshipStayRequirement:
      village.citizenshipMinStayDays != null
        ? `${village.citizenshipMinStayDays} days`
        : 'time',
  };
};

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export const interpolateVillageData = <T>(
  value: T,
  village: StandardPageVillageData,
): T => {
  const values = villagePlaceholderValues(village);
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return node.replace(PLACEHOLDER_PATTERN, (_, key: string) =>
        values[key] ?? '',
      );
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      return Object.fromEntries(
        Object.entries(node as Record<string, unknown>).map(([k, v]) => [
          k,
          walk(v),
        ]),
      );
    }
    return node;
  };
  return walk(value) as T;
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

/**
 * The shipped defaults for a standard page, filled in with the village's data.
 * `/` is generated outright from that data; every other page comes from the
 * defaults JSON with its placeholders resolved.
 */
export const getStandardPageDefaults = (
  slug: string,
  village: StandardPageVillageData = getStandardPageVillageData(),
): StandardPageDefaultDoc | null => {
  const normalized = normalizePageSlug(slug);
  if (!STANDARD_PAGES[normalized]) return null;
  if (normalized === '/') return buildHomePageDefaults(village);
  const defaults = STANDARD_PAGE_DEFAULTS[normalized];
  return defaults ? interpolateVillageData(defaults, village) : null;
};

export const buildDefaultStandardPageDoc = (
  slug: string,
  village?: StandardPageVillageData,
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
  const defaults = getStandardPageDefaults(normalized, village);
  if (!defaults) return null;
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
