import { useTranslations } from 'next-intl';

import { Button, Input, Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

type FItem = { title: string; text: string; imageUrl: string };

const FeaturesInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const items = (content.items as FItem[]) ?? [];

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  const updateItem = (idx: number, item: Partial<FItem>) => {
    const nextItems = items.map((it, i) => (i === idx ? { ...it, ...item } : it));
    patch({ settings, content: { ...content, items: nextItems } });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_columns')}
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          value={String(settings.numColumns ?? 3)}
          onChange={(e) =>
            patch({
              settings: { ...settings, numColumns: Number(e.target.value) },
              content,
            })
          }
        >
          {[2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
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
      <label className="flex gap-2 items-center text-sm">
        <input
          type="checkbox"
          checked={Boolean(settings.isSmallImage)}
          onChange={(e) =>
            patch({
              settings: { ...settings, isSmallImage: e.target.checked },
              content,
            })
          }
        />
        {t('pages_editor_field_small_images')}
      </label>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_title')}
        </label>
        <Input
          value={String(content.title ?? '')}
          onChange={(e) =>
            patch({ settings, content: { ...content, title: e.target.value } })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_intro')}
        </label>
        <Textarea
          rows={2}
          value={String(content.description ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, description: e.target.value },
            })
          }
        />
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-neutral-light"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">
                {t('pages_editor_field_feature_n', { n: idx + 1 })}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={items.length > 1}
                onClick={() =>
                  patch({
                    settings,
                    content: {
                      ...content,
                      items: items.filter((_, i) => i !== idx),
                    },
                  })
                }
              >
                {t('pages_editor_remove')}
              </Button>
            </div>
            <Input
              value={item.title}
              onChange={(e) => updateItem(idx, { title: e.target.value })}
            />
            <Textarea
              rows={3}
              value={item.text}
              onChange={(e) => updateItem(idx, { text: e.target.value })}
            />
            <Input
              value={item.imageUrl}
              onChange={(e) => updateItem(idx, { imageUrl: e.target.value })}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="small"
          isFullWidth={false}
          onClick={() =>
            patch({
              settings,
              content: {
                ...content,
                items: [
                  ...items,
                  { title: '', text: '<p></p>', imageUrl: '' },
                ],
              },
            })
          }
        >
          {t('pages_editor_add_feature')}
        </Button>
      </div>
    </div>
  );
};

export default FeaturesInspector;
