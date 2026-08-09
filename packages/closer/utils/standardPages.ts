import {
  STANDARD_PAGE_DEFAULTS,
  buildDefaultStandardPageDoc,
  getEnabledStandardPages,
  getStandardPageDefinition,
  isStandardPageVirtualId,
  normalizePageSlug,
  slugFromStandardPageVirtualId,
  toStandardPageVirtualId,
  type AppConfigForStandardPages,
} from '../constants/standardPages';
import type { PageDoc, PageMetaOverride, PageSection } from '../types/page';
import api from './api';
import { readPageMenuMeta, type PageMenuMeta } from './pageMenu';

export interface PageListItem extends PageMenuMeta {
  _id: string;
  title?: string;
  slug?: string;
  isStandard?: boolean;
  isDefault?: boolean;
}

const toPageDoc = (
  raw: Record<string, unknown>,
  extras?: { isStandard?: boolean; isDefault?: boolean },
): PageDoc => {
  const slug = normalizePageSlug(String(raw.slug ?? '/'));
  const standard = getStandardPageDefinition(slug);
  return {
    _id: String(raw._id ?? ''),
    title: String(raw.title ?? ''),
    slug,
    description: raw.description != null ? String(raw.description) : '',
    ogImage: raw.ogImage != null ? String(raw.ogImage) : '',
    sections: Array.isArray(raw.sections)
      ? (raw.sections as PageSection[])
      : [],
    ...(raw.aiMeta != null &&
    typeof raw.aiMeta === 'object' &&
    !Array.isArray(raw.aiMeta)
      ? { aiMeta: raw.aiMeta as Record<string, unknown> }
      : {}),
    ...readPageMenuMeta(raw),
    isStandard: extras?.isStandard ?? Boolean(standard),
    isDefault: extras?.isDefault ?? false,
  };
};

const THIN_TOKEN_SECTION_TYPES = [
  'tokenStats',
  'floatingBuyTokens',
  'supplyGraph',
  'priceHistory',
] as const;

const isSparseStandardPageOverride = (
  page: PageDoc,
  defaults: { sections: PageSection[] } | null,
): boolean => {
  if (!defaults) return false;
  if (!getStandardPageDefinition(page.slug) && !page.isStandard) return false;

  const savedSections = page.sections ?? [];
  return savedSections.length === 0;
};

const isOutdatedThinTokenSeed = (page: PageDoc): boolean => {
  if (normalizePageSlug(page.slug) !== '/token') return false;
  const types = (page.sections ?? []).map((section) => section.type);
  if (types.length !== THIN_TOKEN_SECTION_TYPES.length) return false;
  return types.every(
    (type, index) => type === THIN_TOKEN_SECTION_TYPES[index],
  );
};

const preferDefaultsForSparseOverride = (page: PageDoc): PageDoc => {
  if (!getStandardPageDefinition(page.slug) && !page.isStandard) return page;
  const defaults = buildDefaultStandardPageDoc(page.slug);
  if (!defaults) return page;
  const shouldPreferDefaults =
    isSparseStandardPageOverride(page, defaults) ||
    isOutdatedThinTokenSeed(page);
  if (!shouldPreferDefaults) {
    return page;
  }
  return {
    ...defaults,
    _id: page._id,
    title: page.title?.trim() ? page.title : defaults.title,
    description: page.description?.trim()
      ? page.description
      : defaults.description,
    ogImage: page.ogImage?.trim() ? page.ogImage : defaults.ogImage,
    showInMenu: page.showInMenu,
    menuLabel: page.menuLabel,
    menuSection: page.menuSection,
    menuSectionOrder: page.menuSectionOrder,
    menuOrder: page.menuOrder,
    isStandard: true,
    isDefault: false,
  };
};

export const upgradeStandardPageFromDefaults = (
  page: PageDoc,
): PageDoc => preferDefaultsForSparseOverride(page);

/**
 * The editor shows one flat list of pages: pages saved in the database plus the
 * feature-enabled standard pages that have not been persisted yet. Standard
 * pages are no longer a separate category — they only differ in that they have
 * shipped defaults to fall back on.
 */
export const mergeEditorPages = (
  dbPages: PageListItem[],
  config: AppConfigForStandardPages | null | undefined,
): PageListItem[] => {
  const bySlug = new Map<string, PageListItem>();
  (dbPages ?? []).forEach((page) => {
    const slug = normalizePageSlug(page.slug);
    bySlug.set(slug, {
      ...page,
      ...readPageMenuMeta(page as unknown as Record<string, unknown>),
      slug,
      isStandard: Boolean(getStandardPageDefinition(slug)),
      isDefault: false,
    });
  });

  const unsavedStandardPages = getEnabledStandardPages(config)
    .filter((def) => !bySlug.has(def.slug))
    .map((def) => {
      const defaults = STANDARD_PAGE_DEFAULTS[def.slug];
      return {
        _id: toStandardPageVirtualId(def.slug),
        title: defaults?.title ?? def.slug,
        slug: def.slug,
        showInMenu: false,
        menuLabel: '',
        menuSection: '',
        menuSectionOrder: 0,
        menuOrder: 0,
        isStandard: true,
        isDefault: true,
      };
    });

  return [...bySlug.values(), ...unsavedStandardPages];
};

export const fetchPageBySlug = async (
  slug: string,
): Promise<PageDoc | null> => {
  const normalized = normalizePageSlug(slug);
  if (!normalized || normalized === '/') return null;
  const candidates = Array.from(
    new Set([normalized, normalized.replace(/^\//, '')].filter(Boolean)),
  );

  for (const candidate of candidates) {
    try {
      const res = await api.get('/page', {
        params: { where: { slug: candidate }, limit: 1 },
        cache: false,
      } as any);
      const list = res?.data?.results;
      if (Array.isArray(list) && list[0]) {
        return toPageDoc(list[0] as Record<string, unknown>, {
          isStandard: Boolean(getStandardPageDefinition(normalized)),
          isDefault: false,
        });
      }
    } catch {
      /* try next candidate */
    }
  }

  try {
    const res = await api.get('/page', {
      params: { limit: 200 },
      cache: false,
    } as any);
    const list = res?.data?.results;
    if (Array.isArray(list)) {
      const hit = list.find(
        (page) =>
          normalizePageSlug(
            String((page as Record<string, unknown>)?.slug ?? ''),
          ) === normalized,
      );
      if (hit) {
        return toPageDoc(hit as Record<string, unknown>, {
          isStandard: Boolean(getStandardPageDefinition(normalized)),
          isDefault: false,
        });
      }
    }
  } catch {
    /* fall through */
  }

  return null;
};

export const resolveStandardOrDbPage = async (
  slugOrId: string,
): Promise<PageDoc | null> => {
  if (isStandardPageVirtualId(slugOrId)) {
    const slug = slugFromStandardPageVirtualId(slugOrId);
    if (!slug) return null;
    const existing = await fetchPageBySlug(slug);
    if (existing) return upgradeStandardPageFromDefaults(existing);
    return buildDefaultStandardPageDoc(slug);
  }

  const looksLikeObjectId = /^[a-f\d]{24}$/i.test(slugOrId);
  if (looksLikeObjectId) {
    try {
      const res = await api.get(`/page/${slugOrId}`, { cache: false } as any);
      const raw = res?.data?.results;
      if (raw) {
        return upgradeStandardPageFromDefaults(
          toPageDoc(raw as Record<string, unknown>),
        );
      }
    } catch {
      return null;
    }
    return null;
  }

  const slug = normalizePageSlug(
    slugOrId.startsWith('/') ? slugOrId : `/${slugOrId}`,
  );
  const existing = await fetchPageBySlug(slug);
  if (existing) return upgradeStandardPageFromDefaults(existing);

  if (getStandardPageDefinition(slug)) {
    return buildDefaultStandardPageDoc(slug);
  }
  return null;
};

export const fetchPageMetaOverride = async (
  slug: string,
): Promise<PageMetaOverride | null> => {
  const normalized = normalizePageSlug(slug);
  try {
    const res = await api.get('/page', {
      params: { where: { slug: normalized }, limit: 1 },
    });
    const list = res?.data?.results;
    if (Array.isArray(list) && list[0]) {
      const page = list[0] as Record<string, unknown>;
      return {
        title: page.title != null ? String(page.title) : undefined,
        description:
          page.description != null ? String(page.description) : undefined,
        ogImage: page.ogImage != null ? String(page.ogImage) : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
};

export const resolvePageMeta = (
  override: PageMetaOverride | null | undefined,
  fallback: { title: string; description?: string; ogImage?: string },
): { title: string; description: string; ogImage: string } => {
  const title =
    override?.title && String(override.title).trim()
      ? String(override.title).trim()
      : fallback.title;
  const description =
    override?.description && String(override.description).trim()
      ? String(override.description).trim()
      : fallback.description ?? '';
  const ogImage =
    override?.ogImage && String(override.ogImage).trim()
      ? String(override.ogImage).trim()
      : fallback.ogImage ?? '';
  return { title, description, ogImage };
};
