import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslations } from 'next-intl';

import YoutubeEmbed from '../YoutubeEmbed';
import { Heading, LinkButton } from '../ui';
import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';
import { isValidNextImageSrc } from '../../utils/nextImageSrc';
import SafeCustomPageImage from './SafeCustomPageImage';
import {
  getSectionBackgroundClass,
  hasSectionBackground,
} from './sectionBackground';
import type { SectionBackground } from '../../types/page';

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
  embedded?: boolean;
  background?: SectionBackground;
}> = ({ content, settings, embedded, background }) => {
  const t = useTranslations();
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
  const hasImage = isValidNextImageSrc(imageUrl);
  const hasMedia = hasVideoEmbed || hasImage || (isClientMobile && hasMobileVideo);

  const titleText = resolveBlockText(content.title, t);
  const bodyHtml = resolveBlockHtml(content.body, t);
  const ctaTextRaw = content.cta?.text?.trim() ?? '';
  const ctaText = resolveBlockText(ctaTextRaw || undefined, t);
  const ctaUrl = content.cta?.url ?? '';
  const showCta = ctaText.length > 0;
  const sectionBgClass = getSectionBackgroundClass(background);
  const useSectionBackground = hasSectionBackground(background);
  const useLightText = Boolean(settings?.isInverted || background === 'dark');

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
        <SafeCustomPageImage
          src={imageUrl}
          alt={titleText}
          className="h-full w-full object-cover"
          fill
        />
      );
    }

    return (
      <div
        className={`h-full w-full ${
          settings?.isInverted
            ? 'bg-gradient-to-br from-complimentary to-complimentary-medium'
            : 'bg-gradient-to-br from-accent-light to-accent-alt-light'
        }`}
        aria-hidden
      />
    );
  };

  const renderBackgroundLayer = () => {
    if (hasVideoEmbed || hasImage || (isClientMobile && hasMobileVideo)) {
      return <div className="absolute inset-0">{renderHeaderMedia()}</div>;
    }
    if (useSectionBackground) {
      return null;
    }
    return <div className="absolute inset-0">{renderHeaderMedia()}</div>;
  };

  useEffect(() => {
    setIsClientMobile(isMobile);
  }, []);

  const sectionClass = hasMedia
    ? embedded
      ? 'relative w-full overflow-hidden aspect-[16/9] min-h-[220px] max-h-[480px]'
      : 'relative h-[calc(100vh-75px)] w-[100vw] left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] overflow-hidden'
    : embedded
      ? 'relative w-full min-h-[280px] md:min-h-[320px] overflow-hidden'
      : 'relative w-full min-h-[50vh] md:min-h-[60vh] overflow-hidden';

  const innerShellClass = hasMedia
    ? `relative z-10 h-full w-full flex max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${outerAlign}`
    : embedded
      ? `relative z-10 flex min-h-[280px] md:min-h-[320px] w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 ${outerAlign}`
      : `relative z-10 flex min-h-[50vh] md:min-h-[60vh] w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 ${outerAlign}`;

  return (
    <section className={`${sectionClass} ${sectionBgClass}`.trim()}>
      {renderBackgroundLayer()}
      {hasImage ? (
        <div
          className={`absolute inset-0 z-[1] ${
            settings?.isInverted ? 'bg-black/40' : 'bg-white/40'
          }`}
          aria-hidden
        />
      ) : null}

      <div className={innerShellClass}>
        <div className={`max-w-2xl flex flex-col gap-2 ${innerAlign}`}>
          <Heading
            level={1}
            className={`${
              useLightText ? 'text-dominant' : 'text-black'
            } ${
              settings?.isCompact ? 'text-xl sm:text-2xl max-w-xl' : 'text-4xl'
            }`}
          >
            {titleText}
          </Heading>

          <div
            className={`${
              settings?.isCompact ? 'text-sm sm:text-lg max-w-xl' : 'text-2xl'
            } rich-text ${
              useLightText ? 'text-accent-light' : 'text-black'
            }`}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {showCta && (
            <div className="mt-4">
              <LinkButton
                href={ctaUrl}
                className={`${
                  useLightText
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
