import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Heading, LinkButton } from '../ui';
import { DEFAULT_TOKEN_STATS, TokenStats } from '../../types';
import api from '../../utils/api';
import { resolveBlockText } from '../../utils/blockI18n';

interface Props {
  settings?: {
    showCta?: boolean;
  };
  content?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

const CustomTokenStats = ({ settings, content }: Props) => {
  const t = useTranslations();
  const [tokenStats, setTokenStats] = useState<TokenStats>(DEFAULT_TOKEN_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  const tokenEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  useEffect(() => {
    if (!tokenEnabled) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/token/stats');
        if (res?.data) setTokenStats(res.data);
      } catch (e) {
        console.error('Error fetching token stats:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [tokenEnabled]);

  if (!tokenEnabled) return null;

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('home_token_section_label'));
  const title = pick(content?.title, t('home_token_section_title'));
  const description = pick(
    content?.description,
    t('home_token_section_subtitle'),
  );
  const ctaText = pick(content?.ctaText, t('home_token_buy_cta'));
  const ctaLink = content?.ctaLink ?? '/token';
  const showCta = settings?.showCta !== false;

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        <div className="text-center flex flex-col gap-3">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-wider text-gray-600 font-medium">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <Heading
              display
              level={2}
              className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight"
            >
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-sm md:text-base text-gray-700 leading-relaxed font-light max-w-xl mx-auto">
              {description}
            </p>
          ) : null}
        </div>

        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-300">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-300">
            <div className="w-14 h-14 bg-gray-900 rounded-lg flex items-center justify-center text-white font-semibold text-base">
              $TDF
            </div>
            <Heading level={3} className="text-xl font-normal text-gray-900">
              {t('home_token_name')}
            </Heading>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-gray-50 rounded border border-gray-300 p-3 sm:p-5">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-600 mb-2">
                {t('home_token_stat_holders')}
              </div>
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : tokenStats.tokenHolders.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 rounded border border-gray-300 p-3 sm:p-5">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-600 mb-2">
                {t('home_token_stat_supply')}
              </div>
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : tokenStats.currentSupply.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 rounded border border-gray-300 p-3 sm:p-5">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-600 mb-2">
                {t('home_token_stat_price')}
              </div>
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                €{isLoading ? '...' : tokenStats.tokenPrice}
              </div>
            </div>
            <div className="bg-gray-50 rounded border border-gray-300 p-3 sm:p-5">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-600 mb-2">
                {t('home_token_stat_raised')}
              </div>
              <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                €384k
              </div>
            </div>
          </div>
          {showCta && ctaText && ctaLink ? (
            <div className="mt-6">
              <LinkButton href={ctaLink} variant="primary">
                {ctaText}
              </LinkButton>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default CustomTokenStats;
