import { useTranslations } from 'next-intl';

import { Button, Input } from '../../ui';

import type { BlockInspectorFormProps } from './types';

type GalleryItem = {
  imageUrl: string;
  width: number;
  height: number;
  alt: string;
};

const GalleryInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const items = (content.items as GalleryItem[]) ?? [];

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  const updateItem = (idx: number, item: Partial<GalleryItem>) => {
    const nextItems = items.map((it, i) => (i === idx ? { ...it, ...item } : it));
    patch({
      settings,
      content: { ...content, items: nextItems },
    });
  };

  const addItem = () => {
    patch({
      settings,
      content: {
        ...content,
        items: [
          ...items,
          {
            imageUrl: 'https://cdn.oasa.co/tdf/tdf-invest-og.jpg',
            width: 800,
            height: 600,
            alt: '',
          },
        ],
      },
    });
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    patch({
      settings,
      content: {
        ...content,
        items: items.filter((_, i) => i !== idx),
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_section_title')}
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
      <label className="flex gap-2 items-center text-sm">
        <input
          type="checkbox"
          checked={Boolean(settings.isRandomized)}
          onChange={(e) =>
            patch({
              settings: { ...settings, isRandomized: e.target.checked },
              content,
            })
          }
        />
        {t('pages_editor_field_randomize')}
      </label>
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {t('pages_editor_field_images')}
        </span>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-neutral-light"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">
                {t('pages_editor_field_image_n', { n: idx + 1 })}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={items.length > 1}
                onClick={() => removeItem(idx)}
              >
                {t('pages_editor_remove')}
              </Button>
            </div>
            <Input
              value={item.imageUrl}
              onChange={(e) => updateItem(idx, { imageUrl: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">W</label>
                <Input
                  type="number"
                  value={String(item.width)}
                  onChange={(e) =>
                    updateItem(idx, { width: Number(e.target.value) || 800 })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">H</label>
                <Input
                  type="number"
                  value={String(item.height)}
                  onChange={(e) =>
                    updateItem(idx, { height: Number(e.target.value) || 600 })
                  }
                />
              </div>
            </div>
            <Input
              value={item.alt}
              onChange={(e) => updateItem(idx, { alt: e.target.value })}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" size="small" onClick={addItem}>
          {t('pages_editor_add_image')}
        </Button>
      </div>
    </div>
  );
};

export default GalleryInspector;
