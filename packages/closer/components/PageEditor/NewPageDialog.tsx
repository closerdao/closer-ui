import { FormEvent, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import { Button, Input, Textarea } from '../ui';

import { slugify } from '../../utils/common';

export interface NewPageData {
  title: string;
  description: string;
  slug: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewPageData) => Promise<void> | void;
  isSubmitting?: boolean;
}

const toSlug = (title: string) => {
  const base = slugify(title);
  return base ? `/${base}` : '';
};

const normalizeSlug = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const NewPageDialog = ({ open, onClose, onCreate, isSubmitting }: Props) => {
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setSlug('');
      setSlugTouched(false);
    }
  }, [open]);

  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(title));
  }, [title, slugTouched]);

  if (!open) return null;

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const finalSlug = normalizeSlug(slug) || toSlug(title) || '/';
    await onCreate({
      title: title.trim(),
      description: description.trim(),
      slug: finalSlug,
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal closeModal={handleClose}>
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
            isRequired
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
