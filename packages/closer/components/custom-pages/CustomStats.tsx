import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface Props {
  settings?: Record<string, unknown>;
  content: {
    eyebrow?: string;
    title?: string;
    items: { value: string; label: string }[];
  };
}

const CustomStats = ({ content }: Props) => {
  const t = useTranslations();
  const items = content?.items ?? [];
  return (
    <section className="py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8 text-center">
        {content?.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {resolveBlockText(content.eyebrow, t)}
          </p>
        ) : null}
        {content?.title ? (
          <Heading
            display
            level={2}
            className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight"
          >
            {resolveBlockText(content.title, t)}
          </Heading>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto w-full">
          {items.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="bg-accent-light/50 rounded-lg p-3 sm:p-6 text-center border border-accent/10"
            >
              <div className="text-lg sm:text-2xl font-semibold text-accent mb-1">
                {resolveBlockText(item.value, t)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600">
                {resolveBlockText(item.label, t)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomStats;
