import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Menu, PanelRight, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import AdminLayout from '../Dashboard/AdminLayout';

import BlockPicker from './BlockPicker';
import {
  createSection,
  ensureSectionIds,
  mergeSectionLocalIds,
  newLocalId,
  stripForApi,
} from './blockDefaults';
import EditorCanvas from './EditorCanvas';
import Inspector from './Inspector';
import JsonDrawer from './JsonDrawer';
import NewPageDialog, {
  NewPageData,
  buildNewPagePayload,
} from './NewPageDialog';
import PagesSidebar from './PagesSidebar';
import {
  formatPageSaveError,
  validatePageSections,
} from './sectionValidation';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import useRBAC from '../../hooks/useRBAC';
import type { PageDoc, PageSection, SectionType } from '../../types/page';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import PageNotFound from '../../pages/not-found';

interface PageListItem {
  _id: string;
  title?: string;
  slug?: string;
}

interface Props {
  initialPage: PageDoc;
  pages: PageListItem[];
}

const PAGES_FILTER = {};

function toPlain<T>(x: T): T {
  if (x != null && typeof (x as { toJS?: () => T }).toJS === 'function') {
    return (x as { toJS: () => T }).toJS();
  }
  return x;
}

function getStorePages(platform: {
  page: { find: (f: unknown) => unknown };
}): PageListItem[] | null {
  const stored = platform.page.find(PAGES_FILTER);
  if (!stored) return null;
  const plain = toPlain(stored) as PageListItem[] | undefined;
  return Array.isArray(plain) ? plain : null;
}

function normalizePage(raw: Record<string, unknown>): PageDoc {
  const sections = Array.isArray(raw.sections)
    ? ensureSectionIds(raw.sections as PageSection[])
    : [];
  return {
    _id: String(raw._id ?? ''),
    title: String(raw.title ?? ''),
    slug: String(raw.slug ?? '/'),
    description: raw.description != null ? String(raw.description) : '',
    ogImage: raw.ogImage != null ? String(raw.ogImage) : '',
    sections,
  };
}

const PageEditor = ({ initialPage, pages }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform } = usePlatform();

  const [page, setPage] = useState<PageDoc>(() =>
    normalizePage(initialPage as unknown as Record<string, unknown>),
  );
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [tab, setTab] = useState<'block' | 'page' | 'seo'>('block');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>(
    'saved',
  );
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const persist = useCallback(
    async (showLoading: boolean) => {
      const current = pageRef.current;
      const targetId = current._id;
      if (!targetId) return;
      try {
        if (showLoading) setIsSaving(true);
        if (pageRef.current._id === targetId) setSaveStatus('saving');
        const payload = stripForApi(current);
        const sectionErrors = validatePageSections(
          (payload as { sections?: unknown }).sections,
        );
        if (sectionErrors.length > 0) {
          if (pageRef.current._id === targetId) {
            setSaveErrorMessage(
              sectionErrors
                .slice(0, 5)
                .map((e) => e.message)
                .join('\n'),
            );
            setSaveStatus('error');
          }
          return;
        }
        const action = await platform.page.put(targetId, payload);
        const stillOnSamePage = pageRef.current._id === targetId;
        const actionError = (action as { error?: unknown })?.error;
        if (actionError) {
          if (stillOnSamePage) {
            const raw = parseMessageFromError(actionError);
            setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
            setSaveStatus('error');
          }
          return;
        }
        const updated = toPlain((action as { results?: unknown })?.results);
        if (
          stillOnSamePage &&
          updated &&
          typeof updated === 'object' &&
          (updated as PageDoc)._id
        ) {
          const prevSections = current.sections;
          const normalized = normalizePage(updated as unknown as Record<string, unknown>);
          setPage({
            ...normalized,
            sections: mergeSectionLocalIds(prevSections, normalized.sections),
          });
        }
        if (stillOnSamePage) {
          setIsDirty(false);
          setSaveStatus('saved');
          setSaveErrorMessage(null);
        }
      } catch (err) {
        if (pageRef.current._id === targetId) {
          const raw = parseMessageFromError(err);
          setSaveErrorMessage(formatPageSaveError(raw) || raw || null);
          setSaveStatus('error');
        }
      } finally {
        if (showLoading) setIsSaving(false);
      }
    },
    [platform],
  );

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('unsaved');
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void persist(false);
    }, 1200);
  }, [persist]);

  const handleSaveClick = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persist(true);
  }, [persist]);

  const bumpDirty = useCallback(() => {
    setIsDirty(true);
    setSaveErrorMessage(null);
    scheduleSave();
  }, [scheduleSave]);

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      void persist(false);
    }
    setPage(normalizePage(initialPage as unknown as Record<string, unknown>));
    setSelectedLocalId(null);
    setIsDirty(false);
    setSaveStatus('saved');
    setSaveErrorMessage(null);
  }, [initialPage._id, persist]);

  useEffect(() => {
    void platform.page.get(PAGES_FILTER);
  }, [platform]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        void persist(false);
      }
    },
    [persist],
  );

  const sidebarPages = getStorePages(platform) ?? pages;

  const selectedSection = useMemo(() => {
    if (!selectedLocalId) return null;
    return page.sections.find((s) => s._localId === selectedLocalId) ?? null;
  }, [page.sections, selectedLocalId]);

  const reorderSections = (from: number, toIndex: number) => {
    if (from === toIndex) return;
    setPage((p) => {
      const next = [...p.sections];
      const [item] = next.splice(from, 1);
      let insertAt = toIndex;
      if (from < toIndex) insertAt -= 1;
      if (insertAt < 0) insertAt = 0;
      if (insertAt > next.length) insertAt = next.length;
      next.splice(insertAt, 0, item);
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

  const updateSectionData = (localId: string, data: Record<string, unknown>) => {
    setPage((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s._localId === localId ? { ...s, data } : s,
      ),
    }));
    bumpDirty();
  };

  const updatePageField = (field: keyof PageDoc, value: string) => {
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
    if (!window.confirm(t('pages_editor_delete_page_confirm'))) return;
    try {
      await api.delete(`/page/${page._id}`);
      await platform.page.get(PAGES_FILTER, { force: true });
      const rest = sidebarPages.filter((x) => x._id !== page._id);
      if (rest[0]) await router.replace(`/dashboard/pages/${rest[0]._id}`);
      else await router.replace('/dashboard/pages');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleTabChange = (next: 'block' | 'page' | 'seo') => {
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
      <AdminLayout>
        <div className="relative min-h-[calc(100vh-6rem)] flex flex-col">
          <button
            type="button"
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm shadow-lg"
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
    <AdminLayout>
      <div className="flex flex-col gap-0 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 bg-white lg:hidden shrink-0">
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200"
            aria-label="Menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="flex-1 text-center text-sm font-medium truncate">
            {page.title || t('pages_editor_untitled')}
          </span>
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200"
            aria-label="Inspector"
            onClick={() => setInspectorOpen(true)}
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-1 min-h-0 relative">
          {(sidebarOpen || inspectorOpen) && (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              aria-label="Close"
              onClick={() => {
                setSidebarOpen(false);
                setInspectorOpen(false);
              }}
            />
          )}
          <PagesSidebar
            pages={sidebarPages}
            activeId={page._id}
            onNewPage={() => {
              setSidebarOpen(false);
              setNewPageOpen(true);
            }}
            saveStatus={saveStatus}
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
            />
          </div>
          <div
            className={`w-[min(340px,86vw)] shrink-0 border-l border-gray-200 min-h-0 fixed lg:relative inset-y-0 right-0 z-40 lg:z-0 transform transition-transform lg:transform-none pt-12 xl:pt-0 bg-white ${
              inspectorOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
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
      <NewPageDialog
        open={newPageOpen}
        onClose={() => {
          setNewPageOpen(false);
          setNewPageError(null);
        }}
        isSubmitting={isCreatingPage}
        submitError={newPageError}
        onClearSubmitError={() => setNewPageError(null)}
        onCreate={async (data: NewPageData) => {
          setIsCreatingPage(true);
          setNewPageError(null);
          try {
            const payload = buildNewPagePayload(data);
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
