import { useTranslations } from 'next-intl';

import { Input, Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

const alignOptions = [
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
  'left',
  'right',
  'center',
] as const;

const HeroInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const cta = (content.cta as Record<string, string>) ?? { text: '', url: '' };

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_align_text')}
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          value={String(settings.alignText ?? 'bottom-left')}
          onChange={(e) =>
            patch({
              settings: { ...settings, alignText: e.target.value },
              content,
            })
          }
        >
          {alignOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 shrink-0 accent-accent"
          checked={Boolean(settings.isInverted)}
          onChange={(e) =>
            patch({
              settings: { ...settings, isInverted: e.target.checked },
              content,
            })
          }
        />
        <span className="leading-none">{t('pages_editor_field_inverted')}</span>
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 shrink-0 accent-accent"
          checked={Boolean(settings.isCompact)}
          onChange={(e) =>
            patch({
              settings: { ...settings, isCompact: e.target.checked },
              content,
            })
          }
        />
        <span className="leading-none">{t('pages_editor_field_compact')}</span>
      </label>
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
          {t('pages_editor_field_body_html')}
        </label>
        <Textarea
          rows={4}
          value={String(content.body ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, body: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_image_url')}
        </label>
        <Input
          value={String(content.imageUrl ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, imageUrl: e.target.value },
            })
          }
        />
      </div>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_mobile_video_url')}
        </label>
        <Input
          value={String(content.mobileVideoUrl ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, mobileVideoUrl: e.target.value },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_cta_text')}
        </label>
        <Input
          value={String(cta.text ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: {
                ...content,
                cta: { ...cta, text: e.target.value },
              },
            })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_cta_url')}
        </label>
        <Input
          value={String(cta.url ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: {
                ...content,
                cta: { ...cta, url: e.target.value },
              },
            })
          }
        />
      </div>
    </div>
  );
};

export default HeroInspector;
