import React from 'react';
import { useTranslations } from 'next-intl';

import { Heading } from 'closer';
import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';
import SafeCustomPageImage from './SafeCustomPageImage';

const CustomPromoCard: React.FC<{
  settings: {
    alignImage: 'left' | 'right';
    isColorful?: boolean;
    imageSize?: 'small' | 'medium' | 'large';
  };
  content: {
    title: string;
    body: string;
    imageUrl: string;
  };
}> = ({ content, settings }) => {
  const t = useTranslations();
  return (
    <section
      className={`max-w-4xl mx-auto flex flex-col text-md ${
        settings?.alignImage === 'left' ? 'md:flex-row ' : 'md:flex-row-reverse'
      } gap-4 md:gap-10 md:min-h-[400px]`}
    >
      <div
        className={`${
          settings?.imageSize === 'large' ? 'w-full md:w-3/5' : 'w-full md:w-2/5'
        } relative`}
      >
        <div className="relative w-full h-auto md:h-full ">
          {content?.imageUrl?.trim() ? (
            <SafeCustomPageImage
              src={content.imageUrl}
              alt={resolveBlockText(content.title, t)}
              width={800}
              height={1000}
              quality={90}
              className="w-full h-auto md:h-full object-contain md:object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          ) : null}
        </div>
      </div>
      <div
        className={`${
          settings?.imageSize === 'large' ? 'w-full md:w-2/5' : 'w-full md:w-3/5'
        } flex flex-col gap-4 `}
      >
        <Heading
          level={2}
          className={`${
            settings?.isColorful ? 'text-accent' : 'text-foreground'
          } text-3xl`}
        >
          {resolveBlockText(content.title, t)}
        </Heading>
        <div
          className="rich-text !text-lg"
          dangerouslySetInnerHTML={{
            __html: resolveBlockHtml(content.body, t),
          }}
        />
      </div>
    </section>
  );
};

export default CustomPromoCard;
