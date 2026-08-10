import { normalizePageSlug } from '../constants/standardPages';
import api from './api';

/**
 * Menu metadata carried by every page. The website menu is built entirely from
 * these fields, read in a single `/page` request on app load.
 */
export interface PageMenuMeta {
  showInMenu?: boolean;
  /** Overrides the page title in the menu; falls back to the title when empty. */
  menuLabel?: string;
  menuSection?: string;
  /** Position of the page's section. Every page in a section shares it. */
  menuSectionOrder?: number;
  /** Position of the page inside its section. */
  menuOrder?: number;
}

export interface MenuPage extends PageMenuMeta {
  _id: string;
  title?: string;
  slug?: string;
}

export interface PageMenuItem {
  label: string;
  url: string;
}

export interface PageMenuSection {
  /** Section title, or the page title when the page is not in a section. */
  label: string;
  items: PageMenuItem[];
}

export const normalizeMenuSection = (
  value: string | undefined | null,
): string => String(value ?? '').trim();

export const normalizeMenuOrder = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const readPageMenuMeta = (
  raw: Record<string, unknown> | null | undefined,
): Required<PageMenuMeta> => ({
  showInMenu: raw?.showInMenu === true,
  menuLabel: String(raw?.menuLabel ?? '').trim(),
  menuSection: normalizeMenuSection(raw?.menuSection as string | undefined),
  menuSectionOrder: normalizeMenuOrder(raw?.menuSectionOrder),
  menuOrder: normalizeMenuOrder(raw?.menuOrder),
});

export const pageMenuUrl = (page: {
  slug?: string;
}): string => normalizePageSlug(page.slug);

/** The text a page shows in the menu: its menu label, or its title. */
export const pageMenuLabel = (page: MenuPage): string =>
  String(page.menuLabel ?? '').trim() || String(page.title ?? '');

const byOrderThenTitle = (a: MenuPage, b: MenuPage): number => {
  const delta = normalizeMenuOrder(a.menuOrder) - normalizeMenuOrder(b.menuOrder);
  if (delta !== 0) return delta;
  return pageMenuLabel(a).localeCompare(pageMenuLabel(b));
};

export const sortMenuPages = (pages: MenuPage[]): MenuPage[] =>
  [...pages].sort(byOrderThenTitle);

/**
 * Groups menu pages by `menuSection`, ordering pages inside a section by
 * `menuOrder`. Pages without a section become standalone single-item entries so
 * the menu can render them as plain links.
 */
export const buildPageMenuSections = (
  pages: MenuPage[],
  resolveLabel: (value: string) => string = (value) => value,
): PageMenuSection[] => {
  const visible = (pages ?? []).filter(
    (page) => page?.showInMenu === true && normalizePageSlug(page.slug) !== '/',
  );

  const grouped = new Map<string, MenuPage[]>();
  const standalone: MenuPage[] = [];

  visible.forEach((page) => {
    const section = normalizeMenuSection(page.menuSection);
    if (!section) {
      standalone.push(page);
      return;
    }
    const bucket = grouped.get(section);
    if (bucket) bucket.push(page);
    else grouped.set(section, [page]);
  });

  const entries: {
    sectionOrder: number;
    order: number;
    label: string;
    pages: MenuPage[];
  }[] = [];

  grouped.forEach((sectionPages, section) => {
    const sorted = sortMenuPages(sectionPages);
    entries.push({
      sectionOrder: normalizeMenuOrder(sorted[0]?.menuSectionOrder),
      order: normalizeMenuOrder(sorted[0]?.menuOrder),
      label: resolveLabel(section),
      pages: sorted,
    });
  });

  // Pages with no section stay top-level links, placed by their own order.
  standalone.forEach((page) => {
    entries.push({
      sectionOrder: normalizeMenuOrder(page.menuSectionOrder),
      order: normalizeMenuOrder(page.menuOrder),
      label: resolveLabel(pageMenuLabel(page)) || pageMenuUrl(page),
      pages: [page],
    });
  });

  return entries
    .sort(
      (a, b) =>
        a.sectionOrder - b.sectionOrder ||
        a.order - b.order ||
        a.label.localeCompare(b.label),
    )
    .map((entry) => ({
      label: entry.label,
      items: entry.pages.map((page) => ({
        label: resolveLabel(pageMenuLabel(page)) || pageMenuUrl(page),
        url: pageMenuUrl(page),
      })),
    }));
};

/**
 * Shapes page-driven sections like the menus' hand-written ones so both can be
 * rendered by the same markup.
 */
export const toNavigationSections = (sections: PageMenuSection[]) =>
  sections.map((section) => ({
    label: section.label,
    isOpen: false,
    items: section.items.map((item) => ({
      label: item.label,
      url: item.url,
      enabled: true,
    })),
  }));

let menuPagesPromise: Promise<MenuPage[]> | null = null;

/**
 * Reads page metadata once per app load. Both menus share this promise so the
 * app never issues more than one request for it.
 */
export const fetchMenuPages = (): Promise<MenuPage[]> => {
  if (!menuPagesPromise) {
    menuPagesPromise = api
      .get('/page', { params: { limit: 100 } })
      .then((res) => {
        const results = res?.data?.results;
        return Array.isArray(results) ? (results as MenuPage[]) : [];
      })
      .catch(() => {
        menuPagesPromise = null;
        return [];
      });
  }
  return menuPagesPromise;
};

export const clearMenuPagesCache = () => {
  menuPagesPromise = null;
};
