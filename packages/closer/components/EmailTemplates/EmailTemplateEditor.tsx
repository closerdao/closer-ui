import { ChangeEvent, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button, Card, ErrorMessage, Heading, Textarea } from '../ui';

import { EmailTemplate } from '../../types/emailTemplate';

const inputClassName =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent';

interface Props {
  template: EmailTemplate;
  templateData: Record<string, unknown>;
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
  onPreview: (templateData: Record<string, unknown>) => Promise<string>;
  onSendToMe: (templateData: Record<string, unknown>) => Promise<void>;
  isAdminOrTeam: boolean;
}

const EDITABLE_FIELDS = [
  'name',
  'description',
  'subject',
  'title',
  'text',
  'body',
  'lowerText',
  'ctaLink',
  'ctaText',
  'list',
  'footerCopy',
  'triggerModel',
  'triggerAction',
  'triggerDelay',
  'emailEnabled',
] as const;

const LABEL_KEYS: Record<string, string> = {
  name: 'config_label_name',
  description: 'config_label_description',
  subject: 'config_label_subject',
  title: 'config_label_title',
  text: 'config_label_text',
  lowerText: 'config_label_lowerText',
  ctaLink: 'config_label_ctaLink',
  ctaText: 'config_label_ctaText',
  list: 'config_label_list',
  footerCopy: 'config_label_footerCopy',
  triggerModel: 'config_label_triggerModel',
  triggerAction: 'config_label_triggerAction',
  triggerDelay: 'config_label_triggerDelay',
  emailEnabled: 'config_label_emailEnabled',
};

const EmailTemplateEditor = ({
  template,
  templateData,
  onSave,
  onPreview,
  onSendToMe,
  isAdminOrTeam,
}: Props) => {
  const t = useTranslations();
  const [formData, setFormData] = useState<Partial<EmailTemplate>>(template);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSendingToMe, setIsSendingToMe] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean = value;
    if (type === 'number') parsedValue = Number(value);
    if (type === 'checkbox') parsedValue = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setSaveError(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(formData);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      const html = await onPreview(templateData);
      setPreviewHtml(html);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSendToMe = async () => {
    try {
      setIsSendingToMe(true);
      setSendError(null);
      await onSendToMe(templateData);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setIsSendingToMe(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Heading level={3}>{t('admin_emails_edit_template')}</Heading>
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin_emails_slug_readonly')}
            </label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
              type="text"
              value={template.slug}
              readOnly
              disabled
            />
          </div>
          {EDITABLE_FIELDS.filter(
            (f) => f !== 'body' && f !== 'text' && f !== 'title',
          ).map(
            (field) => {
              const value = formData[field];
              const isBoolean = field === 'emailEnabled';
              const isNumber = field === 'triggerDelay';
              const label = LABEL_KEYS[field]
                ? t(LABEL_KEYS[field])
                : field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  {isBoolean ? (
                    <div className="flex gap-4">
                      <label className="flex gap-2 items-center text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={field}
                          checked={value === true}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, [field]: true }))
                          }
                          className="w-4 h-4 text-accent"
                        />
                        {t('config_true')}
                      </label>
                      <label className="flex gap-2 items-center text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={field}
                          checked={value === false}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, [field]: false }))
                          }
                          className="w-4 h-4 text-accent"
                        />
                        {t('config_false')}
                      </label>
                    </div>
                  ) : (
                    <input
                      name={field}
                      value={String(value ?? '')}
                      onChange={handleChange}
                      type={isNumber ? 'number' : 'text'}
                      className={inputClassName}
                    />
                  )}
                </div>
              );
            },
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('config_label_title')}
            </label>
            <Textarea
              name="title"
              value={formData.title ?? ''}
              onChange={handleChange}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('config_label_body')}
            </label>
            <Textarea
              name="body"
              value={formData.body ?? ''}
              onChange={handleChange}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          {saveError && <ErrorMessage error={saveError} />}
          <Button onClick={handleSave} isLoading={isSaving} isEnabled={!isSaving}>
            {t('generic_save_button')}
          </Button>
        </div>
      </Card>

      <Card>
        <Heading level={3}>Preview</Heading>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Button
                onClick={handlePreview}
                isLoading={isLoadingPreview}
                isEnabled={!isLoadingPreview}
                variant="secondary"
                size="small"
              >
                {t('admin_emails_refresh_preview')}
              </Button>
              {isAdminOrTeam && (
                <Button
                  onClick={handleSendToMe}
                  isLoading={isSendingToMe}
                  isEnabled={!isSendingToMe}
                  variant="secondary"
                  size="small"
                >
                  {t('admin_emails_send_to_me')}
                </Button>
              )}
          </div>
          {previewError && <ErrorMessage error={previewError} />}
          {sendError && <ErrorMessage error={sendError} />}
          {previewHtml ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="w-full min-h-[400px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t('admin_emails_preview_hint')}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EmailTemplateEditor;
