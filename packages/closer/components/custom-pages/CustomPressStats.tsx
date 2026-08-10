import React from 'react';

import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';

interface PressStatItem {
  value: string;
  label: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    items?: PressStatItem[];
  };
}

const CustomPressStats = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const defaultItems: PressStatItem[] = [
    {
      value: t('press_stats_articles_count'),
      label: t('press_stats_articles_label'),
    },
    {
      value: t('press_stats_portuguese_count'),
      label: t('press_stats_portuguese_label'),
    },
    {
      value: t('press_stats_spanish_count'),
      label: t('press_stats_spanish_label'),
    },
    {
      value: t('press_stats_podcasts_count'),
      label: t('press_stats_podcasts_label'),
    },
  ];

  const items =
    content?.items && content.items.length > 0
      ? content.items.map((item) => ({
          value: pick(item.value, item.value),
          label: pick(item.label, item.label),
        }))
      : defaultItems;

  return (
    <section className="py-12 md:py-16 px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="bg-gray-50 rounded border border-gray-300 p-6 text-center flex flex-col gap-2"
          >
            <div className="text-3xl md:text-4xl font-normal text-gray-900 font-serif">
              {item.value}
            </div>
            <div className="text-xs text-gray-600 font-light">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomPressStats;
