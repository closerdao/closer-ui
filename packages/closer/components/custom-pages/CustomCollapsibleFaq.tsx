import React from 'react';

import { useTranslations } from 'next-intl';

import CollapsibleFaq from '../CollapsibleFaq';
import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';

const looksLikeHtml = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

const CustomCollapsibleFaq: React.FC<{
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    items?: Array<{ title?: string; text?: string }>;
  };
}> = ({ content }) => {
  const t = useTranslations();
  const title = resolveBlockText(content?.title, t);
  const description = resolveBlockText(content?.description, t);
  const items = (Array.isArray(content?.items) ? content.items : [])
    .map((item) => {
      const question = resolveBlockText(item?.title, t);
      const rawAnswer = String(item?.text ?? '').trim();
      const asHtml = looksLikeHtml(rawAnswer);
      const answer = asHtml
        ? resolveBlockHtml(rawAnswer, t)
        : resolveBlockText(rawAnswer || undefined, t);
      return {
        question,
        answer,
        answerHtml: asHtml,
      };
    })
    .filter((item) => item.question || item.answer);

  return (
    <div className="py-12 px-4">
      <CollapsibleFaq
        title={title}
        description={description}
        items={items}
      />
    </div>
  );
};

export default CustomCollapsibleFaq;
