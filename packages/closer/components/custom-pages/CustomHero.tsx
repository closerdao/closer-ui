import Image from 'next/image';

import React from 'react';

import { Heading, LinkButton } from '../ui';

const CustomHero: React.FC<{
  settings: {
    alignText: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    isInverted?: boolean;
  };
  content: {
    title: string;
    body: string;
    imageUrl: string;
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

  return (
    <section className="relative h-[calc(100vh-75px)] w-[100vw] left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
      <div className="absolute inset-0 top-[-32px]">
        <Image
          src={content.imageUrl}
          alt={content.title}
          className="h-full w-full object-cover"
          fill
        />
      </div>

      <div className="relative h-full sm:w-full flex px-4 w-[280px] sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className={`max-w-5xl flex flex-col gap-2 ${textStyle}`}>
          <Heading
            level={1}
            className={`${
              settings?.isInverted ? 'text-dominant' : 'text-black'
            } text-4xl`}
          >
            {content.title}
          </Heading>
          <p
            className={`${
              settings?.isInverted ? 'text-accent-light' : 'text-black'
            }`}
          >
            {content?.body}
          </p>

          {content.cta &&  <div className="mt-4">
            <LinkButton href={content.cta.url} className={`${settings?.isInverted ? 'text-dominant border-accent-alt bg-accent-alt' : ''} w-fit px-5`}>
              {content.cta.text}
            </LinkButton>
          </div>}
         
        </div>
      </div>
    </section>
  );
};

export default CustomHero;
