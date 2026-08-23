import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Menu, PanelRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  buildDefaultStandardPageDoc,
  editorHrefForPage,
  getStandardPageDefinition,
  isStandardPageVirtualId,
} from '../../constants/standardPages';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import useRBAC from '../../hooks/useRBAC';
import PageNotFound from '../../pages/not-found';
import type { PageDoc, PageSection, SectionType } from '../../types/page';
import api from '../../utils/api';
import {
  type BlockI18nTranslate,
  materializePageI18n,
} from '../../utils/blockI18n';
import { parseMessageFromError } from '../../utils/common';
import {
  type PageMenuMeta,
  clearMenuPagesCache,
  normalizeMenuSection,
  readPageMenuMeta,
} from '../../utils/pageMenu';
import {
  type PageListItem,
  canRenderDefaultStandardPage,
  fetchPageBySlug,
  mergeEditorPages,
  readPagePublishState,
  upgradeStandardPageFromDefaults,
} from '../../utils/standardPages';
import AdminLayout from '../Dashboard/AdminLayout';
import BlockPicker from './BlockPicker';
import EditorCanvas from './EditorCanvas';
import Inspector from './Inspector';
import JsonDrawer from './JsonDrawer';
import NewPageDialog, {
  buildNewPagePayload,
  buildPostPayloadFromGenerateResult,
} from './NewPageDialog';
import PagesSidebar, { type PageMenuUpdate } from './PagesSidebar';
import PromptEditDialog from './PromptEditDialog';
import {
  createSection,
  ensureSectionIds,
  mergeSectionLocalIds,
  newLocalId,
  stripForApi,
} from './blockDefaults';
import {
  pagesMatchPersistTarget,
  shouldApplyPersistSnapshot,
} from './persistHelpers';
import { formatPageSaveError, validatePageSections } from './sectionValidation';

interface Props {
  initialPage: PageDoc;
  pages: PageListItem[];
}

const PAGES_FILTER = { limit: 200 };

function toPlain<T>(x: T): T {
  if (x != null && typeof (x as { toJS?: () => T }).toJS === 'function') {
    return (x as unknown as { toJS: () => T }).toJS();
  }
  return x;
}

function getStorePages(platform: Record<string, any>): PageListItem[] | null {
  const stored = platform?.page?.find?.(PAGES_FILTER);
  if (!stored) return null;
  const plain = toPlain(stored) as PageListItem[] | undefined;
  return Array.isArray(plain) ? plain : null;
}

export interface PublishResult {
  results?: unknown;
  localization?: { locales?: string[]; errors?: Record<string, string> };
}

/**
 * The editor always works on the draft: `sections` here is the working copy
 * (the server's `draftSections` when there are unpublished changes, otherwise
 * the live `sections`). Live sections only change through publish.
 */
function normalizePage(raw: Record<string, unknown>): PageDoc {
  const publishState = readPagePublishState(raw);
  const liveSections = Array.isArray(raw.sections)
    ? (raw.sections as PageSection[])
    : [];
  const workingSections =
    publishState.needsPublishing && publishState.draftSections
      ? publishState.draftSections
      : liveSections;
  const sections = ensureSectionIds(workingSections);
  const aiMeta =
    raw.aiMeta != null &&
    typeof raw.aiMeta === 'object' &&
    !Array.isArray(raw.aiMeta)
      ? (raw.aiMeta as Record<string, unknown>)
      : undefined;
  const slug = String(raw.slug ?? '/');
  const isStandard =
    raw.isStandard === true || Boolean(getStandardPageDefinition(slug));
  return {
    _id: String(raw._id ?? ''),
    title: String(raw.title ?? ''),
    slug,
    description: raw.description != null ? String(raw.description) : '',
    ogImage: raw.ogImage != null ? String(raw.ogImage) : '',
    sections,
    liveSections,
    ...publishState,
    ...(aiMeta !== undefined ? { aiMeta } : {}),
    ...readPageMenuMeta(raw),
    isStandard,
    isDefault: raw.isDefault === true,
  };
}

/**
 * Splits the editor payload into what autosave may write: the working copy
 * goes to `draftSections`; everything else (title, slug, menu, description,
 * OG image) is page settings the backend keeps live.
 */
export function buildDraftPatch(page: PageDoc): {
  draftSections: unknown[];
  settings: Record<string, unknown>;
} {
  const payload = stripForApi(page);
  const { sections, _id: _omit, ...settings } = payload;
  return {
    draftSections: Array.isArray(sections) ? sections : [],
    settings,
  };
}

const PageEditor = ({ initialPage, pages }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform } = usePlatform();
  const config = useConfig();

  // `t` is read through a ref so `toEditorPage` keeps a stable identity: it is
  // an effect dependency, and a new identity would reload the page mid-edit.
  const tRef = useRef(t);
  tRef.current = t;

  const toEditorPage = useCallback(
    (raw: Record<string, unknown> | PageDoc): PageDoc => {
      const normalized = normalizePage(raw as Record<string, unknown>);
      const upgraded = upgradeStandardPageFromDefaults(normalized);
      return materializePageI18n(
        upgraded,
        tRef.current as unknown as BlockI18nTranslate,
      );
    },
    [],
  );

  const [page, setPage] = useState<PageDoc>(() =>
    toEditorPage(initialPage as unknown as Record<string, unknown>),
  );
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [tab, setTab] = useState<'block' | 'page'>('block');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'saved' | 'saving' | 'unsaved' | 'error'
  >('saved');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insertAt, setInsertAt] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageError, setNewPageError] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [localizationErrors, setLocalizationErrors] = useState<
    Record<string, string>
  >({});
  const [promptOpen, setPromptOpen] = useState(false);
  const [isApplyingPrompt, setIsApplyingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [menuOverrides, setMenuOverrides] = useState<
    Record<string, PageMenuMeta>
  >({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const editRevisionRef = useRef(0);
  const persistInFlightRef = useRef(false);
  const pendingPersistRef = useRef(false);
  const loadedPageIdRef = useRef(initialPage._id);
  const applyingPromptRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const isStandardPage = Boolean(
    page.isStandard || getStandardPageDefinition(page.slug),
  );

  const defaultLocale = router.defaultLocale ?? 'en';
  const translationLocales = useMemo(
    () => (router.locales ?? []).filter((l) => l !== defaultLocale),
    [router.locales, defaultLocale],
  );

  const persist = useCallback(
    async (showLoading: boolean): Promise<boolean> => {
      while (persistInFlightRef.current) {
        await new Promise((r) => setTimeout(r, 40));
        if (!mountedRef.current) return false;
      }
      const current = pageRef.current;
      let targetId = current._id;
      if (!targetId) return false;
      const snapshotRevision = editRevisionRef.current;
      const creatingAtStart = isStandardPageVirtualId(targetId);
      persistInFlightRef.current = true;
      pendingPersistRef.current = false;
      try {
        if (showLoading) setIsSaving(true);
        if (pageRef.current._id === targetId) setSaveStatus('saving');
        const payload = stripForApi(current);
        const sectionErrors = validatePageSections(
          (payload as { sections?: unknown }).sections,
        );
        if (sectionErrors.length > 0) {
          if (mountedRef.current && pageRef.current._id === targetId) {
            setSaveErrorMessage(
              sectionErrors
                .slice(0, 5)
                .map((e) => e.message)
                .join('\n'),
            );
            setSaveStatus('error');
          }
          return false;
        }

        let creating = creatingAtStart;
        if (creating) {
          const existing = await fetchPageBySlug(current.slug);
          if (existing?._id && !isStandardPageVirtualId(existing._id)) {
            targetId = existing._id;
            creating = false;
            const adopted = {
              ...pageRef.current,
              _id: existing._id,
              isStandard: true,
              isDefault: false,
            };
            pageRef.current = adopted;
            if (mountedRef.current) setPage(adopted);
          }
        }

        const { draftSections, settings } = buildDraftPatch(current);
        let action: { results?: unknown; error?: unknown } | undefined;
        if (creating) {
          // A standard page is created with what visitors already see live —
          // its shipped defaults where those render publicly, otherwise
          // nothing — and the edits land in the draft until published.
          const defaults = canRenderDefaultStandardPage(current.slug)
            ? buildDefaultStandardPageDoc(current.slug)
            : null;
          const liveSections = defaults
            ? (stripForApi(defaults).sections as unknown[])
            : [];
          action = (await platform.page.post({
            ...settings,
            sections: liveSections,
          })) as { results?: unknown; error?: unknown } | undefined;
          const createdId = toPlain(
            action?.results as { _id?: string } | undefined,
          )?._id;
          if (!action?.error && createdId) {
            action = (await platform.page.patch(createdId, {
              draftSections,
            })) as { results?: unknown; error?: unknown } | undefined;
          }
        } else {
          action = (await platform.page.patch(targetId, {
            ...settings,
            draftSections,
          })) as { results?: unknown; error?: unknown } | undefined;
        }
        const stillOnSamePage = pagesMatchPersistTarget(
          pageRef.current._id,
          targetId,
          creatingAtStart,
          isStandardPageVirtualId,
        );
        const actionError = action?.error;
        if (actionError) {
          if (mountedRef.current && stillOnSamePage) {
            const raw = parseMessageFromError(actionError);
            setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
            setSaveStatus('error');
          }
          return false;
        }
        const updated = toPlain(action?.results);
        const applySnapshot = shouldApplyPersistSnapshot(
          snapshotRevision,
          editRevisionRef.current,
        );
        if (
          mountedRef.current &&
          stillOnSamePage &&
          updated &&
          typeof updated === 'object' &&
          (updated as PageDoc)._id
        ) {
          const prevSections = applySnapshot
            ? current.sections
            : pageRef.current.sections;
          const normalized = normalizePage({
            ...(updated as unknown as Record<string, unknown>),
            isStandard: creating || isStandardPage,
            isDefault: false,
          });
          if (applySnapshot) {
            const nextPage = {
              ...normalized,
              sections: mergeSectionLocalIds(prevSections, normalized.sections),
            };
            pageRef.current = nextPage;
            setPage(nextPage);
          } else if (
            normalized._id &&
            isStandardPageVirtualId(pageRef.current._id)
          ) {
            const adopted = {
              ...pageRef.current,
              _id: normalized._id,
              isStandard: true,
              isDefault: false,
            };
            pageRef.current = adopted;
            setPage(adopted);
          }
          if (creating && normalized._id && normalized._id !== current._id) {
            await router.replace(editorHrefForPage(normalized));
          } else if (
            !creating &&
            isStandardPage &&
            normalized._id &&
            isStandardPageVirtualId(current._id)
          ) {
            await router.replace(editorHrefForPage(normalized));
          }
        }
        if (mountedRef.current && stillOnSamePage) {
          if (applySnapshot) {
            isDirtyRef.current = false;
            setIsDirty(false);
            setSaveStatus('saved');
            setSaveErrorMessage(null);
          } else {
            isDirtyRef.current = true;
            setIsDirty(true);
            setSaveStatus('unsaved');
            pendingPersistRef.current = true;
          }
        }
        await platform.page.get(PAGES_FILTER, { force: true });
        clearMenuPagesCache();
        return true;
      } catch (err) {
        if (
          mountedRef.current &&
          pagesMatchPersistTarget(
            pageRef.current._id,
            targetId,
            creatingAtStart,
            isStandardPageVirtualId,
          )
        ) {
          const raw = parseMessageFromError(err);
          setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
          setSaveStatus('error');
        }
        return false;
      } finally {
        persistInFlightRef.current = false;
        if (showLoading && mountedRef.current) setIsSaving(false);
        if (pendingPersistRef.current && mountedRef.current) {
          pendingPersistRef.current = false;
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => {
            saveTimerRef.current = null;
            void persist(false);
          }, 400);
        }
      }
    },
    [platform, router, isStandardPage],
  );

  const persistRef = useRef(persist);
  persistRef.current = persist;

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('unsaved');
    // An AI edit is about to replace the working copy; saving now would race it.
    if (applyingPromptRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void persistRef.current(false);
    }, 1200);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (persistInFlightRef.current) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistRef.current(true);
  }, []);

  const bumpDirty = useCallback(() => {
    editRevisionRef.current += 1;
    setIsDirty(true);
    setSaveErrorMessage(null);
    scheduleSave();
  }, [scheduleSave]);

  useEffect(() => {
    let cancelled = false;
    const loadNextPage = async () => {
      if (loadedPageIdRef.current === initialPage._id) {
        return;
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (isDirtyRef.current) {
        const ok = await persistRef.current(false);
        if (cancelled) return;
        if (!ok || isDirtyRef.current) {
          const leave = window.confirm(t('pages_editor_unsaved_leave_confirm'));
          if (!leave) {
            await router.replace(editorHrefForPage(pageRef.current));
            return;
          }
        }
      }
      if (cancelled) return;
      loadedPageIdRef.current = initialPage._id;
      const next = toEditorPage(
        initialPage as unknown as Record<string, unknown>,
      );
      editRevisionRef.current += 1;
      setPage(next);
      setSelectedLocalId(null);
      setIsDirty(false);
      setSaveStatus('saved');
      setSaveErrorMessage(null);
      setPublishError(null);
      setLocalizationErrors({});
      setPromptError(null);
    };
    void loadNextPage();
    return () => {
      cancelled = true;
    };
  }, [initialPage._id, router, t, toEditorPage]);

  useEffect(() => {
    let cancelled = false;
    const syncExistingStandardPage = async () => {
      const slug = String(initialPage.slug ?? '');
      if (!getStandardPageDefinition(slug)) return;

      try {
        const existing = await fetchPageBySlug(slug);
        if (!existing || cancelled) return;
        if (isDirtyRef.current) return;

        const upgraded = upgradeStandardPageFromDefaults(existing);
        const next = toEditorPage(
          upgraded as unknown as Record<string, unknown>,
        );
        if (cancelled || isDirtyRef.current) return;

        const hadVirtualId = isStandardPageVirtualId(pageRef.current._id);
        const idChanged = String(pageRef.current._id) !== String(next._id);
        const contentUpgraded = upgraded !== existing;

        if (!hadVirtualId && !idChanged && !contentUpgraded) return;

        editRevisionRef.current += 1;
        setPage(next);
        pageRef.current = next;
        loadedPageIdRef.current = next._id;

        if (hadVirtualId || idChanged) {
          await router.replace(editorHrefForPage(next), undefined, {
            shallow: true,
          });
        }

        if (contentUpgraded) {
          setIsDirty(true);
          setSaveStatus('unsaved');
        } else {
          setIsDirty(false);
          setSaveStatus('saved');
        }
      } catch {
        /* keep current editor state */
      }
    };
    void syncExistingStandardPage();
    return () => {
      cancelled = true;
    };
  }, [initialPage._id, initialPage.slug, router, toEditorPage]);

  useEffect(() => {
    if (!isStandardPage) return;
    const desired = editorHrefForPage(page);
    const currentPath = router.asPath.split('?')[0];
    if (currentPath !== desired) {
      void router.replace(desired, undefined, { shallow: true });
    }
  }, [isStandardPage, page._id, page.slug, router]);

  useEffect(() => {
    void platform.page.get(PAGES_FILTER);
  }, [platform]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (isDirtyRef.current) {
        void persistRef.current(false);
      }
    },
    [],
  );

  const sidebarStorePages = getStorePages(platform);
  const sidebarPages =
    sidebarStorePages == null
      ? pages
      : sidebarStorePages.length > 0 || pages.length === 0
      ? sidebarStorePages
      : pages;
  const editorPages = useMemo(() => {
    const merged = mergeEditorPages(sidebarPages, config);
    return merged.map((item) => {
      const override =
        item._id === page._id
          ? {
              showInMenu: page.showInMenu,
              menuLabel: page.menuLabel,
              menuSection: page.menuSection,
              menuSectionOrder: page.menuSectionOrder,
              menuOrder: page.menuOrder,
            }
          : menuOverrides[item._id];
      return override ? { ...item, ...override } : item;
    });
  }, [
    sidebarPages,
    config,
    menuOverrides,
    page._id,
    page.showInMenu,
    page.menuLabel,
    page.menuSection,
    page.menuSectionOrder,
    page.menuOrder,
  ]);

  const menuSectionNames = useMemo(() => {
    const names = new Set<string>();
    editorPages.forEach((item) => {
      const section = normalizeMenuSection(item.menuSection);
      if (section) names.add(section);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [editorPages]);

  const selectedSection = useMemo(() => {
    if (!selectedLocalId) return null;
    return page.sections.find((s) => s._localId === selectedLocalId) ?? null;
  }, [page.sections, selectedLocalId]);

  const reorderSections = (from: number, toIndex: number) => {
    if (from === toIndex) return;
    setPage((p) => {
      const next = [...p.sections];
      const [item] = next.splice(from, 1);
      let insertAtIdx = toIndex;
      if (from < toIndex) insertAtIdx -= 1;
      if (insertAtIdx < 0) insertAtIdx = 0;
      if (insertAtIdx > next.length) insertAtIdx = next.length;
      next.splice(insertAtIdx, 0, item);
      return { ...p, sections: next };
    });
    bumpDirty();
  };

  const moveBlock = (localId: string, dir: -1 | 1) => {
    setPage((p) => {
      const i = p.sections.findIndex((s) => s._localId === localId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.sections.length) return p;
      const next = [...p.sections];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, sections: next };
    });
    bumpDirty();
  };

  const updateSectionData = (
    localId: string,
    data: Record<string, unknown>,
  ) => {
    setPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s._localId === localId ? { ...s, data } : s,
      ),
    }));
    bumpDirty();
  };

  const updatePageField = (field: keyof PageDoc, value: string | boolean) => {
    if (field === 'slug' && isStandardPage) return;
    setPage((p) => ({ ...p, [field]: value }));
    bumpDirty();
  };

  const addBlock = (type: SectionType) => {
    const section = createSection(type);
    setPage((p) => {
      const next = [...p.sections];
      next.splice(insertAt, 0, section);
      return { ...p, sections: next };
    });
    setSelectedLocalId(section._localId!);
    setTab('block');
    bumpDirty();
  };

  const duplicateBlock = (localId: string) => {
    const i = pageRef.current.sections.findIndex((s) => s._localId === localId);
    if (i < 0) return;
    const raw = JSON.parse(
      JSON.stringify(pageRef.current.sections[i]),
    ) as PageSection;
    const nid = newLocalId();
    raw._localId = nid;
    delete raw._id;
    setPage((p) => {
      const next = [...p.sections];
      next.splice(i + 1, 0, raw);
      return { ...p, sections: next };
    });
    setSelectedLocalId(nid);
    bumpDirty();
  };

  const deleteBlock = (localId: string) => {
    if (!window.confirm(t('pages_editor_delete_block_confirm'))) return;
    setPage((p) => ({
      ...p,
      sections: p.sections.filter((s) => s._localId !== localId),
    }));
    setSelectedLocalId((cur) => (cur === localId ? null : cur));
    bumpDirty();
  };

  const handleDeletePage = async () => {
    if (isStandardPage) return;
    if (!window.confirm(t('pages_editor_delete_page_confirm'))) return;
    try {
      await api.delete(`/page/${page._id}`);
      await platform.page.get(PAGES_FILTER, { force: true });
      clearMenuPagesCache();
      const rest = editorPages.filter((x) => x._id !== page._id);
      if (rest[0]) {
        await router.replace(editorHrefForPage(rest[0]));
      } else {
        await router.replace('/dashboard/pages');
      }
    } catch (err) {
      const raw = parseMessageFromError(err);
      setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
      setSaveStatus('error');
    }
  };

  const handleResetToDefault = async () => {
    if (!isStandardPage) return;
    if (!window.confirm(t('pages_editor_reset_confirm'))) return;
    const defaults = buildDefaultStandardPageDoc(page.slug);
    if (!defaults) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      setIsSaving(true);
      setSaveStatus('saving');
      if (page._id && !isStandardPageVirtualId(page._id)) {
        await api.delete(`/page/${page._id}`);
        await platform.page.get(PAGES_FILTER, { force: true });
      }
      const href = editorHrefForPage(defaults);
      window.location.assign(href);
    } catch (err) {
      const raw = parseMessageFromError(err);
      setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
      setSaveStatus('error');
      setIsSaving(false);
    }
  };

  /**
   * Applies a drag & drop reorder from the sidebar. The open page goes through
   * the normal save path (it may still be an unsaved standard page that needs
   * creating), every other page is patched in place.
   */
  const handleMenuChange = useCallback(
    async (updates: PageMenuUpdate[]) => {
      if (updates.length === 0) return;
      setMenuOverrides((prev) => {
        const next = { ...prev };
        updates.forEach((update) => {
          next[update._id] = {
            menuSection: update.menuSection,
            menuSectionOrder: update.menuSectionOrder,
            menuOrder: update.menuOrder,
          };
        });
        return next;
      });

      try {
        for (const update of updates) {
          if (update._id === pageRef.current._id) {
            const next = {
              ...pageRef.current,
              menuSection: update.menuSection,
              menuSectionOrder: update.menuSectionOrder,
              menuOrder: update.menuOrder,
            };
            pageRef.current = next;
            setPage(next);
            editRevisionRef.current += 1;
            await persistRef.current(false);
            continue;
          }
          if (isStandardPageVirtualId(update._id)) {
            const defaults = buildDefaultStandardPageDoc(update.slug ?? '');
            if (!defaults) continue;
            await platform.page.post(
              stripForApi({
                ...defaults,
                menuSection: update.menuSection,
                menuSectionOrder: update.menuSectionOrder,
                menuOrder: update.menuOrder,
              }),
            );
            continue;
          }
          await platform.page.patch(update._id, {
            menuSection: update.menuSection,
            menuSectionOrder: update.menuSectionOrder,
            menuOrder: update.menuOrder,
          });
        }
        await platform.page.get(PAGES_FILTER, { force: true });
        clearMenuPagesCache();
        if (mountedRef.current) setMenuOverrides({});
      } catch (err) {
        if (!mountedRef.current) return;
        const raw = parseMessageFromError(err);
        setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
        setSaveStatus('error');
        setMenuOverrides({});
      }
    },
    [platform],
  );

  /**
   * Makes sure the server holds the current working copy (and that the page
   * exists) before publish / AI edit. Resolves with the real page id.
   */
  const flushDraft = useCallback(async (): Promise<string | null> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (isDirtyRef.current || isStandardPageVirtualId(pageRef.current._id)) {
      const ok = await persistRef.current(true);
      if (!ok || isDirtyRef.current) return null;
    }
    const id = pageRef.current._id;
    return id && !isStandardPageVirtualId(id) ? id : null;
  }, []);

  const applyServerPage = useCallback(
    (raw: Record<string, unknown>) => {
      const normalized = normalizePage({
        ...raw,
        isStandard: isStandardPage,
        isDefault: false,
      });
      const nextPage = {
        ...normalized,
        sections: mergeSectionLocalIds(
          pageRef.current.sections,
          normalized.sections,
        ),
      };
      editRevisionRef.current += 1;
      pageRef.current = nextPage;
      setPage(nextPage);
      isDirtyRef.current = false;
      setIsDirty(false);
      setSaveStatus('saved');
      setSaveErrorMessage(null);
    },
    [isStandardPage],
  );

  const handlePublish = useCallback(
    async (options?: { localize?: boolean; locales?: string[] }) => {
      if (isPublishing || applyingPromptRef.current) return;
      setIsPublishing(true);
      setPublishError(null);
      try {
        const id = await flushDraft();
        if (!id) {
          if (mountedRef.current) {
            setPublishError(t('pages_editor_publish_flush_error'));
          }
          return;
        }
        const localize = options?.localize !== false;
        const locales = options?.locales ?? translationLocales;
        const res = await api.post(`/pages/${id}/publish`, {
          locales: localize ? locales : [],
          localize,
        });
        if (!mountedRef.current || pageRef.current._id !== id) return;
        const body = (res?.data ?? {}) as PublishResult;
        const results = toPlain(body.results) as
          | Record<string, unknown>
          | undefined;
        if (results && typeof results === 'object' && results._id) {
          applyServerPage(results);
        } else {
          const next = {
            ...pageRef.current,
            needsPublishing: false,
            publishedAt: new Date().toISOString(),
          };
          pageRef.current = next;
          setPage(next);
        }
        const errors = body.localization?.errors ?? {};
        if (options?.locales) {
          // Retry of a subset: keep the other locales' earlier outcome.
          setLocalizationErrors((prev) => {
            const next = { ...prev };
            options.locales?.forEach((l) => delete next[l]);
            return { ...next, ...errors };
          });
        } else {
          setLocalizationErrors(errors);
        }
        await platform.page.get(PAGES_FILTER, { force: true });
        clearMenuPagesCache();
      } catch (err) {
        if (!mountedRef.current) return;
        const raw = parseMessageFromError(err);
        setPublishError(
          formatPageSaveError(raw) || raw || t('pages_editor_publish_error'),
        );
      } finally {
        if (mountedRef.current) setIsPublishing(false);
      }
    },
    [
      applyServerPage,
      flushDraft,
      isPublishing,
      platform,
      t,
      translationLocales,
    ],
  );

  /**
   * Discards the draft: the working copy goes back to what visitors see. The
   * server marks any draft write as needing publish, so a no-op publish
   * (without translations — content is unchanged) clears the flag again.
   */
  const handleResetDraft = useCallback(async () => {
    if (isPublishing || applyingPromptRef.current) return;
    if (!window.confirm(t('pages_editor_reset_draft_confirm'))) return;
    const id = pageRef.current._id;
    if (!id || isStandardPageVirtualId(id)) {
      // Never saved: the live copy is the defaults the editor opened with.
      window.location.reload();
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setIsPublishing(true);
    setPublishError(null);
    try {
      const live = pageRef.current.liveSections ?? [];
      const draftSections = stripForApi({
        ...pageRef.current,
        sections: live,
      }).sections;
      const patch = (await platform.page.patch(id, { draftSections })) as
        | { error?: unknown }
        | undefined;
      if (patch?.error) throw patch.error;
      const res = await api.post(`/pages/${id}/publish`, {
        localize: false,
        locales: [],
      });
      if (!mountedRef.current || pageRef.current._id !== id) return;
      const results = toPlain(res?.data?.results) as
        | Record<string, unknown>
        | undefined;
      if (results && typeof results === 'object' && results._id) {
        applyServerPage(results);
      }
      setSelectedLocalId(null);
      await platform.page.get(PAGES_FILTER, { force: true });
      clearMenuPagesCache();
    } catch (err) {
      if (!mountedRef.current) return;
      const raw = parseMessageFromError(err);
      setPublishError(
        formatPageSaveError(raw) || raw || t('pages_editor_reset_draft_error'),
      );
    } finally {
      if (mountedRef.current) setIsPublishing(false);
    }
  }, [applyServerPage, isPublishing, platform, t]);

  const handlePromptEdit = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || applyingPromptRef.current) return;
      applyingPromptRef.current = true;
      setIsApplyingPrompt(true);
      setPromptError(null);
      try {
        const id = await flushDraft();
        if (!id) {
          if (mountedRef.current) {
            setPromptError(t('pages_editor_publish_flush_error'));
          }
          return;
        }
        const res = await api.post(`/pages/${id}/edit`, { prompt: trimmed });
        if (!mountedRef.current || pageRef.current._id !== id) return;
        const results = toPlain(res?.data?.results) as
          | Record<string, unknown>
          | undefined;
        if (!results || typeof results !== 'object' || !results._id) {
          setPromptError(t('pages_editor_prompt_edit_error'));
          return;
        }
        applyServerPage(results);
        setSelectedLocalId(null);
        setPromptOpen(false);
      } catch (err) {
        if (!mountedRef.current) return;
        const raw = parseMessageFromError(err);
        setPromptError(
          formatPageSaveError(raw) ||
            raw ||
            t('pages_editor_prompt_edit_error'),
        );
      } finally {
        applyingPromptRef.current = false;
        if (mountedRef.current) setIsApplyingPrompt(false);
      }
    },
    [applyServerPage, flushDraft, t],
  );

  const handleTabChange = (next: 'block' | 'page') => {
    setTab(next);
    if (next !== 'block') setSelectedLocalId(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      }
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setInspectorOpen(false);
        setPickerOpen(false);
        setJsonOpen(false);
        setIsPreview(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSaveClick]);

  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [isDirty]);

  if (!user || !hasAccess('PlatformSettings')) {
    return <PageNotFound error="User may not access" />;
  }

  if (isPreview) {
    return (
      <AdminLayout flush>
        <div className="relative h-full overflow-hidden flex flex-col min-h-0">
          <button
            type="button"
            className="fixed top-24 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm shadow-lg"
            onClick={() => setIsPreview(false)}
          >
            <X className="w-4 h-4" />
            {t('pages_editor_exit_preview')}
          </button>
          <EditorCanvas
            page={page}
            selectedLocalId={null}
            onSelect={() => {}}
            onReorder={() => {}}
            onMoveBlock={() => {}}
            onDuplicate={() => {}}
            onDelete={() => {}}
            onOpenPickerAt={() => {}}
            isPreview
            onTogglePreview={() => setIsPreview(false)}
            onToggleJson={() => {}}
            onSave={() => {}}
            isSaving={false}
            saveStatus="saved"
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout flush>
      <div className="flex flex-col gap-0 h-full overflow-hidden min-h-0">
        <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 bg-white lg:hidden shrink-0">
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200"
            aria-label={t('pages_editor_menu')}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <code className="flex min-w-0 flex-1 justify-center text-center text-xs font-mono text-gray-600 truncate px-2">
            {page.slug || '/'}
          </code>
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200"
            aria-label={t('pages_editor_inspector')}
            onClick={() => setInspectorOpen(true)}
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-1 min-h-0 relative">
          {(sidebarOpen || inspectorOpen) && (
            <button
              type="button"
              className="fixed inset-0 z-20 bg-black/40 lg:hidden"
              aria-label={t('pages_editor_close')}
              onClick={() => {
                setSidebarOpen(false);
                setInspectorOpen(false);
              }}
            />
          )}
          <PagesSidebar
            pages={editorPages}
            onMenuChange={handleMenuChange}
            activeId={page._id}
            activeSlug={page.slug}
            onNewPage={() => {
              setSidebarOpen(false);
              setNewPageOpen(true);
            }}
            saveStatus={saveStatus}
            isDirty={isDirty}
            onBeforeNavigate={async () => {
              if (!isDirtyRef.current) return true;
              if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
              }
              const ok = await persistRef.current(true);
              if (!ok || isDirtyRef.current) {
                return window.confirm(t('pages_editor_unsaved_leave_confirm'));
              }
              return true;
            }}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 min-w-0 min-h-0 flex flex-col lg:ml-0">
            <EditorCanvas
              page={page}
              selectedLocalId={selectedLocalId}
              onSelect={(id) => {
                setSelectedLocalId(id);
                setTab('block');
                setInspectorOpen(true);
              }}
              onReorder={reorderSections}
              onMoveBlock={moveBlock}
              onDuplicate={duplicateBlock}
              onDelete={deleteBlock}
              onOpenPickerAt={(idx) => {
                setInsertAt(idx);
                setPickerOpen(true);
              }}
              isPreview={false}
              onTogglePreview={() => setIsPreview(true)}
              onToggleJson={() => setJsonOpen((v) => !v)}
              onSave={handleSaveClick}
              isSaving={isSaving}
              saveStatus={saveStatus}
              saveErrorMessage={saveErrorMessage}
              onDismissSaveError={() => setSaveErrorMessage(null)}
              needsPublishing={page.needsPublishing === true}
              publishedAt={page.publishedAt}
              onPublish={() => void handlePublish()}
              isPublishing={isPublishing}
              publishError={publishError}
              onDismissPublishError={() => setPublishError(null)}
              localizationErrors={localizationErrors}
              onRetryLocalization={(locales) => void handlePublish({ locales })}
              onDismissLocalizationErrors={() => setLocalizationErrors({})}
              onResetDraft={
                page.needsPublishing || isDirty
                  ? () => void handleResetDraft()
                  : undefined
              }
              onOpenPromptEdit={() => {
                setPromptError(null);
                setPromptOpen(true);
              }}
              isApplyingPrompt={isApplyingPrompt}
            />
          </div>
          <div
            className={`w-[min(340px,86vw)] shrink-0 border-l border-gray-200 min-h-0 fixed lg:relative inset-y-0 right-0 z-30 lg:z-0 transform transition-transform lg:transform-none pt-12 xl:pt-0 bg-white ${
              inspectorOpen
                ? 'translate-x-0'
                : 'translate-x-full lg:translate-x-0'
            }`}
          >
            <Inspector
              tab={tab}
              onTabChange={handleTabChange}
              page={page}
              onPageFieldChange={updatePageField}
              selectedSection={selectedSection}
              onSectionDataChange={updateSectionData}
              onDeletePage={handleDeletePage}
              onResetToDefault={handleResetToDefault}
              isStandardPage={isStandardPage}
              menuSections={menuSectionNames}
              needsPublishing={page.needsPublishing === true}
              publishedAt={page.publishedAt}
              isPublishing={isPublishing}
              onPublish={(localize) => void handlePublish({ localize })}
              translationLocales={translationLocales}
              localizations={page.localizations}
              showClose
              onClose={() => setInspectorOpen(false)}
            />
          </div>
        </div>
      </div>
      <BlockPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(type) => addBlock(type)}
      />
      <JsonDrawer
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        payload={stripForApi(page)}
      />
      <PromptEditDialog
        open={promptOpen}
        onClose={() => {
          if (isApplyingPrompt) return;
          setPromptOpen(false);
          setPromptError(null);
        }}
        isSubmitting={isApplyingPrompt}
        submitError={promptError}
        onSubmit={(prompt) => void handlePromptEdit(prompt)}
      />
      <NewPageDialog
        open={newPageOpen}
        onClose={() => {
          setNewPageOpen(false);
          setNewPageError(null);
        }}
        isSubmitting={isCreatingPage}
        submitError={newPageError}
        onClearSubmitError={() => setNewPageError(null)}
        onCreate={async (submit) => {
          setIsCreatingPage(true);
          setNewPageError(null);
          try {
            let payload: Record<string, unknown>;
            if (submit.mode === 'manual') {
              payload = buildNewPagePayload(submit.data);
            } else {
              const genAction = (await platform.page.generate({
                prompt: submit.prompt,
              })) as { results?: unknown; error?: unknown } | undefined;
              if (genAction?.error) {
                const raw = parseMessageFromError(genAction.error);
                setNewPageError(
                  formatPageSaveError(raw) ||
                    raw ||
                    t('pages_editor_new_page_create_error'),
                );
                return;
              }
              const generated = toPlain(genAction?.results) as
                | Record<string, unknown>
                | undefined;
              if (!generated || typeof generated !== 'object') {
                setNewPageError(t('pages_editor_new_page_create_error'));
                return;
              }
              const existingId =
                typeof generated._id === 'string' ? generated._id : undefined;
              if (existingId) {
                setNewPageOpen(false);
                await router.push(`/dashboard/pages/${existingId}`);
                return;
              }
              payload = buildPostPayloadFromGenerateResult(generated);
            }
            const sectionErrors = validatePageSections(
              (payload as { sections?: unknown }).sections,
            );
            if (sectionErrors.length > 0) {
              setNewPageError(
                sectionErrors
                  .slice(0, 5)
                  .map((e) => e.message)
                  .join('\n'),
              );
              return;
            }
            const action = (await platform.page.post(payload)) as
              | { results?: unknown; error?: unknown }
              | undefined;
            if (action?.error) {
              const raw = parseMessageFromError(action.error);
              setNewPageError(
                formatPageSaveError(raw) ||
                  raw ||
                  t('pages_editor_new_page_create_error'),
              );
              return;
            }
            const created = toPlain(action?.results) as
              | { _id?: string }
              | undefined;
            const id = created?._id;
            if (!id) {
              setNewPageError(t('pages_editor_new_page_create_error'));
              return;
            }
            setNewPageOpen(false);
            await router.push(`/dashboard/pages/${id}`);
          } catch (err) {
            const raw = parseMessageFromError(err);
            setNewPageError(
              formatPageSaveError(raw) ||
                raw ||
                t('pages_editor_new_page_create_error'),
            );
          } finally {
            setIsCreatingPage(false);
          }
        }}
      />
    </AdminLayout>
  );
};

export default PageEditor;
