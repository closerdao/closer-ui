import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from 'react';

import {
  EyeOff,
  FileText,
  FolderPlus,
  GripVertical,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Heading } from '../ui';

import I18nHoverAction from './I18nHoverAction';
import { editorHrefForPage } from '../../constants/standardPages';
import { normalizePageSlug } from '../../constants/standardPages';
import { resolveBlockText } from '../../utils/blockI18n';
import {
  normalizeMenuOrder,
  normalizeMenuSection,
  pageMenuLabel,
  type PageMenuMeta,
} from '../../utils/pageMenu';

export interface PageListItem extends PageMenuMeta {
  _id: string;
  title?: string;
  slug?: string;
  isStandard?: boolean;
  isDefault?: boolean;
}

export interface PageMenuUpdate {
  _id: string;
  slug?: string;
  menuSection: string;
  menuSectionOrder: number;
  menuOrder: number;
}

export const UNSECTIONED = '';

/** Sections created in the sidebar but still empty sort after the saved ones. */
const PENDING_SECTION_ORDER = Number.MAX_SAFE_INTEGER;

export interface PageGroup {
  section: string;
  pages: PageListItem[];
}

type DragSubject =
  | { kind: 'page'; id: string }
  | { kind: 'section'; section: string };

interface Props {
  pages: PageListItem[];
  activeId: string;
  activeSlug?: string;
  onNewPage: () => void;
  onMenuChange: (updates: PageMenuUpdate[]) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isDirty?: boolean;
  onBeforeNavigate?: () => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
}

const byMenuOrder = (a: PageListItem, b: PageListItem) => {
  const delta = normalizeMenuOrder(a.menuOrder) - normalizeMenuOrder(b.menuOrder);
  if (delta !== 0) return delta;
  return pageMenuLabel(a).localeCompare(pageMenuLabel(b));
};

/**
 * Groups pages by `menuSection`, ordering sections by the `menuSectionOrder`
 * their pages share. Pages with no section keep their own sortable list, pinned
 * below the sections.
 */
export const buildPageGroups = (
  pages: PageListItem[],
  extraSections: string[] = [],
): PageGroup[] => {
  const bySection = new Map<string, PageListItem[]>();
  extraSections.forEach((section) => {
    const key = normalizeMenuSection(section);
    if (key) bySection.set(key, []);
  });
  (pages ?? []).forEach((page) => {
    const key = normalizeMenuSection(page.menuSection);
    const bucket = bySection.get(key);
    if (bucket) bucket.push(page);
    else bySection.set(key, [page]);
  });

  const sectioned: PageGroup[] = [];
  const unsectioned: PageListItem[] = [];

  bySection.forEach((sectionPages, section) => {
    if (section === UNSECTIONED) {
      unsectioned.push(...sectionPages);
      return;
    }
    sectioned.push({ section, pages: [...sectionPages].sort(byMenuOrder) });
  });

  sectioned.sort((a, b) => {
    const orderOf = (group: PageGroup) =>
      group.pages.length === 0
        ? PENDING_SECTION_ORDER
        : normalizeMenuOrder(group.pages[0]?.menuSectionOrder);
    const delta = orderOf(a) - orderOf(b);
    if (delta !== 0) return delta;
    return a.section.localeCompare(b.section);
  });

  return [
    ...sectioned,
    { section: UNSECTIONED, pages: [...unsectioned].sort(byMenuOrder) },
  ];
};

/**
 * Renumbers every group and returns only the pages whose menu placement
 * changed. Standard pages that have never been saved are left alone unless they
 * are `forceId` — otherwise reordering one section would silently create
 * database records for all of them.
 */
const renumber = (
  groups: PageGroup[],
  isUnsaved: (page: PageListItem) => boolean,
  forceId?: string,
): PageMenuUpdate[] => {
  const updates: PageMenuUpdate[] = [];
  groups.forEach((group, groupIndex) => {
    group.pages.forEach((page, pageIndex) => {
      const next = {
        menuSection: group.section,
        menuSectionOrder: groupIndex,
        menuOrder: pageIndex,
      };
      const unchanged =
        normalizeMenuSection(page.menuSection) === next.menuSection &&
        normalizeMenuOrder(page.menuSectionOrder) === next.menuSectionOrder &&
        normalizeMenuOrder(page.menuOrder) === next.menuOrder;
      if (unchanged) return;
      if (page._id !== forceId && isUnsaved(page)) return;
      updates.push({ _id: page._id, slug: page.slug, ...next });
    });
  });
  return updates;
};

const withoutEmptySections = (groups: PageGroup[]): PageGroup[] =>
  groups.filter(
    (group, index) =>
      group.pages.length > 0 || index === groups.length - 1,
  );

/** Moves a page to `targetIndex` of `targetSection`. */
export const movePageUpdates = (
  groups: PageGroup[],
  pageId: string,
  targetSection: string,
  targetIndex: number,
  isUnsaved: (page: PageListItem) => boolean,
): PageMenuUpdate[] => {
  const dragged = groups
    .flatMap((group) => group.pages)
    .find((page) => page._id === pageId);
  if (!dragged) return [];

  const section = normalizeMenuSection(targetSection);
  const next = groups.map((group) => ({
    section: group.section,
    pages: group.pages.filter((page) => page._id !== pageId),
  }));

  const target = next.find((group) => group.section === section);
  if (!target) return [];
  const index = Math.max(0, Math.min(targetIndex, target.pages.length));
  target.pages.splice(index, 0, dragged);

  return renumber(withoutEmptySections(next), isUnsaved, pageId);
};

/**
 * Moves a whole section to `targetIndex`, which renumbers every page it holds
 * along with any section it displaced.
 */
export const moveSectionUpdates = (
  groups: PageGroup[],
  section: string,
  targetIndex: number,
  isUnsaved: (page: PageListItem) => boolean,
): PageMenuUpdate[] => {
  const name = normalizeMenuSection(section);
  if (!name) return [];
  const sectioned = groups.filter((group) => group.section !== UNSECTIONED);
  const unsectioned = groups.filter((group) => group.section === UNSECTIONED);
  const from = sectioned.findIndex((group) => group.section === name);
  if (from < 0) return [];

  const next = [...sectioned];
  const [moved] = next.splice(from, 1);
  let index = targetIndex;
  if (from < targetIndex) index -= 1;
  index = Math.max(0, Math.min(index, next.length));
  next.splice(index, 0, moved);

  return renumber([...next, ...unsectioned], isUnsaved);
};

/**
 * Renames a section on every page inside it. Renaming onto an existing section
 * merges the two.
 */
export const renameSectionUpdates = (
  groups: PageGroup[],
  section: string,
  nextName: string,
  isUnsaved: (page: PageListItem) => boolean,
): PageMenuUpdate[] => {
  const from = normalizeMenuSection(section);
  const to = normalizeMenuSection(nextName);
  if (!from || !to || from === to) return [];

  const renamed: PageGroup[] = [];
  groups.forEach((group) => {
    if (group.section === from) return;
    if (group.section === to) {
      const source = groups.find((g) => g.section === from);
      renamed.push({
        section: to,
        pages: [...group.pages, ...(source?.pages ?? [])],
      });
      return;
    }
    renamed.push(group);
  });

  if (!renamed.some((group) => group.section === to)) {
    const source = groups.find((group) => group.section === from);
    const at = groups.findIndex((group) => group.section === from);
    renamed.splice(at, 0, { section: to, pages: source?.pages ?? [] });
  }

  return renumber(renamed, isUnsaved);
};

const PageLink = ({
  page,
  isActive,
  isDirty,
  onBeforeNavigate,
  onClose,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  dropEdge,
}: {
  page: PageListItem;
  isActive: boolean;
  isDirty?: boolean;
  onBeforeNavigate?: () => Promise<boolean>;
  onClose: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  isDragging: boolean;
  dropEdge: 'top' | 'bottom' | null;
}) => {
  const t = useTranslations();
  const router = useRouter();
  const href = editorHrefForPage(page);
  const label = pageMenuLabel(page);

  const navigateSafely = (e: MouseEvent) => {
    if (isActive) {
      e.preventDefault();
      onClose();
      return;
    }
    const isModified =
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
    if (!isDirty || !onBeforeNavigate) {
      if (!isModified) onClose();
      return;
    }
    e.preventDefault();
    void (async () => {
      const canLeave = await onBeforeNavigate();
      if (!canLeave) return;
      onClose();
      if (isModified) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      await router.push(href);
    })();
  };

  return (
    <div className="relative" onDragOver={onDragOver} onDrop={onDrop}>
      {dropEdge ? (
        <div
          className={`absolute inset-x-1 h-0.5 rounded-full bg-accent pointer-events-none ${
            dropEdge === 'top' ? '-top-px' : '-bottom-px'
          }`}
          aria-hidden
        />
      ) : null}
      <Link
        href={href}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={navigateSafely}
        onAuxClick={(e) => {
          if (e.button === 1) navigateSafely(e);
        }}
        className={`group/page flex items-start gap-1.5 rounded-lg px-2 py-2.5 text-sm transition-colors ${
          isDragging ? 'opacity-40' : ''
        } ${
          isActive
            ? 'bg-accent-light text-accent-dark font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span
          className="mt-0.5 shrink-0 text-gray-300 group-hover/page:text-gray-400 cursor-grab"
          aria-hidden
          title={t('pages_editor_drag')}
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 min-w-0 w-full font-medium">
            <I18nHoverAction
              raw={label || null}
              display={
                (label && resolveBlockText(label, t)) ||
                t('pages_editor_untitled')
              }
              className="min-w-0 font-medium"
              textClassName="truncate font-medium"
              stopLinkNavigation
            />
            {page.showInMenu ? null : (
              <EyeOff
                className="w-3 h-3 shrink-0 text-gray-400"
                aria-label={t('pages_editor_hidden_from_menu')}
              />
            )}
          </span>
          <span className="block text-xs text-gray-500 font-mono truncate">
            {page.slug || '/'}
          </span>
        </span>
      </Link>
    </div>
  );
};

const PagesSidebar = ({
  pages,
  activeId,
  activeSlug,
  onNewPage,
  onMenuChange,
  saveStatus,
  isDirty,
  onBeforeNavigate,
  isOpen,
  onClose,
}: Props) => {
  const t = useTranslations();
  const [extraSections, setExtraSections] = useState<string[]>([]);
  const [newSectionName, setNewSectionName] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{
    section: string;
    value: string;
  } | null>(null);
  const [dragging, setDragging] = useState<DragSubject | null>(null);
  const [pageDropTarget, setPageDropTarget] = useState<{
    section: string;
    index: number;
  } | null>(null);
  const [sectionDropIndex, setSectionDropIndex] = useState<number | null>(null);
  const newSectionInputRef = useRef<HTMLInputElement | null>(null);

  const groups = useMemo(
    () => buildPageGroups(pages, extraSections),
    [pages, extraSections],
  );

  const total = pages?.length ?? 0;
  const normalizedActiveSlug = normalizePageSlug(activeSlug);
  const isUnsaved = (page: PageListItem) => page.isDefault === true;

  const isPageActive = (p: PageListItem) => {
    if (p.isStandard && normalizedActiveSlug && normalizedActiveSlug !== '/') {
      return normalizePageSlug(p.slug) === normalizedActiveSlug;
    }
    return p._id === activeId;
  };

  const statusLabel =
    saveStatus === 'saving'
      ? t('pages_editor_saving')
      : saveStatus === 'unsaved'
        ? t('pages_editor_unsaved')
        : saveStatus === 'error'
          ? t('pages_editor_save_error')
          : t('pages_editor_saved');

  const statusDotClass =
    saveStatus === 'saving'
      ? 'bg-amber-400'
      : saveStatus === 'unsaved'
        ? 'bg-amber-500'
        : saveStatus === 'error'
          ? 'bg-red-500'
          : 'bg-green-500';

  const resetDragState = () => {
    setDragging(null);
    setPageDropTarget(null);
    setSectionDropIndex(null);
  };

  const emit = (updates: PageMenuUpdate[]) => {
    if (updates.length > 0) onMenuChange(updates);
  };

  const dropPage = (section: string, index: number) => {
    const subject = dragging;
    resetDragState();
    if (subject?.kind !== 'page') return;
    emit(movePageUpdates(groups, subject.id, section, index, isUnsaved));
    setExtraSections((prev) =>
      prev.filter((name) => normalizeMenuSection(name) !== section),
    );
  };

  const dropSection = (targetIndex: number) => {
    const subject = dragging;
    resetDragState();
    if (subject?.kind !== 'section') return;
    emit(moveSectionUpdates(groups, subject.section, targetIndex, isUnsaved));
  };

  const overPage = (
    e: DragEvent<HTMLElement>,
    section: string,
    index: number,
  ) => {
    if (dragging?.kind !== 'page') return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const next = { section, index: after ? index + 1 : index };
    setPageDropTarget((prev) =>
      prev?.section === next.section && prev.index === next.index ? prev : next,
    );
  };

  const overSectionHeader = (
    e: DragEvent<HTMLElement>,
    section: string,
    groupIndex: number,
    pageCount: number,
  ) => {
    if (!dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragging.kind === 'section') {
      if (section === UNSECTIONED) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      setSectionDropIndex(after ? groupIndex + 1 : groupIndex);
      return;
    }
    // Dropping a page on a header appends it to that section.
    setPageDropTarget((prev) =>
      prev?.section === section && prev.index === pageCount
        ? prev
        : { section, index: pageCount },
    );
  };

  const submitNewSection = () => {
    const name = normalizeMenuSection(newSectionName);
    if (name && !groups.some((group) => group.section === name)) {
      setExtraSections((prev) => [...prev, name]);
    }
    setNewSectionName(null);
  };

  const submitRename = () => {
    if (!renaming) return;
    emit(
      renameSectionUpdates(groups, renaming.section, renaming.value, isUnsaved),
    );
    setExtraSections((prev) =>
      prev.map((name) =>
        normalizeMenuSection(name) === renaming.section
          ? normalizeMenuSection(renaming.value) || name
          : name,
      ),
    );
    setRenaming(null);
  };

  const pageDropEdge = (
    section: string,
    index: number,
    isLast: boolean,
  ): 'top' | 'bottom' | null => {
    if (dragging?.kind !== 'page' || pageDropTarget?.section !== section) {
      return null;
    }
    if (pageDropTarget.index === index) return 'top';
    if (isLast && pageDropTarget.index === index + 1) return 'bottom';
    return null;
  };

  return (
    <aside
      className={`flex flex-col border-r border-gray-200 bg-white min-h-0 w-[280px] max-w-[86vw] shrink-0 fixed lg:relative inset-y-0 left-0 z-30 lg:z-0 transform transition-transform lg:transform-none pt-12 xl:pt-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-accent/10 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <Heading level={4} className="text-sm sm:text-base truncate">
              {t('pages_editor_title')}
            </Heading>
            <p className="text-xs text-gray-500 mt-0.5">
              {total} {t('pages_editor_pages_count')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label={t('pages_editor_new_section')}
            title={t('pages_editor_new_section')}
            onClick={() => {
              setNewSectionName('');
              window.setTimeout(() => newSectionInputRef.current?.focus(), 0);
            }}
          >
            <FolderPlus className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label={t('pages_editor_new')}
            title={t('pages_editor_new')}
            onClick={onNewPage}
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label={t('pages_editor_close')}
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      {newSectionName !== null ? (
        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <input
            ref={newSectionInputRef}
            value={newSectionName}
            placeholder={t('pages_editor_new_section_placeholder')}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none"
            onChange={(e) => setNewSectionName(e.target.value)}
            onBlur={submitNewSection}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNewSection();
              if (e.key === 'Escape') setNewSectionName(null);
            }}
          />
        </div>
      ) : null}
      <nav className="flex-1 overflow-y-auto p-2 min-h-0">
        {groups.map((group, groupIndex) => {
          const isUnsectioned = group.section === UNSECTIONED;
          // Kept visible even when empty: it is how a page gets dragged back
          // out of a section.
          if (isUnsectioned && total === 0) return null;
          const isRenaming = renaming?.section === group.section;
          return (
            <div
              key={group.section || '__unsectioned__'}
              className="mb-3 relative"
            >
              {dragging?.kind === 'section' &&
              sectionDropIndex === groupIndex ? (
                <div
                  className="absolute inset-x-1 -top-1 h-0.5 rounded-full bg-accent pointer-events-none"
                  aria-hidden
                />
              ) : null}
              {isRenaming ? (
                <input
                  autoFocus
                  value={renaming.value}
                  className="w-full rounded-md border border-accent px-2 py-1 text-xs font-semibold uppercase tracking-wider focus:outline-none"
                  onChange={(e) =>
                    setRenaming({ section: group.section, value: e.target.value })
                  }
                  onBlur={submitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename();
                    if (e.key === 'Escape') setRenaming(null);
                  }}
                />
              ) : (
                <div
                  draggable={!isUnsectioned}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', group.section);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragging({ kind: 'section', section: group.section });
                  }}
                  onDragEnd={resetDragState}
                  onDragOver={(e) =>
                    overSectionHeader(
                      e,
                      group.section,
                      groupIndex,
                      group.pages.length,
                    )
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging?.kind === 'section') {
                      dropSection(sectionDropIndex ?? groupIndex);
                    } else {
                      dropPage(group.section, group.pages.length);
                    }
                  }}
                  className={`group/section flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md ${
                    !isUnsectioned ? 'cursor-grab' : ''
                  } ${
                    dragging?.kind === 'page' &&
                    pageDropTarget?.section === group.section &&
                    pageDropTarget.index === group.pages.length
                      ? 'bg-accent-light text-accent-dark'
                      : 'text-gray-500'
                  } ${
                    dragging?.kind === 'section' &&
                    dragging.section === group.section
                      ? 'opacity-40'
                      : ''
                  }`}
                >
                  <span className="truncate">
                    {group.section || t('pages_editor_section_unsectioned')}
                  </span>
                  {isUnsectioned ? null : (
                    <button
                      type="button"
                      className="p-0.5 rounded text-gray-400 opacity-0 group-hover/section:opacity-100 hover:text-accent focus:opacity-100"
                      aria-label={t('pages_editor_rename_section')}
                      title={t('pages_editor_rename_section')}
                      onClick={() =>
                        setRenaming({
                          section: group.section,
                          value: group.section,
                        })
                      }
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              {group.pages.length === 0 ? (
                <div
                  className={`mx-1 my-1 rounded-lg border border-dashed px-3 py-3 text-xs ${
                    dragging?.kind === 'page' &&
                    pageDropTarget?.section === group.section
                      ? 'border-accent text-accent-dark'
                      : 'border-gray-200 text-gray-400'
                  }`}
                  onDragOver={(e) => overPage(e, group.section, 0)}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropPage(group.section, 0);
                  }}
                >
                  {t('pages_editor_drop_pages_here')}
                </div>
              ) : null}
              {group.pages.map((page, index) => (
                <PageLink
                  key={page._id}
                  page={page}
                  isActive={isPageActive(page)}
                  isDirty={isDirty}
                  onBeforeNavigate={onBeforeNavigate}
                  onClose={onClose}
                  isDragging={
                    dragging?.kind === 'page' && dragging.id === page._id
                  }
                  dropEdge={pageDropEdge(
                    group.section,
                    index,
                    index === group.pages.length - 1,
                  )}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', page._id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragging({ kind: 'page', id: page._id });
                  }}
                  onDragEnd={resetDragState}
                  onDragOver={(e) => overPage(e, group.section, index)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropPage(
                      group.section,
                      pageDropTarget?.section === group.section
                        ? pageDropTarget.index
                        : index,
                    );
                  }}
                />
              ))}
            </div>
          );
        })}
        {total === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-400">
            {t('pages_editor_no_pages_yet')}
          </p>
        ) : null}
      </nav>
      <div className="p-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass}`}
          aria-hidden
        />
        <span>{statusLabel}</span>
      </div>
    </aside>
  );
};

export default PagesSidebar;
