import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading, LinkButton } from '../ui';
import { useAuth } from '../../contexts/auth';
import { TokenConfig } from '../../types/api';
import { resolveBlockText } from '../../utils/blockI18n';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  getDownPaymentPercent,
  getMaxFinancingMonths,
} from '../../utils/tokenFinancing';

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    items?: string[];
    ctaText?: string;
    ctaLink?: string;
  };
}

const CustomFinancedTokensStart = ({ content }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const tokenConfig = (getCachedConfig('token') ?? {}) as TokenConfig;
  const downPaymentValues = {
    percent: getDownPaymentPercent(tokenConfig),
    months: getMaxFinancingMonths(tokenConfig),
  };

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t, downPaymentValues)
      : fallback;

  const title = pick(content?.title, t('citizenship_financed_tokens_title'));
  const description = content?.description?.trim()
    ? resolveBlockText(content.description, t, downPaymentValues)
    : '';
  const items =
    Array.isArray(content?.items) && content.items.length > 0
      ? content.items.map((item) =>
          resolveBlockText(item, t, downPaymentValues),
        )
      : [
          t('citizenship_financed_tokens_1', downPaymentValues),
          t('citizenship_financed_tokens_2', downPaymentValues),
          t('citizenship_financed_tokens_3'),
        ];
  const ctaText = pick(content?.ctaText, t('citizenship_start_financed_plan'));
  const defaultLink = user?.roles?.includes('member')
    ? '/token/finance'
    : '/citizenship/why';
  const ctaLink = content?.ctaLink?.trim() || defaultLink;

  return (
    <section className="py-14 md:py-16 bg-neutral-light">
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
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2 text-left w-full max-w-lg text-base text-gray-700">
            {items.map((item, idx) => (
              <li key={`${item}-${idx}`} className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
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

export default CustomFinancedTokensStart;
