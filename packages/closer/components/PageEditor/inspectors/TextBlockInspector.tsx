import { useTranslations } from 'next-intl';

import { Input, Textarea } from '../../ui';
import BlockImageUpload from '../BlockImageUpload';

import type { BlockInspectorFormProps } from './types';

const TextBlockInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const imagePosition =
    (settings.imagePosition as 'left' | 'right' | 'none') ?? 'none';

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_image_position')}
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          value={imagePosition}
          onChange={(e) =>
            patch({
              settings: { ...settings, imagePosition: e.target.value },
              content,
            })
          }
        >
          <option value="none">{t('pages_editor_image_position_none')}</option>
          <option value="left">{t('pages_editor_image_position_left')}</option>
          <option value="right">{t('pages_editor_image_position_right')}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_title')}
        </label>
        <Input
          value={String(content.title ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, title: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_body_text')}
        </label>
        <Textarea
          rows={8}
          value={String(content.body ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, body: e.target.value },
            })
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('pages_editor_field_body_text_help')}
        </p>
      </div>
      {imagePosition !== 'none' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('pages_editor_field_image_url')}
            </label>
            <BlockImageUpload
              value={String(content.imageUrl ?? '')}
              onChange={(url) =>
                patch({
                  settings,
                  content: { ...content, imageUrl: url },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('pages_editor_field_image_alt')}
            </label>
            <Input
              value={String(content.imageAlt ?? '')}
              onChange={(e) =>
                patch({
                  settings,
                  content: { ...content, imageAlt: e.target.value },
                })
              }
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default TextBlockInspector;
