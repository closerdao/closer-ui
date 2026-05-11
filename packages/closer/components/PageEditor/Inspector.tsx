import { useTranslations } from 'next-intl';

import { Button, Heading, Input, Textarea } from '../ui';

import CTAInspector from './inspectors/CTAInspector';
import FeaturesInspector from './inspectors/FeaturesInspector';
import GalleryInspector from './inspectors/GalleryInspector';
import HeroInspector from './inspectors/HeroInspector';
import RichTextInspector from './inspectors/RichTextInspector';
import StatsInspector from './inspectors/StatsInspector';
import TestimonialsInspector from './inspectors/TestimonialsInspector';

import type { PageDoc, PageSection } from '../../types/page';

type Tab = 'block' | 'page' | 'seo';

interface Props {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  page: PageDoc;
  onPageFieldChange: (field: keyof PageDoc, value: string) => void;
  selectedSection: PageSection | null;
  onSectionDataChange: (localId: string, data: Record<string, unknown>) => void;
  onDeletePage: () => void;
  onClose?: () => void;
  showClose?: boolean;
}

const Inspector = ({
  tab,
  onTabChange,
  page,
  onPageFieldChange,
  selectedSection,
  onSectionDataChange,
  onDeletePage,
  onClose,
  showClose,
}: Props) => {
  const t = useTranslations();

  const renderBlockForm = () => {
    if (!selectedSection) {
      return (
        <p className="text-sm text-gray-500 text-center py-10">
          {t('pages_editor_empty_inspector')}
        </p>
      );
    }
    const common = {
      data: selectedSection.data as Record<string, unknown>,
      onChange: (next: Record<string, unknown>) =>
        onSectionDataChange(selectedSection._localId!, next),
    };
    switch (selectedSection.type) {
      case 'hero':
        return <HeroInspector {...common} />;
      case 'gallery':
        return <GalleryInspector {...common} />;
      case 'testimonials':
        return <TestimonialsInspector {...common} />;
      case 'stats':
        return <StatsInspector {...common} />;
      case 'features':
        return <FeaturesInspector {...common} />;
      case 'richText':
        return <RichTextInspector {...common} />;
      case 'cta':
        return <CTAInspector {...common} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-100 shrink-0 flex justify-between items-start gap-2">
        <div>
          <Heading level={4} className="text-base">
            {tab === 'block'
              ? selectedSection
                ? selectedSection.type
                : t('pages_editor_tab_block')
              : tab === 'page'
                ? t('pages_editor_tab_page')
                : t('pages_editor_tab_seo')}
          </Heading>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            {tab === 'block'
              ? selectedSection
                ? t('pages_editor_block_settings')
                : t('pages_editor_nothing_selected')
              : tab === 'page'
                ? t('pages_editor_page_identity')
                : t('pages_editor_seo_sub')}
          </p>
        </div>
        {showClose && onClose ? (
          <button
            type="button"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        ) : null}
      </div>
      <div className="flex border-b border-gray-100 px-2 gap-0 shrink-0">
        {(['block', 'page', 'seo'] as Tab[]).map((tKey) => (
          <button
            key={tKey}
            type="button"
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === tKey
                ? 'border-accent text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onTabChange(tKey)}
          >
            {t(`pages_editor_tab_${tKey}`)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {tab === 'block' && renderBlockForm()}
        {tab === 'page' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pages_editor_field_page_title')}
              </label>
              <Input
                value={page.title}
                onChange={(e) => onPageFieldChange('title', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pages_editor_field_slug')}
              </label>
              <Input
                value={page.slug}
                onChange={(e) => onPageFieldChange('slug', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">{t('pages_editor_slug_help')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <Input value={page._id} isDisabled />
            </div>
            <Button variant="secondary" type="button" onClick={onDeletePage}>
              {t('pages_editor_delete_page')}
            </Button>
          </div>
        )}
        {tab === 'seo' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pages_editor_field_meta_description')}
              </label>
              <Textarea
                rows={4}
                value={page.description ?? ''}
                onChange={(e) => onPageFieldChange('description', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pages_editor_field_og_image')}
              </label>
              <Input
                value={page.ogImage ?? ''}
                onChange={(e) => onPageFieldChange('ogImage', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
