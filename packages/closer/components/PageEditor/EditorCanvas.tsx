import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { PageDoc, PageSection } from '../../types/page';
import { materializeI18nValue } from '../../utils/blockI18n';
import CustomSectionComponent from '../custom-pages/CustomSectionComponent';
import { Button } from '../ui';
import { hydrateSectionData, isEmptySectionContent } from './blockDefaults';

interface Props {
  page: PageDoc;
  selectedLocalId: string | null;
  onSelect: (localId: string | null) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onMoveBlock: (localId: string, dir: -1 | 1) => void;
  onDuplicate: (localId: string) => void;
  onDelete: (localId: string) => void;
  onOpenPickerAt: (index: number) => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  onToggleJson: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  saveErrorMessage?: string | null;
  onDismissSaveError?: () => void;
  needsPublishing?: boolean;
  publishedAt?: string;
  onPublish?: () => void;
  isPublishing?: boolean;
  publishError?: string | null;
  onDismissPublishError?: () => void;
  localizationErrors?: Record<string, string>;
  onRetryLocalization?: (locales: string[]) => void;
  onDismissLocalizationErrors?: () => void;
  onOpenPromptEdit?: () => void;
  onResetDraft?: () => void;
  isApplyingPrompt?: boolean;
}

const EditorCanvas = ({
  page,
  selectedLocalId,
  onSelect,
  onReorder,
  onMoveBlock,
  onDuplicate,
  onDelete,
  onOpenPickerAt,
  isPreview,
  onTogglePreview,
  onToggleJson,
  onSave,
  isSaving,
  saveStatus,
  saveErrorMessage,
  onDismissSaveError,
  needsPublishing = false,
  publishedAt,
  onPublish,
  isPublishing = false,
  publishError,
  onDismissPublishError,
  localizationErrors = {},
  onRetryLocalization,
  onDismissLocalizationErrors,
  onOpenPromptEdit,
  onResetDraft,
  isApplyingPrompt = false,
}: Props) => {
  const t = useTranslations();
  const sections = page.sections ?? [];
  const failedLocales = Object.keys(localizationErrors);
  const busy = isSaving || isPublishing || isApplyingPrompt;
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!actionsRef.current?.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [actionsOpen]);

  // "Draft saved" is transient: it shows for 2s after a save completes, then
  // the pill falls back to the publish state. Transitions into `saved` are
  // tracked so a page that loads already-saved shows no toast.
  const [showSavedToast, setShowSavedToast] = useState(false);
  const prevSaveStatusRef = useRef(saveStatus);
  useEffect(() => {
    const prev = prevSaveStatusRef.current;
    prevSaveStatusRef.current = saveStatus;
    if (saveStatus !== 'saved' || prev !== 'saving') {
      setShowSavedToast(false);
      return;
    }
    setShowSavedToast(true);
    const timer = setTimeout(() => setShowSavedToast(false), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const status: { label: string; className: string; title?: string } | null =
    saveStatus === 'saving'
      ? {
          label: t('pages_editor_saving'),
          className: 'bg-gray-100 text-gray-600',
        }
      : saveStatus === 'unsaved'
      ? {
          label: t('pages_editor_unsaved'),
          className: 'bg-amber-100 text-amber-800',
        }
      : saveStatus === 'error'
      ? {
          label: t('pages_editor_save_error'),
          className: 'bg-red-100 text-red-700',
        }
      : showSavedToast
      ? {
          label: t('pages_editor_draft_saved'),
          className: 'bg-green-100 text-green-800',
        }
      : needsPublishing
      ? {
          label: t('pages_editor_unpublished_changes'),
          className: 'bg-amber-100 text-amber-800',
          title: publishedAt
            ? t('pages_editor_last_published', {
                date: new Date(publishedAt).toLocaleString(),
              })
            : t('pages_editor_never_published'),
        }
      : null;

  if (isPreview) {
    return (
      <div className="min-h-0 h-full flex flex-col bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0">
          {sections.map((s) => (
            <CustomSectionComponent
              key={s._localId ?? s._id}
              type={s.type}
              data={
                materializeI18nValue(hydrateSectionData(s), t) as Record<
                  string,
                  unknown
                >
              }
              embedded
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white/90 backdrop-blur shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <code className="text-xs text-gray-600 font-mono truncate min-w-0">
            {page.slug || '/'}
          </code>
          <span aria-live="polite" className="inline-flex">
            {status ? (
              <span
                className={`inline-flex items-center rounded-full text-[11px] font-medium px-2 py-0.5 whitespace-nowrap transition-colors ${status.className}`}
                title={status.title}
              >
                {status.label}
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            className="!text-xs !min-h-[28px] !px-2.5 !py-0.5 !normal-case !tracking-normal"
            onClick={onTogglePreview}
          >
            {t('pages_editor_preview')}
          </Button>
          <div className="relative" ref={actionsRef}>
            <Button
              type="button"
              variant="secondary"
              size="small"
              isFullWidth={false}
              isLoading={isApplyingPrompt}
              className="!text-xs !min-h-[28px] !px-2.5 !py-0.5 !normal-case !tracking-normal"
              onClick={() => setActionsOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
            >
              {t('pages_editor_actions')}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {actionsOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg py-1"
              >
                {page.slug ? (
                  <a
                    role="menuitem"
                    href={
                      page.slug.startsWith('/') ? page.slug : `/${page.slug}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setActionsOpen(false)}
                  >
                    {t('pages_editor_view_live')}
                  </a>
                ) : null}
                {onOpenPromptEdit ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => {
                      setActionsOpen(false);
                      onOpenPromptEdit();
                    }}
                  >
                    {t('pages_editor_prompt_edit_button')}
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setActionsOpen(false);
                    onToggleJson();
                  }}
                >
                  {t('pages_editor_json')}
                </button>
                {onResetDraft ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => {
                      setActionsOpen(false);
                      onResetDraft();
                    }}
                  >
                    {t('pages_editor_reset_draft')}
                  </button>
                ) : null}
                {saveStatus === 'unsaved' || saveStatus === 'error' ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => {
                      setActionsOpen(false);
                      onSave();
                    }}
                  >
                    {t('pages_editor_save_unsaved')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          {onPublish ? (
            <Button
              type="button"
              size="small"
              isFullWidth={false}
              isLoading={isPublishing}
              isEnabled={!busy}
              className={`!text-xs !min-h-[28px] !px-2.5 !py-0.5 !normal-case !tracking-normal ${
                needsPublishing ? '!ring-2 !ring-amber-400' : ''
              }`}
              onClick={onPublish}
            >
              {isPublishing
                ? t('pages_editor_publishing')
                : t('pages_editor_publish')}
            </Button>
          ) : null}
        </div>
      </div>
      {isApplyingPrompt ? (
        <div
          role="status"
          className="px-4 py-2 border-b border-amber-200 bg-amber-50 text-sm text-amber-800"
        >
          {t('pages_editor_prompt_edit_applying')}
        </div>
      ) : null}
      {publishError ? (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-2 border-b border-red-200 bg-red-50 text-sm text-red-700"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium">{t('pages_editor_publish_error')}</div>
            <div className="mt-1 whitespace-pre-line break-words text-xs">
              {publishError}
            </div>
          </div>
          {onDismissPublishError ? (
            <button
              type="button"
              className="p-1 rounded hover:bg-red-100 shrink-0"
              aria-label={t('pages_editor_dismiss')}
              onClick={onDismissPublishError}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {failedLocales.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-2 border-b border-amber-200 bg-amber-50 text-sm text-amber-800"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium">
              {t('pages_editor_localization_failed', {
                locales: failedLocales.join(', '),
              })}
            </div>
            <ul className="mt-1 text-xs whitespace-pre-line break-words">
              {failedLocales.map((locale) => (
                <li key={locale}>
                  <span className="font-mono">{locale}</span>:{' '}
                  {localizationErrors[locale]}
                </li>
              ))}
            </ul>
            {onRetryLocalization ? (
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={!busy}
                isLoading={isPublishing}
                className="mt-2 !text-xs !min-h-[28px] !px-2.5 !py-0.5 !normal-case !tracking-normal"
                onClick={() => onRetryLocalization(failedLocales)}
              >
                {t('pages_editor_retry_translations')}
              </Button>
            ) : null}
          </div>
          {onDismissLocalizationErrors ? (
            <button
              type="button"
              className="p-1 rounded hover:bg-amber-100 shrink-0"
              aria-label={t('pages_editor_dismiss')}
              onClick={onDismissLocalizationErrors}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {saveStatus === 'error' && saveErrorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-2 border-b border-red-200 bg-red-50 text-sm text-red-700"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium">{t('pages_editor_save_error')}</div>
            <div className="mt-1 whitespace-pre-line break-words text-xs">
              {saveErrorMessage}
            </div>
          </div>
          {onDismissSaveError ? (
            <button
              type="button"
              className="p-1 rounded hover:bg-red-100 shrink-0"
              aria-label={t('pages_editor_dismiss')}
              onClick={onDismissSaveError}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
            <h3 className="text-lg font-medium text-gray-700">
              {t('pages_editor_empty_canvas_title')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('pages_editor_empty_canvas_body')}
            </p>
            <Button
              type="button"
              size="small"
              onClick={() => onOpenPickerAt(0)}
            >
              {t('pages_editor_add_block')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <DropZone
              toIndex={0}
              onReorder={onReorder}
              onOpenPicker={() => onOpenPickerAt(0)}
              t={t}
            />
            {sections.map((section, index) => (
              <div key={section._localId ?? section._id ?? index}>
                <BlockRow
                  section={section}
                  index={index}
                  total={sections.length}
                  selected={selectedLocalId === section._localId}
                  onSelect={() => onSelect(section._localId ?? null)}
                  onMoveUp={() => onMoveBlock(section._localId!, -1)}
                  onMoveDown={() => onMoveBlock(section._localId!, 1)}
                  onDuplicate={() => onDuplicate(section._localId!)}
                  onDelete={() => onDelete(section._localId!)}
                  t={t}
                />
                <DropZone
                  toIndex={index + 1}
                  onReorder={onReorder}
                  onOpenPicker={() => onOpenPickerAt(index + 1)}
                  t={t}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function DropZone({
  toIndex,
  onReorder,
  onOpenPicker,
  t,
}: {
  toIndex: number;
  onReorder: (from: number, to: number) => void;
  onOpenPicker: () => void;
  t: (k: string) => string;
}) {
  return (
    <div
      className="relative flex justify-center py-1 group/dz"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData('text/plain');
        const from = Number(raw);
        if (!Number.isFinite(from)) return;
        onReorder(from, toIndex);
      }}
    >
      <div className="absolute inset-x-[15%] top-1/2 h-px bg-transparent group-hover/dz:bg-gray-200 pointer-events-none" />
      <button
        type="button"
        className="relative z-[1] w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 opacity-100 md:opacity-0 md:group-hover/dz:opacity-100 hover:border-accent hover:text-accent transition-opacity flex items-center justify-center"
        aria-label={t('pages_editor_add_block')}
        onClick={onOpenPicker}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function BlockRow({
  section,
  index,
  total,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  t,
}: {
  section: PageSection;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  t: (k: string) => string;
}) {
  const previewData = materializeI18nValue(
    hydrateSectionData(section),
    t,
  ) as Record<string, unknown>;
  const placeholderKey = PLACEHOLDER_BLOCK_KEYS[section.type];
  const showPlaceholder =
    Boolean(placeholderKey) &&
    isEmptySectionContent(
      (section.data as Record<string, unknown> | undefined)?.content,
    ) &&
    isEmptySectionContent(
      (previewData as Record<string, unknown> | undefined)?.content,
    );

  return (
    <section
      className={`group/block relative border-2 rounded-md transition-colors ${
        selected
          ? 'border-accent ring-2 ring-accent/15 z-10'
          : 'border-transparent hover:border-gray-200 z-0'
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(index));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(ev) => {
        if ((ev.target as HTMLElement).closest('[data-controls]')) return;
        onSelect();
      }}
    >
      <div
        className={`absolute top-2 right-2 flex gap-0.5 p-1 rounded-md bg-white/95 shadow border border-gray-100 pointer-events-auto ${
          selected
            ? 'opacity-100 z-50'
            : 'opacity-100 z-50 md:opacity-0 md:group-hover/block:opacity-100'
        }`}
        data-controls
        onClick={(e) => e.stopPropagation()}
      >
        <ControlBtn
          label={t('pages_editor_move_up')}
          disabled={index === 0}
          onClick={onMoveUp}
        >
          <ChevronUp className="w-4 h-4" />
        </ControlBtn>
        <ControlBtn
          label={t('pages_editor_move_down')}
          disabled={index >= total - 1}
          onClick={onMoveDown}
        >
          <ChevronDown className="w-4 h-4" />
        </ControlBtn>
        <span
          className="p-1.5 rounded text-gray-400 cursor-grab"
          aria-hidden
          title={t('pages_editor_drag')}
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <ControlBtn label={t('pages_editor_duplicate')} onClick={onDuplicate}>
          <Copy className="w-4 h-4" />
        </ControlBtn>
        <ControlBtn
          label={t('pages_editor_delete_block')}
          onClick={onDelete}
          danger
        >
          <Trash2 className="w-4 h-4" />
        </ControlBtn>
      </div>
      {showPlaceholder ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center bg-neutral-light/40 border border-dashed border-gray-200 rounded-md min-h-[140px]">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {t(placeholderKey)}
          </span>
          <span className="text-xs text-gray-500">
            {t('pages_editor_block_preview_hidden')}
          </span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md pointer-events-none relative z-0">
          <CustomSectionComponent
            type={section.type}
            data={previewData}
            embedded
          />
        </div>
      )}
    </section>
  );
}

const PLACEHOLDER_BLOCK_KEYS: Record<string, string> = {
  events: 'pages_editor_block_upcoming_events',
  upcomingEvents: 'pages_editor_block_upcoming_events',
  pastEvents: 'pages_editor_block_past_events',
  eventsCalendar: 'pages_editor_block_events_calendar',
  fundraiserProgress: 'pages_editor_block_fundraiser_progress',
  fundraiserMilestones: 'pages_editor_block_fundraiser_milestones',
  fundraiserRewards: 'pages_editor_block_fundraiser_rewards',
  supplyGraph: 'pages_editor_block_supply_graph',
  priceHistory: 'pages_editor_block_price_history',
  webinar: 'pages_editor_block_webinar',
  listingsPreviews: 'pages_editor_block_listings_previews',
  reviews: 'pages_editor_block_reviews',
  subscriptionPlans: 'pages_editor_block_subscription_plans',
  bookAStay: 'pages_editor_block_book_a_stay',
  staySearch: 'pages_editor_block_book_a_stay',
  citizenProgressBar: 'pages_editor_block_citizen_progress',
  projectList: 'pages_editor_block_project_list',
};

function ControlBtn({
  children,
  onClick,
  disabled,
  label,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`p-1.5 rounded disabled:opacity-30 ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default EditorCanvas;
