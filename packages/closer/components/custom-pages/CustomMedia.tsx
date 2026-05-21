import React from 'react';

import { useTranslations } from 'next-intl';

import GenericYoutubeEmbed from '../GenericYoutubeEmbed';
import { resolveBlockText } from '../../utils/blockI18n';
import { isValidNextImageSrc } from '../../utils/nextImageSrc';
import SafeCustomPageImage from './SafeCustomPageImage';

const CustomMedia: React.FC<{
  settings: {
    mediaType?: 'image' | 'video';
  };
  content: {
    imageUrl?: string;
    videoEmbedId?: string;
    alt?: string;
    caption?: string;
  };
}> = ({ content, settings }) => {
  const t = useTranslations();
  const mediaType = settings?.mediaType ?? 'image';
  const caption = content?.caption?.trim()
    ? resolveBlockText(content.caption, t)
    : '';

  if (mediaType === 'video' && content?.videoEmbedId) {
    return (
      <section className="w-full py-0">
        <div className="w-full aspect-video">
          <GenericYoutubeEmbed embedId={content.videoEmbedId} />
        </div>
        {caption ? (
          <p className="text-center text-sm text-gray-500 mt-3 px-4">{caption}</p>
        ) : null}
      </section>
    );
  }

  const imageUrl = content?.imageUrl?.trim() ?? '';
  if (!isValidNextImageSrc(imageUrl)) return null;

  return (
    <section className="w-full py-0">
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
        <SafeCustomPageImage
          src={imageUrl}
          alt={resolveBlockText(content.alt, t) || caption || 'Media'}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      {caption ? (
        <p className="text-center text-sm text-gray-500 mt-3 px-4">{caption}</p>
      ) : null}
    </section>
  );
};

export default CustomMedia;
