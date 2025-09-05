import React from 'react';

const CustomRichText: React.FC<{
  settings: {
    isColorful?: boolean;
  };
  content: {
    html: string;
  };
}> = ({ content, settings }) => (
  <section
    className={
      'max-w-4xl mx-auto flex flex-col text-md  gap-4 md:gap-10 '
    }
  >
    <div
      className={`${settings.isColorful ? 'heading-alt-color' : ''} rich-text`}
      dangerouslySetInnerHTML={{ __html: content.html }}
    />
  </section>
);

export default CustomRichText;
