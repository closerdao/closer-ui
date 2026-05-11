import { useTranslations } from 'next-intl';

import Modal from '../Modal';

import type { SectionType } from '../../types/page';

const BLOCK_TYPES: { type: SectionType; labelKey: string; descKey: string }[] = [
  { type: 'hero', labelKey: 'pages_editor_block_hero', descKey: 'pages_editor_block_hero_desc' },
  { type: 'gallery', labelKey: 'pages_editor_block_gallery', descKey: 'pages_editor_block_gallery_desc' },
  {
    type: 'testimonials',
    labelKey: 'pages_editor_block_testimonials',
    descKey: 'pages_editor_block_testimonials_desc',
  },
  { type: 'stats', labelKey: 'pages_editor_block_stats', descKey: 'pages_editor_block_stats_desc' },
  { type: 'features', labelKey: 'pages_editor_block_features', descKey: 'pages_editor_block_features_desc' },
  { type: 'richText', labelKey: 'pages_editor_block_richtext', descKey: 'pages_editor_block_richtext_desc' },
  { type: 'cta', labelKey: 'pages_editor_block_cta', descKey: 'pages_editor_block_cta_desc' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (type: SectionType) => void;
}

const BlockPicker = ({ open, onClose, onPick }: Props) => {
  const t = useTranslations();

  if (!open) return null;

  return (
    <Modal closeModal={() => onClose()}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('pages_editor_picker_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {BLOCK_TYPES.map(({ type, labelKey, descKey }) => (
            <button
              key={type}
              type="button"
              className="text-left border border-gray-200 rounded-lg p-4 hover:border-accent hover:bg-accent-light/30 transition-colors flex flex-col gap-1"
              onClick={() => {
                onPick(type);
                onClose();
              }}
            >
              <span className="font-medium text-gray-900">{t(labelKey)}</span>
              <span className="text-xs text-gray-500">{t(descKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default BlockPicker;
