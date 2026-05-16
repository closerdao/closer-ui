import { useTranslations } from 'next-intl';

import {
  SECTION_BACKGROUNDS,
  SectionBackground,
} from '../../custom-pages/sectionBackground';

interface Props {
  value?: string;
  onChange: (next: SectionBackground) => void;
}

const BG_PREVIEW: Record<SectionBackground, string> = {
  transparent:
    'bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,white_25%,white_75%,#f3f4f6_75%,#f3f4f6)] bg-[length:10px_10px] bg-[position:0_0,5px_5px]',
  white: 'bg-white border-gray-300',
  'neutral-light': 'bg-neutral-light',
  'accent-light': 'bg-accent-light',
  'gray-50': 'bg-gray-50',
  'gradient-accent': 'bg-gradient-to-br from-accent-light to-accent-alt-light',
  dark: 'bg-gray-900',
};

const BackgroundField = ({ value, onChange }: Props) => {
  const t = useTranslations();
  const current = (value as SectionBackground) || 'transparent';
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('pages_editor_field_background')}
      </label>
      <div className="flex flex-wrap gap-2">
        {SECTION_BACKGROUNDS.map((bg) => {
          const isActive = current === bg;
          return (
            <button
              key={bg}
              type="button"
              title={t(`pages_editor_bg_${bg.replace('-', '_')}`)}
              aria-label={t(`pages_editor_bg_${bg.replace('-', '_')}`)}
              onClick={() => onChange(bg)}
              className={`w-8 h-8 rounded-md border transition-all ${
                BG_PREVIEW[bg]
              } ${
                isActive
                  ? 'ring-2 ring-accent ring-offset-2 border-accent'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BackgroundField;
