import Image from 'next/image';

import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import YoutubeEmbed from '../YoutubeEmbed';
import { Heading, LinkButton } from '../ui';

const CustomHero: React.FC<{
  settings: {
    alignText:
      | 'left'
      | 'right'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
      | 'center';
    isInverted?: boolean;
    isCompact?: boolean;
  };
  content: {
    title: string;
    body: string;
    imageUrl?: string;
    videoEmbedId?: string;
    mobileVideoUrl?: string;
    cta?: {
      text?: string;
      url?: string;
    };
  };
}> = ({ content, settings }) => {
  const getAlignment = (
    value: string,
  ): { outer: string; inner: string } => {
    switch (value) {
      case 'top-left':
        return {
          outer: 'items-start justify-start',
          inner: 'items-start text-left',
        };
      case 'top-right':
        return {
          outer: 'items-start justify-end',
          inner: 'items-end text-right',
        };
      case 'bottom-right':
        return {
          outer: 'items-end justify-end',
          inner: 'items-end text-right',
        };
      case 'left':
        return {
          outer: 'items-center justify-start',
          inner: 'items-start text-left',
        };
      case 'right':
        return {
          outer: 'items-center justify-end',
          inner: 'items-end text-right',
        };
      case 'center':
        return {
          outer: 'items-center justify-center',
          inner: 'items-center text-center',
        };
      case 'bottom-left':
      default:
        return {
          outer: 'items-end justify-start',
          inner: 'items-start text-left',
        };
    }
  };

  const { outer: outerAlign, inner: innerAlign } = getAlignment(
    settings.alignText,
  );
  const [isClientMobile, setIsClientMobile] = useState(false);

  const imageUrl = content?.imageUrl?.trim() ?? '';
  const hasVideoEmbed = Boolean(content?.videoEmbedId);
  const hasMobileVideo = Boolean(content?.mobileVideoUrl);
  const hasImage = Boolean(imageUrl);
  const useFullBleedLayout =
    hasVideoEmbed ||
    hasImage ||
    (isClientMobile && hasMobileVideo);

  const renderHeaderMedia = () => {
    if (isClientMobile && content?.mobileVideoUrl) {
      return (
        <video
          loop
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src={content.mobileVideoUrl}
            type="video/mp4"
          />
        </video>
      );
    }

    if (content?.videoEmbedId) {
      return (
        <YoutubeEmbed isBackgroundVideo={true} embedId={content.videoEmbedId} />
      );
    }

    if (hasImage) {
      return (
        <Image
          src={imageUrl}
          alt={content.title}
          className="h-full w-full object-cover"
          fill
        />
      );
    }

    return (
      <div
        className={`h-full w-full ${
          settings?.isInverted ? 'bg-complimentary-core' : 'bg-neutral'
        }`}
        aria-hidden
      />
    );
  };

  useEffect(() => {
    setIsClientMobile(isMobile);
  }, []);

  const sectionClass = useFullBleedLayout
    ? 'relative top-[-32px] h-[calc(100vh-75px)] w-[100vw] left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] overflow-hidden'
    : 'relative w-full min-h-[280px] md:min-h-[360px] overflow-hidden';

  const innerShellClass = useFullBleedLayout
    ? `relative z-10 h-full w-full flex max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${outerAlign}`
    : `relative z-10 flex min-h-[280px] md:min-h-[360px] w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 ${outerAlign}`;

  const ctaText = content.cta?.text?.trim() ?? '';
  const ctaUrl = content.cta?.url ?? '';
  const showCta = ctaText.length > 0;

  return (
    <section className={sectionClass}>
      <div className="absolute inset-0">{renderHeaderMedia()}</div>

      <div className={innerShellClass}>
        <div className={`max-w-2xl flex flex-col gap-2 ${innerAlign}`}>
          <Heading
            level={1}
            className={`${
              settings?.isInverted ? 'text-dominant' : 'text-black'
            } ${
              settings?.isCompact ? 'text-xl sm:text-2xl max-w-xl' : 'text-4xl'
            }`}
          >
            {content.title}
          </Heading>

          <div
            className={`${
              settings?.isCompact ? 'text-sm sm:text-lg max-w-xl' : 'text-2xl'
            } rich-text ${
              settings?.isInverted ? 'text-accent-light' : 'text-black'
            }`}
            dangerouslySetInnerHTML={{ __html: content.body }}
          />

          {showCta && (
            <div className="mt-4">
              <LinkButton
                href={ctaUrl}
                className={`${
                  settings?.isInverted
                    ? 'text-dominant border-accent-alt bg-accent-alt'
                    : ''
                } w-fit px-5`}
              >
                {ctaText}
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomHero;
