import { FormEvent, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import { Button, Input, Textarea } from '../ui';

import { slugify } from '../../utils/common';

export interface NewPageData {
  title: string;
  description: string;
  slug: string;
  customData?: Record<string, unknown>;
}

export const buildNewPagePayload = (
  data: NewPageData,
): Record<string, unknown> => {
  const base: Record<string, unknown> = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    ogImage: '',
    sections: [],
  };
  if (!data.customData) return base;
  const { _id: _ignoredId, ...rest } = data.customData;
  return { ...base, ...rest };
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewPageData) => Promise<void> | void;
  isSubmitting?: boolean;
}

const TOP_LEVEL_STRING_FIELDS = ['title', 'description', 'slug', 'ogImage'] as const;

const toSlug = (title: string) => {
  const base = slugify(title);
  return base ? `/${base}` : '';
};

const normalizeSlug = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

type ValidationResult =
  | { ok: true; parsed: Record<string, unknown> | null }
  | { ok: false; error: string };

const validateCustomJson = (raw: string): ValidationResult => {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, parsed: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'Top-level value must be a JSON object.' };
  }

  const obj = parsed as Record<string, unknown>;

  for (const key of TOP_LEVEL_STRING_FIELDS) {
    if (key in obj && obj[key] != null && typeof obj[key] !== 'string') {
      return { ok: false, error: `Field "${key}" must be a string.` };
    }
  }

  if ('sections' in obj && obj.sections != null) {
    if (!Array.isArray(obj.sections)) {
      return { ok: false, error: '"sections" must be an array.' };
    }
    for (let i = 0; i < obj.sections.length; i++) {
      const s = obj.sections[i];
      if (typeof s !== 'object' || s === null || Array.isArray(s)) {
        return { ok: false, error: `sections[${i}] must be an object.` };
      }
      const sec = s as Record<string, unknown>;
      if (typeof sec.type !== 'string' || !sec.type.trim()) {
        return {
          ok: false,
          error: `sections[${i}].type must be a non-empty string.`,
        };
      }
      if (
        typeof sec.data !== 'object' ||
        sec.data === null ||
        Array.isArray(sec.data)
      ) {
        return {
          ok: false,
          error: `sections[${i}].data must be an object.`,
        };
      }
    }
  }

  return { ok: true, parsed: obj };
};

const NewPageDialog = ({ open, onClose, onCreate, isSubmitting }: Props) => {
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [customData, setCustomData] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setSlug('');
      setSlugTouched(false);
      setCustomData('');
      setAdvancedOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(title));
  }, [title, slugTouched]);

  const validation = useMemo(() => validateCustomJson(customData), [customData]);
  const jsonTitle =
    validation.ok &&
    validation.parsed &&
    typeof validation.parsed.title === 'string'
      ? (validation.parsed.title as string).trim()
      : '';

  if (!open) return null;

  const hasTitle = title.trim().length > 0 || jsonTitle.length > 0;
  const canSubmit = hasTitle && validation.ok && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const finalSlug = normalizeSlug(slug) || toSlug(title) || '/';
    await onCreate({
      title: title.trim(),
      description: description.trim(),
      slug: finalSlug,
      customData: validation.ok && validation.parsed ? validation.parsed : undefined,
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      closeModal={handleClose}
      className={advancedOpen ? 'md:w-[760px] lg:w-[880px]' : undefined}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('pages_editor_new_page_dialog_title')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('pages_editor_new_page_dialog_subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('pages_editor_field_page_title')}
            <span className="text-red-500"> *</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('pages_editor_new_page_title_placeholder')}
            autoFocus
            isRequired={jsonTitle.length === 0}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('pages_editor_field_meta_description')}
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t('pages_editor_new_page_description_placeholder')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('pages_editor_field_slug')}
          </label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="/my-page"
          />
          <span className="text-xs text-gray-500">
            {t('pages_editor_slug_help')}
          </span>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <span>{t('pages_editor_new_page_advanced')}</span>
            <span
              className={`transition-transform text-gray-400 ${advancedOpen ? 'rotate-180' : ''}`}
              aria-hidden
            >
              ▾
            </span>
          </button>
          {advancedOpen ? (
            <div className="flex flex-col gap-1 px-3 pb-3">
              <label className="text-sm font-medium text-gray-700">
                {t('pages_editor_new_page_custom_data')}
              </label>
              <Textarea
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                rows={20}
                className="font-mono text-xs leading-relaxed resize-y min-h-[320px] max-h-[60vh] whitespace-pre"
                spellCheck={false}
                placeholder='{"sections": [{"type": "richText", "data": {"settings": {}, "content": {"html": "<p>Hello</p>"}}}]}'
              />
              {!validation.ok ? (
                <span className="text-xs text-red-600 break-words">
                  {t('pages_editor_new_page_custom_data_invalid')}: {validation.error}
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  {t('pages_editor_new_page_custom_data_help')}
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            onClick={handleClose}
            isEnabled={!isSubmitting}
          >
            {t('pages_editor_new_page_cancel')}
          </Button>
          <Button
            type="submit"
            size="small"
            isFullWidth={false}
            isLoading={isSubmitting}
            isEnabled={canSubmit}
          >
            {t('pages_editor_new_page_create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewPageDialog;
