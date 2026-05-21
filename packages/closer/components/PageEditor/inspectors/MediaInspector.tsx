import { useTranslations } from 'next-intl';

import { Input } from '../../ui';
import BlockImageUpload from '../BlockImageUpload';

import type { BlockInspectorFormProps } from './types';

const MediaInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const mediaType = (settings.mediaType as 'image' | 'video') ?? 'image';

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_media_type')}
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          value={mediaType}
          onChange={(e) =>
            patch({
              settings: { ...settings, mediaType: e.target.value },
              content,
            })
          }
        >
          <option value="image">{t('pages_editor_media_type_image')}</option>
          <option value="video">{t('pages_editor_media_type_video')}</option>
        </select>
      </div>
      {mediaType === 'image' ? (
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
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('pages_editor_field_video_embed_id')}
          </label>
          <Input
            value={String(content.videoEmbedId ?? '')}
            onChange={(e) =>
              patch({
                settings,
                content: { ...content, videoEmbedId: e.target.value },
              })
            }
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_image_alt')}
        </label>
        <Input
          value={String(content.alt ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, alt: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_caption')}
        </label>
        <Input
          value={String(content.caption ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, caption: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default MediaInspector;
