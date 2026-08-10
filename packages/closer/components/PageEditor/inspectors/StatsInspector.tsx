import { useTranslations } from 'next-intl';

import { Button, Input } from '../../ui';

import type { BlockInspectorFormProps } from './types';

type SItem = { value: string; label: string };

const StatsInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const items = (content.items as SItem[]) ?? [];

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  const updateItem = (idx: number, item: Partial<SItem>) => {
    const nextItems = items.map((it, i) => (i === idx ? { ...it, ...item } : it));
    patch({ settings, content: { ...content, items: nextItems } });
  };

  return (
    <div className="flex flex-col gap-4">
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
        <Input
          value={String(content.title ?? '')}
          onChange={(e) =>
            patch({ settings, content: { ...content, title: e.target.value } })
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
                {t('pages_editor_field_metric_n', { n: idx + 1 })}
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
              value={item.value}
              onChange={(e) => updateItem(idx, { value: e.target.value })}
            />
            <Input
              value={item.label}
              onChange={(e) => updateItem(idx, { label: e.target.value })}
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
                items: [...items, { value: '0', label: 'Label' }],
              },
            })
          }
        >
          {t('pages_editor_add_metric')}
        </Button>
      </div>
    </div>
  );
};

export default StatsInspector;
