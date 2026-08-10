import { useTranslations } from 'next-intl';

import { Input, Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

const CTAInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_background')}
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          value={String(settings.style ?? 'default')}
          onChange={(e) =>
            patch({
              settings: { ...settings, style: e.target.value },
              content,
            })
          }
        >
          <option value="default">{t('pages_editor_cta_style_light')}</option>
          <option value="accent">{t('pages_editor_cta_style_accent')}</option>
          <option value="dark">{t('pages_editor_cta_style_dark')}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_eyebrow')}
        </label>
        <Input
          value={String(content.eyebrow ?? '')}
          onChange={(e) =>
            patch({ settings, content: { ...content, eyebrow: e.target.value } })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_title')}
        </label>
        <Textarea
          rows={2}
          value={String(content.title ?? '')}
          onChange={(e) =>
            patch({ settings, content: { ...content, title: e.target.value } })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_text')}
        </label>
        <Textarea
          rows={3}
          value={String(content.text ?? '')}
          onChange={(e) =>
            patch({ settings, content: { ...content, text: e.target.value } })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_primary_label')}
        </label>
        <Input
          value={String(content.primaryText ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, primaryText: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_primary_link')}
        </label>
        <Input
          value={String(content.primaryLink ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, primaryLink: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_secondary_label')}
        </label>
        <Input
          value={String(content.secondaryText ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, secondaryText: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_secondary_link')}
        </label>
        <Input
          value={String(content.secondaryLink ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, secondaryLink: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default CTAInspector;
