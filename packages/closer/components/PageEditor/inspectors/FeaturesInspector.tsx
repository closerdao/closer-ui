import { useTranslations } from 'next-intl';

import {
  FEATURE_BLOCK_ICONS,
  type FeatureVisualType,
  resolveFeatureVisualType,
} from '../../../constants/featureBlockIcons';
import { Button, Input, Textarea } from '../../ui';
import BlockImageUpload from '../BlockImageUpload';
import PageEditorCheckbox from '../PageEditorCheckbox';

import type { BlockInspectorFormProps } from './types';

type FItem = {
  title: string;
  text: string;
  imageUrl: string;
  visualType?: FeatureVisualType;
  iconId?: string;
  emoji?: string;
};

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
      <PageEditorCheckbox
        checked={Boolean(settings.isColorful)}
        onChange={(checked) =>
          patch({
            settings: { ...settings, isColorful: checked },
            content,
          })
        }
      >
        {t('pages_editor_field_colorful')}
      </PageEditorCheckbox>
      <PageEditorCheckbox
        checked={Boolean(settings.isSmallImage)}
        onChange={(checked) =>
          patch({
            settings: { ...settings, isSmallImage: checked },
            content,
          })
        }
      >
        {t('pages_editor_field_small_images')}
      </PageEditorCheckbox>
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
        {items.map((item, idx) => {
          const visualType = resolveFeatureVisualType(item);
          return (
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('pages_editor_field_visual_type')}
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  value={visualType}
                  onChange={(e) =>
                    updateItem(idx, {
                      visualType: e.target.value as FeatureVisualType,
                    })
                  }
                >
                  <option value="none">{t('pages_editor_visual_none')}</option>
                  <option value="photo">{t('pages_editor_visual_photo')}</option>
                  <option value="icon">{t('pages_editor_visual_icon')}</option>
                  <option value="emoji">{t('pages_editor_visual_emoji')}</option>
                </select>
              </div>
              {visualType === 'photo' ? (
                <BlockImageUpload
                  value={item.imageUrl ?? ''}
                  onChange={(url) => updateItem(idx, { imageUrl: url })}
                />
              ) : null}
              {visualType === 'icon' ? (
                <div className="grid grid-cols-4 gap-2">
                  {FEATURE_BLOCK_ICONS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      title={id}
                      onClick={() => updateItem(idx, { iconId: id })}
                      className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                        item.iconId === id
                          ? 'border-accent bg-accent-light/40'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-accent" />
                    </button>
                  ))}
                </div>
              ) : null}
              {visualType === 'emoji' ? (
                <Input
                  value={item.emoji ?? ''}
                  maxLength={2}
                  placeholder={t('pages_editor_field_emoji_placeholder')}
                  onChange={(e) => updateItem(idx, { emoji: e.target.value })}
                />
              ) : null}
            </div>
          );
        })}
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
                  {
                    title: '',
                    text: '<p></p>',
                    imageUrl: '',
                    visualType: 'none' as const,
                  },
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
