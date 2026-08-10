import { useTranslations } from 'next-intl';

import { Input, Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

const StaySearchInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};

  const patch = (next: Record<string, unknown>) => onChange({ ...data, ...next });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500 leading-relaxed bg-neutral-light rounded-md p-3 border border-gray-100">
        {t('pages_editor_stay_search_hint')}
      </p>
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
          {t('pages_editor_field_subtitle')}
        </label>
        <Textarea
          rows={2}
          value={String(content.subtitle ?? '')}
          onChange={(e) =>
            patch({
              settings,
              content: { ...content, subtitle: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default StaySearchInspector;
