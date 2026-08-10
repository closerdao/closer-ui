import React from 'react';

import { Heading } from 'closer';
import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';
import { getReserveTokenDisplay } from '../../utils/config.utils';

export type TimelineItemStatus = 'current' | 'upcoming' | 'future' | 'done';

export interface TimelineItem {
  phase?: string;
  title?: string;
  text?: string;
  status?: TimelineItemStatus;
}

const statusDotClass = (status: TimelineItemStatus | undefined): string => {
  switch (status) {
    case 'current':
      return 'bg-accent border-accent';
    case 'done':
      return 'bg-accent border-accent';
    case 'upcoming':
      return 'bg-white border-accent';
    default:
      return 'bg-white border-neutral-dark';
  }
};

const CustomTimeline: React.FC<{
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    items?: TimelineItem[];
  };
}> = ({ content }) => {
  const t = useTranslations();
  const config = useConfig();
  const i18nValues = { reserveToken: getReserveTokenDisplay(config) };
  const items = Array.isArray(content?.items) ? content.items : [];
  const title = resolveBlockText(content?.title, t, i18nValues);
  const description = resolveBlockText(content?.description, t, i18nValues);

  return (
    <div className="py-12 px-4">
      <section className="max-w-3xl mx-auto flex flex-col gap-10">
        {(title || description) && (
          <div className="flex flex-col gap-3 text-center">
            {title ? (
              <Heading level={2} className="text-3xl">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="text-foreground text-md">{description}</p>
            ) : null}
          </div>
        )}

        <div className="relative">
          <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-accent/30" />
          <div className="flex flex-col">
            {items.map((item, index) => {
              const phase = resolveBlockText(item.phase, t, i18nValues);
              const itemTitle = resolveBlockText(item.title, t, i18nValues);
              const itemText = resolveBlockHtml(item.text, t, i18nValues);
              const status = item.status ?? 'upcoming';
              const isLast = index === items.length - 1;

              return (
                <div
                  key={`${itemTitle}-${index}`}
                  className={`relative pl-12 ${isLast ? 'pb-0' : 'pb-10'}`}
                >
                  <div
                    className={`absolute left-0 top-1 w-7 h-7 rounded-full border-2 ${statusDotClass(
                      status,
                    )}`}
                  />
                  <div className="flex flex-col gap-2">
                    {(phase || status === 'current') && (
                      <div className="flex items-baseline gap-3">
                        {phase ? (
                          <span
                            className={`text-sm font-medium uppercase tracking-wide ${
                              status === 'current'
                                ? 'text-accent'
                                : 'text-gray-500'
                            }`}
                          >
                            {phase}
                          </span>
                        ) : null}
                        {status === 'current' ? (
                          <span className="text-xs text-accent uppercase tracking-wide">
                            {t('pages_editor_timeline_now')}
                          </span>
                        ) : null}
                      </div>
                    )}
                    {itemTitle ? (
                      <Heading level={3} className="text-xl">
                        {itemTitle}
                      </Heading>
                    ) : null}
                    {itemText ? (
                      <div
                        className="text-foreground text-md leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: itemText }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomTimeline;
