import React from 'react';

import { Heading } from '../ui';

const CustomStats: React.FC<{
  settings: Record<string, unknown>;
  content: {
    eyebrow?: string;
    title?: string;
    items: { value: string; label: string }[];
  };
}> = ({ content }) => {
  const items = content?.items ?? [];
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-8 text-center">
        {content?.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {content.eyebrow}
          </p>
        ) : null}
        {content?.title ? (
          <Heading level={2} className="text-3xl font-normal">
            {content.title}
          </Heading>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {items.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="rounded-xl border border-gray-200 bg-neutral-light px-4 py-5 flex flex-col gap-2"
            >
              <div className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight">
                {item.value}
              </div>
              <div className="text-xs text-gray-600 leading-snug">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomStats;
