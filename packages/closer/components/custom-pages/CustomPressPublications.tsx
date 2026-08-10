import React from 'react';

import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';

interface PublicationItem {
  name: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    items?: PublicationItem[];
  };
}

const DEFAULT_PUBLICATIONS: PublicationItem[] = [
  { name: 'Expresso' },
  { name: 'Forbes Portugal' },
  { name: 'Diário de Notícias' },
  { name: 'Jornal Económico' },
  { name: 'EFE Verde' },
  { name: 'Idealista' },
];

const CustomPressPublications = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('press_featured_in'));

  const items =
    content?.items && content.items.length > 0
      ? content.items.map((item) => ({
          name: pick(item.name, item.name),
        }))
      : DEFAULT_PUBLICATIONS;

  return (
    <section className="bg-gray-50 py-16 md:py-20 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
        {eyebrow ? (
          <p className="text-center text-xs uppercase tracking-wider text-gray-600 font-semibold">
            {eyebrow}
          </p>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto w-full">
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center"
            >
              <span className="text-base font-serif font-bold text-gray-900 text-center">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomPressPublications;
