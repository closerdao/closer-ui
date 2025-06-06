

import React from 'react';

import { Heading } from 'closer';

const CustomTextCard: React.FC<{
  settings: {
    size: 'small' | 'medium' | 'large';
  };
  content: {
    title: string;
    body: string;
  };
}> = ({ content, settings }) => (
  <section
    className='max-w-2xl mx-auto flex flex-col gap-4'
  >
   
    <div className="w-full flex flex-col gap-4 ">
      <Heading level={2} className="text-3xl text-foreground">
          {content?.title}
      </Heading>
      <div className="rich-text !text-lg" dangerouslySetInnerHTML={{ __html: content.body }} />
    </div>
  </section>
);

export default CustomTextCard;
