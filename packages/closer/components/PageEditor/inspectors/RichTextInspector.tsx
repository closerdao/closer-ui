import { useTranslations } from 'next-intl';

import { Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

const RichTextInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  return (
    <div className="flex flex-col gap-4">
      <label className="flex gap-2 items-center text-sm">
        <input
          type="checkbox"
          checked={Boolean(settings.isColorful)}
          onChange={(e) =>
            patch({
              settings: { ...settings, isColorful: e.target.checked },
              content,
            })
          }
        />
        {t('pages_editor_field_colorful')}
      </label>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_html')}
        </label>
        <Textarea
          rows={10}
          className="font-mono text-sm"
          value={String(content.html ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, html: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default RichTextInspector;
