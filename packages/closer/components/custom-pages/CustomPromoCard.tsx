import Image from 'next/image';

import React from 'react';

import { Heading } from 'closer';

const CustomPromoCard: React.FC<{
  settings: {
    alignImage: 'left' | 'right';
  };
  content: {
    title: string;
    body: string;
    imageUrl: string;
  };
}> = ({ content, settings }) => (
  <section
    className={`max-w-4xl px-4 mx-auto flex flex-col ${
      settings?.alignImage === 'left' ? 'md:flex-row ' : 'md:flex-row-reverse'
    } gap-4 md:gap-10 md:min-h-[400px]`}
  >
    <div className="w-full md:w-2/5 relative">
      <div className="relative w-full h-auto md:h-full ">
        {content?.imageUrl && <Image
          src={content.imageUrl}
          alt={content.title}
          width={800}
          height={1000}
          className="w-full h-auto md:h-full object-contain md:object-cover"
          sizes="(max-width: 768px) 100vw, 40vw"
        />}
        
      </div>
    </div>
    <div className="w-full md:w-3/5 flex flex-col gap-4 ">
      <Heading level={2} className="text-3xl text-foreground">
          {content.title}
      </Heading>
      <div className="rich-text" dangerouslySetInnerHTML={{ __html: content.body }} />
    </div>
  </section>
);

export default CustomPromoCard;
