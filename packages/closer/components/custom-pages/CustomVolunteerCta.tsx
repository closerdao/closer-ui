import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading, LinkButton } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

const CustomVolunteerCta = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : '';
  const description = content?.description?.trim()
    ? resolveBlockText(content.description, t)
    : '';
  const ctaText = pick(content?.ctaText, t('apply_submit_button'));
  const ctaLink = content?.ctaLink?.trim() || '/volunteer/apply';

  return (
    <section className="py-14 md:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col gap-4 text-center items-center">
        {title ? (
          <Heading level={2} className="text-3xl font-normal text-gray-900">
            {title}
          </Heading>
        ) : null}
        {description ? (
          <p className="text-base leading-relaxed text-gray-600">
            {description}
          </p>
        ) : null}
        {ctaText && ctaLink ? (
          <div className="mt-2">
            <LinkButton href={ctaLink} variant="primary">
              {ctaText}
            </LinkButton>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CustomVolunteerCta;
