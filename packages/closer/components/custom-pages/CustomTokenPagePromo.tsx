import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading, LinkButton } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface PromoItem {
  text?: string;
}

export interface TokenPromoContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: PromoItem[];
  ctaText?: string;
  ctaLink?: string;
}

/** Resolves editor-entered copy, treating blank strings as absent. */
export const usePromoText = () => {
  const t = useTranslations();
  return (raw: string | undefined): string =>
    raw != null && String(raw).trim() !== '' ? resolveBlockText(raw, t) : '';
};

interface ShellProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Block-specific body rendered between the description and the CTA. */
  children?: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  /** Small print under the CTA. */
  footnote?: string;
}

/**
 * Card layout shared by the /token sub page promo blocks: pitch copy on top,
 * a block-specific body, and a CTA into the page being promoted.
 */
export const TokenPromoShell = ({
  eyebrow,
  title,
  description,
  children,
  ctaText,
  ctaLink,
  footnote,
}: ShellProps) => (
  <section className="py-10 md:py-14">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="rounded-lg border border-gray-200 bg-white p-8 md:p-10 flex flex-col gap-4">
        {eyebrow ? (
          <p className="text-sm font-bold uppercase tracking-wide text-accent">
            {eyebrow}
          </p>
        ) : null}
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
        {children}
        {ctaText && ctaLink ? (
          <div className="mt-2">
            <LinkButton
              href={ctaLink}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {ctaText}
            </LinkButton>
          </div>
        ) : null}
        {footnote ? <p className="text-xs text-gray-500">{footnote}</p> : null}
      </div>
    </div>
  </section>
);

interface Props {
  settings?: Record<string, unknown>;
  content?: TokenPromoContent;
  /** Where the CTA goes when the editor left the link empty. */
  fallbackLink: string;
}

/**
 * Content-only promo card: pitch copy plus a highlight list, all editable in
 * the page editor (seeded per type in blockDefaults).
 */
const CustomTokenPagePromo = ({ content, fallbackLink }: Props) => {
  const text = usePromoText();

  const items = (content?.items ?? [])
    .map((item) => text(item?.text))
    .filter(Boolean);

  return (
    <TokenPromoShell
      eyebrow={text(content?.eyebrow)}
      title={text(content?.title)}
      description={text(content?.description)}
      ctaText={text(content?.ctaText)}
      ctaLink={content?.ctaLink?.trim() || fallbackLink}
    >
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start gap-2 text-base text-gray-700"
            >
              <span aria-hidden="true" className="text-accent mt-0.5">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </TokenPromoShell>
  );
};

type BlockProps = Omit<Props, 'fallbackLink'>;

export const CustomTokenBuyPromo = (props: BlockProps) => (
  <CustomTokenPagePromo {...props} fallbackLink="/token/before-you-begin" />
);

export default CustomTokenPagePromo;
