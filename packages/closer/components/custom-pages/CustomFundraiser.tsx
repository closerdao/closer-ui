import React from 'react';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FundraisingWidget from '../FundraisingWidget';
import { Heading } from '../ui';
import { useConfig } from '../../hooks/useConfig';
import { resolveBlockText } from '../../utils/blockI18n';

interface Props {
  settings?: {
    showTitle?: boolean;
  };
  content?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

const CustomFundraiser = ({ settings, content }: Props) => {
  const t = useTranslations();
  const config = useConfig() as
    | {
        fundraiser?: {
          enabled?: boolean;
          milestones?: unknown[];
          amountRaisedPreCampaign?: number | string;
          loansCollectedTotal?: number | string;
        };
      }
    | null
    | undefined;

  const fundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(config?.fundraiser?.enabled);

  if (!fundraiserEnabled) return null;

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('home_fundraising_preview_label'));
  const title = pick(content?.title, t('home_fundraising_preview_title'));
  const description = pick(
    content?.description,
    t('home_fundraising_preview_desc'),
  );
  const ctaText = pick(content?.ctaText, t('home_fundraising_preview_cta'));
  const ctaLink = content?.ctaLink ?? '/fundraiser';
  const showTitle = settings?.showTitle !== false;

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border-2 border-accent/20 p-5 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
            {showTitle && (
              <div className="flex-1 space-y-3">
                {eyebrow ? (
                  <p className="text-xs uppercase tracking-wider text-accent font-semibold">
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <Heading
                    level={3}
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </Heading>
                ) : null}
                {description ? (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {description}
                  </p>
                ) : null}
              </div>
            )}
            <div className="w-full sm:w-auto flex-shrink-0 space-y-3">
              <FundraisingWidget
                variant="hero"
                milestones={config?.fundraiser?.milestones as never[]}
                amountRaisedPreCampaign={config?.fundraiser?.amountRaisedPreCampaign}
                loansCollectedTotal={config?.fundraiser?.loansCollectedTotal}
              />
              {ctaText && ctaLink ? (
                <Link
                  href={ctaLink}
                  className="group flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomFundraiser;
