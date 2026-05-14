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

import CustomSectionComponent from '../custom-pages/CustomSectionComponent';
import { Button } from '../ui';

import I18nHoverAction from './I18nHoverAction';

import type { ReactNode } from 'react';

import type { PageDoc, PageSection } from '../../types/page';
import { resolveBlockText } from '../../utils/blockI18n';

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
}: Props) => {
  const t = useTranslations();
  const sections = page.sections ?? [];

  if (isPreview) {
    return (
      <div className="min-h-0 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto">
          {sections.map((s) => (
            <CustomSectionComponent
              key={s._localId ?? s._id}
              type={s.type}
              data={s.data}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-white/90 backdrop-blur shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <I18nHoverAction
            raw={page.title?.trim() || null}
            display={
              (page.title?.trim() && resolveBlockText(page.title, t)) ||
              t('pages_editor_untitled')
            }
            className="max-w-[200px] min-w-0 flex-1 xl:max-w-xs"
            textClassName="truncate text-sm font-semibold text-gray-900"
          />
          <span className="text-gray-300" aria-hidden>
            &middot;
          </span>
          <code className="text-xs text-gray-500 truncate hidden sm:inline">
            {page.slug}
          </code>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            onClick={onToggleJson}
          >
            {t('pages_editor_json')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            onClick={onTogglePreview}
          >
            {t('pages_editor_preview')}
          </Button>
          <Button
            type="button"
            size="small"
            isFullWidth={false}
            isLoading={isSaving}
            isEnabled={!isSaving}
            onClick={onSave}
          >
            {t('pages_editor_save')}
          </Button>
        </div>
      </div>
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
        <p className="sr-only" aria-live="polite">
          {saveStatus === 'saving'
            ? t('pages_editor_saving')
            : saveStatus === 'unsaved'
              ? t('pages_editor_unsaved')
              : saveStatus === 'error'
                ? t('pages_editor_save_error')
                : t('pages_editor_saved')}
        </p>
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
        className="relative z-[1] w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 opacity-0 group-hover/dz:opacity-100 hover:border-accent hover:text-accent transition-opacity flex items-center justify-center"
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
  return (
    <section
      className={`group/block relative border-2 rounded-md transition-colors ${
        selected ? 'border-accent ring-2 ring-accent/15' : 'border-transparent hover:border-gray-200'
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
        className={`absolute top-2 right-2 z-20 flex gap-0.5 p-1 rounded-md bg-white/95 shadow border border-gray-100 opacity-0 ${
          selected ? 'opacity-100' : 'group-hover/block:opacity-100'
        }`}
        data-controls
        onClick={(e) => e.stopPropagation()}
      >
        <ControlBtn label={t('pages_editor_move_up')} disabled={index === 0} onClick={onMoveUp}>
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
        <ControlBtn label={t('pages_editor_delete_block')} onClick={onDelete} danger>
          <Trash2 className="w-4 h-4" />
        </ControlBtn>
      </div>
      {PLACEHOLDER_BLOCK_KEYS[section.type] ? (
        <div className="relative">
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 py-10 px-6 text-center bg-neutral-light/40 border border-dashed border-gray-200 rounded-md pointer-events-none">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {t(PLACEHOLDER_BLOCK_KEYS[section.type])}
            </span>
            <span className="text-xs text-gray-500">
              {t('pages_editor_block_preview_hidden')}
            </span>
          </div>
          <div className="relative z-10 pointer-events-none [&_*]:pointer-events-auto min-h-[140px]">
            <CustomSectionComponent type={section.type} data={section.data} />
          </div>
        </div>
      ) : (
        <div className="pointer-events-none [&_*]:pointer-events-auto">
          <CustomSectionComponent type={section.type} data={section.data} />
        </div>
      )}
    </section>
  );
}

const PLACEHOLDER_BLOCK_KEYS: Record<string, string> = {
  events: 'pages_editor_block_events',
  fundraiser: 'pages_editor_block_fundraiser',
  tokenStats: 'pages_editor_block_token_stats',
  webinar: 'pages_editor_block_webinar',
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
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default EditorCanvas;
