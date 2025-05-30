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
      | 'bottom-right';
    isInverted?: boolean;
    isCompact?: boolean;
  };
  content: {
    title: string;
    body: string;
    imageUrl: string;
    videoEmbedId?: string;
    localVideoPath?: string;
    cta: {
      text: string;
      url: string;
    };
  };
}> = ({ content, settings }) => {
  const getTextStyle = () => {
    switch (settings.alignText) {
      case 'top-left':
        return 'pt-[calc(5vh)] md:pt-[calc(8vh)]';
      case 'bottom-left':
        return 'absolute bottom-[calc(5vh)] md:bottom-[calc(20vh)] w-full sm:w-[300px]';
      default:
        return '';
    }
  };

  const textStyle = getTextStyle();
  const [isClientMobile, setIsClientMobile] = useState(false);

  const renderHeaderMedia = () => {
    if (isClientMobile && content?.localVideoPath) {
      return (
        <video
          loop
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="https://cdn.oasa.co/custom-pages/earthbound/video/Earthbound_header_LQ2.mp4"
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

    return (
      <Image
        src={content.imageUrl}
        alt={content.title}
        className="h-full w-full object-cover"
        fill
      />
    );
  };

  useEffect(() => {
    setIsClientMobile(isMobile);
  }, []);

  return (
    <section className="relative top-[-32px] h-[calc(100vh-75px)] w-[100vw] left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] overflow-hidden">
      <div className="absolute inset-0 ">{renderHeaderMedia()}</div>

      <div className="relative h-full sm:w-full flex px-4 w-[280px] sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className={`max-w-5xl flex flex-col gap-2 ${textStyle}`}>
          <Heading
            level={1}
            className={`${
              settings?.isInverted ? 'text-dominant' : 'text-black'
            } ${settings?.isCompact ? 'text-xl sm:text-2xl max-w-xl' : 'text-4xl'}`}
          >
            {content.title}
          </Heading>

          <div
            className={`${settings?.isCompact ? 'text-sm sm:text-lg max-w-xl' : 'text-2xl'} rich-text ${
              settings?.isInverted ? 'text-accent-light' : 'text-black'
            }`}
            dangerouslySetInnerHTML={{ __html: content.body }}
          />

          {content.cta && (
            <div className="mt-4">
              <LinkButton
                href={content.cta.url}
                className={`${
                  settings?.isInverted
                    ? 'text-dominant border-accent-alt bg-accent-alt'
                    : ''
                } w-fit px-5`}
              >
                {content.cta.text}
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomHero;
