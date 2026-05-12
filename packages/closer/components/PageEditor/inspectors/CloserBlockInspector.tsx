import { useTranslations } from 'next-intl';

import { Input, Textarea } from '../../ui';

import type { BlockInspectorFormProps } from './types';

interface Props extends BlockInspectorFormProps {
  hint: string;
  showCtaToggle?: boolean;
}

const CloserBlockInspector = ({
  data,
  onChange,
  hint,
  showCtaToggle,
}: Props) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};

  const patch = (next: Record<string, unknown>) =>
    onChange({ ...data, ...next });

  const patchContent = (key: string, value: string) =>
    patch({ settings, content: { ...content, [key]: value } });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500 leading-relaxed bg-neutral-light rounded-md p-3 border border-gray-100">
        {hint}
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_eyebrow')}
        </label>
        <Input
          value={String(content.eyebrow ?? '')}
          onChange={(e) => patchContent('eyebrow', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_title')}
        </label>
        <Input
          value={String(content.title ?? '')}
          onChange={(e) => patchContent('title', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_description')}
        </label>
        <Textarea
          rows={3}
          value={String(content.description ?? '')}
          onChange={(e) => patchContent('description', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_cta_text')}
        </label>
        <Input
          value={String(content.ctaText ?? '')}
          onChange={(e) => patchContent('ctaText', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_cta_url')}
        </label>
        <Input
          value={String(content.ctaLink ?? '')}
          onChange={(e) => patchContent('ctaLink', e.target.value)}
        />
      </div>
      {showCtaToggle ? (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 shrink-0 accent-accent"
            checked={settings.showCta !== false}
            onChange={(e) =>
              patch({
                settings: { ...settings, showCta: e.target.checked },
                content,
              })
            }
          />
          <span className="leading-none">
            {t('pages_editor_field_show_cta')}
          </span>
        </label>
      ) : null}
    </div>
  );
};

export default CloserBlockInspector;
