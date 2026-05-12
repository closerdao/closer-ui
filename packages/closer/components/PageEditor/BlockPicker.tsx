import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import { useConfig } from '../../hooks/useConfig';
import { getPageEditorFeatureFlags } from './featureFlags';

import type { SectionType } from '../../types/page';

interface BlockTypeDef {
  type: SectionType;
  labelKey: string;
  descKey: string;
  category: 'layout' | 'closer';
  featureKey?: 'fundraiser' | 'tokenStats' | 'webinar' | 'events';
}

const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: 'hero',
    labelKey: 'pages_editor_block_hero',
    descKey: 'pages_editor_block_hero_desc',
    category: 'layout',
  },
  {
    type: 'gallery',
    labelKey: 'pages_editor_block_gallery',
    descKey: 'pages_editor_block_gallery_desc',
    category: 'layout',
  },
  {
    type: 'testimonials',
    labelKey: 'pages_editor_block_testimonials',
    descKey: 'pages_editor_block_testimonials_desc',
    category: 'layout',
  },
  {
    type: 'stats',
    labelKey: 'pages_editor_block_stats',
    descKey: 'pages_editor_block_stats_desc',
    category: 'layout',
  },
  {
    type: 'features',
    labelKey: 'pages_editor_block_features',
    descKey: 'pages_editor_block_features_desc',
    category: 'layout',
  },
  {
    type: 'richText',
    labelKey: 'pages_editor_block_richtext',
    descKey: 'pages_editor_block_richtext_desc',
    category: 'layout',
  },
  {
    type: 'cta',
    labelKey: 'pages_editor_block_cta',
    descKey: 'pages_editor_block_cta_desc',
    category: 'layout',
  },
  {
    type: 'events',
    labelKey: 'pages_editor_block_events',
    descKey: 'pages_editor_block_events_desc',
    category: 'closer',
    featureKey: 'events',
  },
  {
    type: 'fundraiser',
    labelKey: 'pages_editor_block_fundraiser',
    descKey: 'pages_editor_block_fundraiser_desc',
    category: 'closer',
    featureKey: 'fundraiser',
  },
  {
    type: 'tokenStats',
    labelKey: 'pages_editor_block_token_stats',
    descKey: 'pages_editor_block_token_stats_desc',
    category: 'closer',
    featureKey: 'tokenStats',
  },
  {
    type: 'webinar',
    labelKey: 'pages_editor_block_webinar',
    descKey: 'pages_editor_block_webinar_desc',
    category: 'closer',
    featureKey: 'webinar',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (type: SectionType) => void;
}

const BlockPicker = ({ open, onClose, onPick }: Props) => {
  const t = useTranslations();
  const config = useConfig();
  const flags = getPageEditorFeatureFlags(config);

  if (!open) return null;

  const visibleBlocks = BLOCK_TYPES.filter(
    (b) => !b.featureKey || flags[b.featureKey],
  );
  const layoutBlocks = visibleBlocks.filter((b) => b.category === 'layout');
  const closerBlocks = visibleBlocks.filter((b) => b.category === 'closer');

  const renderBlock = ({ type, labelKey, descKey }: BlockTypeDef) => (
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
  );

  return (
    <Modal closeModal={() => onClose()}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('pages_editor_picker_title')}
        </h2>
        <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t('pages_editor_picker_category_layout')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {layoutBlocks.map(renderBlock)}
            </div>
          </div>
          {closerBlocks.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t('pages_editor_picker_category_closer')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {closerBlocks.map(renderBlock)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default BlockPicker;
