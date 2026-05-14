import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading, LinkButton } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

const CustomCTA: React.FC<{
  settings: {
    style?: 'default' | 'accent' | 'dark';
  };
  content: {
    eyebrow?: string;
    title?: string;
    text?: string;
    primaryText?: string;
    primaryLink?: string;
    secondaryText?: string;
    secondaryLink?: string;
  };
}> = ({ content, settings }) => {
  const t = useTranslations();
  const style = settings?.style ?? 'default';
  const sectionClass =
    style === 'dark'
      ? 'bg-gray-900 text-white'
      : style === 'accent'
        ? 'bg-accent-light'
        : 'bg-neutral-light';
  const eyebrowClass =
    style === 'dark' ? 'text-accent-light' : 'text-accent';
  const textClass =
    style === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <section className={`py-14 md:py-16 ${sectionClass}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col gap-4 text-center items-center">
        {content?.eyebrow ? (
          <p
            className={`text-xs font-semibold uppercase tracking-widest ${eyebrowClass}`}
          >
            {resolveBlockText(content.eyebrow, t)}
          </p>
        ) : null}
        {content?.title ? (
          <Heading
            level={2}
            className={`text-3xl font-normal ${style === 'dark' ? 'text-white' : ''}`}
          >
            {resolveBlockText(content.title, t)}
          </Heading>
        ) : null}
        {content?.text ? (
          <p className={`text-base leading-relaxed ${textClass}`}>
            {resolveBlockText(content.text, t)}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {content?.primaryText && content?.primaryLink ? (
            <LinkButton
              href={content.primaryLink}
              className={
                style === 'dark'
                  ? 'bg-white text-gray-900 border-white'
                  : ''
              }
            >
              {resolveBlockText(content.primaryText, t)}
            </LinkButton>
          ) : null}
          {content?.secondaryText && content?.secondaryLink ? (
            <LinkButton
              href={content.secondaryLink}
              variant="secondary"
              isFullWidth={false}
            >
              {resolveBlockText(content.secondaryText, t)}
            </LinkButton>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default CustomCTA;
