import React from 'react';
import { useTranslations } from 'next-intl';

import { Heading } from 'closer';
import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';

const CustomTextCard: React.FC<{
  settings: {
    size: 'small' | 'medium' | 'large';
  };
  content: {
    title: string;
    body: string;
  };
}> = ({ content }) => {
  const t = useTranslations();
  return (
    <section className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="w-full flex flex-col gap-4 ">
        <Heading level={2} className="text-3xl text-foreground">
          {resolveBlockText(content?.title, t)}
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

export default CustomTextCard;
