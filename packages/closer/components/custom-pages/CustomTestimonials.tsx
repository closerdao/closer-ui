import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface TestimonialItem {
  quote: string;
  name: string;
  role?: string;
  avatar?: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content: {
    eyebrow?: string;
    title?: string;
    items: TestimonialItem[];
  };
}

const CustomTestimonials = ({ content }: Props) => {
  const t = useTranslations();
  const items = content?.items ?? [];
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
        {content?.eyebrow ? (
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-accent">
            {resolveBlockText(content.eyebrow, t)}
          </p>
        ) : null}
        {content?.title ? (
          <Heading level={2} className="text-center text-3xl font-normal">
            {resolveBlockText(content.title, t)}
          </Heading>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
          {items.map((item, i) => {
            const avatarStyle = item.avatar
              ? { backgroundImage: `url('${item.avatar}')` }
              : {};
            return (
              <figure key={`${item.name}-${i}`} className="flex flex-col gap-4">
                <blockquote className="text-lg leading-relaxed text-gray-800 italic">
                  <span className="text-accent not-italic text-4xl leading-none mr-1">
                    &ldquo;
                  </span>
                  {resolveBlockText(item.quote, t)}
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-gray-200 shrink-0 bg-cover bg-center"
                    style={avatarStyle}
                    aria-hidden
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {resolveBlockText(item.name, t)}
                    </div>
                    {item.role ? (
                      <div className="text-xs text-gray-500">
                        {resolveBlockText(item.role, t)}
                      </div>
                    ) : null}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CustomTestimonials;
