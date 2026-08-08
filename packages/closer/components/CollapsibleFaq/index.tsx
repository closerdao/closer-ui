import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Heading } from '../ui';

export interface CollapsibleFaqItem {
  question: string;
  answer: string;
  answerHtml?: boolean;
}

interface Props {
  title?: string;
  description?: string;
  items: CollapsibleFaqItem[];
  className?: string;
}

const CollapsibleFaq = ({
  title,
  description,
  items,
  className = '',
}: Props) => {
  const t = useTranslations();

  if (!items.length && !title && !description) {
    return null;
  }

  return (
    <div className={`w-full ${className}`.trim()}>
      {(title || description) && (
        <div className="flex flex-col gap-3 mb-8 text-center">
          {title ? (
            <Heading level={2} className="text-3xl">
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-foreground text-md">{description}</p>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
        {items.map((item, index) => {
          const question = item.question?.trim();
          const answer = item.answer?.trim();
          if (!question && !answer) return null;

          return (
            <details
              key={`${question}-${index}`}
              className="group border border-gray-200 rounded-xl bg-white overflow-hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left font-medium text-foreground hover:bg-neutral-light/60 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  {question || t('pages_editor_field_question')}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180 group-open:text-accent" />
              </summary>
              {answer ? (
                item.answerHtml ? (
                  <div
                    className="px-4 pb-4 text-foreground text-md leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: answer }}
                  />
                ) : (
                  <p className="px-4 pb-4 text-foreground text-md leading-relaxed whitespace-pre-line">
                    {answer}
                  </p>
                )
              ) : null}
            </details>
          );
        })}
      </div>
    </div>
  );
};

export default CollapsibleFaq;
