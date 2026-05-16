import { useTranslations } from 'next-intl';

import { Button, Input, Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

type TItem = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

const TestimonialsInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const items = (content.items as TItem[]) ?? [];

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  const updateItem = (idx: number, item: Partial<TItem>) => {
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
                {t('pages_editor_field_quote_n', { n: idx + 1 })}
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
            <Textarea
              rows={3}
              value={item.quote}
              onChange={(e) => updateItem(idx, { quote: e.target.value })}
            />
            <Input
              value={item.name}
              onChange={(e) => updateItem(idx, { name: e.target.value })}
            />
            <Input
              value={item.role}
              onChange={(e) => updateItem(idx, { role: e.target.value })}
            />
            <Input
              value={item.avatar}
              onChange={(e) => updateItem(idx, { avatar: e.target.value })}
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
                  { quote: '', name: '', role: '', avatar: '' },
                ],
              },
            })
          }
        >
          {t('pages_editor_add_testimonial')}
        </Button>
      </div>
    </div>
  );
};

export default TestimonialsInspector;
