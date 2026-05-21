import React from 'react';

import { useTranslations } from 'next-intl';

import SimpleFormattedText from '../display/simpleFormattedText';
import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';
import { isValidNextImageSrc } from '../../utils/nextImageSrc';
import SafeCustomPageImage from './SafeCustomPageImage';

const CustomTextBlock: React.FC<{
  settings: {
    imagePosition?: 'left' | 'right' | 'none';
  };
  content: {
    title?: string;
    body?: string;
    imageUrl?: string;
    imageAlt?: string;
  };
}> = ({ content, settings }) => {
  const t = useTranslations();
  const imagePosition = settings?.imagePosition ?? 'none';
  const imageUrl = content?.imageUrl?.trim() ?? '';
  const hasImage = isValidNextImageSrc(imageUrl) && imagePosition !== 'none';
  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : '';
  const body = content?.body ?? '';

  const imageNode = hasImage ? (
    <div className="w-full md:w-[42%] shrink-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        <SafeCustomPageImage
          src={imageUrl}
          alt={resolveBlockText(content.imageAlt, t) || title || 'Image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      </div>
    </div>
  ) : null;

  const textNode = (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      {title ? (
        <Heading level={2} className="text-2xl md:text-3xl font-normal text-inherit">
          {title}
        </Heading>
      ) : null}
      <SimpleFormattedText text={body} />
    </div>
  );

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {hasImage ? (
          <div
            className={`flex flex-col gap-8 md:gap-10 md:items-center ${
              imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'
            }`}
          >
            {imageNode}
            {textNode}
          </div>
        ) : (
          textNode
        )}
      </div>
    </section>
  );
};

export default CustomTextBlock;
