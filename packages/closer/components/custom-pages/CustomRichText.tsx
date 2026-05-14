import React from 'react';

import { useTranslations } from 'next-intl';

import { resolveBlockHtml } from '../../utils/blockI18n';

const CustomRichText: React.FC<{
  settings: {
    isColorful?: boolean;
  };
  content: {
    html: string;
  };
}> = ({ content, settings }) => {
  const t = useTranslations();
  return (
    <section
      className={
        'max-w-4xl mx-auto flex flex-col text-md  gap-4 md:gap-10 '
      }
    >
      <div
        className={`${settings?.isColorful ? 'heading-alt-color' : ''} rich-text`}
        dangerouslySetInnerHTML={{ __html: resolveBlockHtml(content.html, t) }}
      />
    </section>
  );
};

export default CustomRichText;
