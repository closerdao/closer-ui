import { FormEvent, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import { Button, Textarea } from '../ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

/**
 * "Edit with AI": sends a natural-language request to POST /pages/:id/edit.
 * The result lands in the draft, so the user reviews it before publishing.
 */
const PromptEditDialog = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: Props) => {
  const t = useTranslations();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (open) setPrompt('');
  }, [open]);

  if (!open) return null;

  const canSubmit = prompt.trim().length > 0 && !isSubmitting;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(prompt);
  };

  return (
    <Modal closeModal={onClose} className="md:w-[640px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('pages_editor_prompt_edit_title')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('pages_editor_prompt_edit_subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {t('pages_editor_prompt_edit_label')}
            <span className="text-red-500"> *</span>
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            autoFocus
            placeholder={t('pages_editor_prompt_edit_placeholder')}
          />
          <span className="text-xs text-gray-500">
            {t('pages_editor_prompt_edit_help')}
          </span>
        </div>

        {isSubmitting ? (
          <div
            role="status"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            {t('pages_editor_prompt_edit_applying')}
          </div>
        ) : null}

        {submitError ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 break-words whitespace-pre-line"
          >
            {submitError}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            onClick={onClose}
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
            {t('pages_editor_prompt_edit_submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PromptEditDialog;
