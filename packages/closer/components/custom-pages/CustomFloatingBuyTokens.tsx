import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import { Heading, Button } from '../ui';
import { SALES_CONFIG } from '../../constants';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { getCurrentUnitPrice } from '../../utils/bondingCurve';
import { logMetric } from '../../utils/metrics';
import { resolveBlockText } from '../../utils/blockI18n';

const { MAX_TOKENS_PER_TRANSACTION } = SALES_CONFIG;

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    ctaText?: string;
  };
}

const CustomFloatingBuyTokens = ({ content }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { getCurrentSupplyWithoutWallet } = useBuyTokens();
  const [tokens, setTokens] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenSaleEnabled =
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true';

  useEffect(() => {
    if (!tokenSaleEnabled) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const supply = await getCurrentSupplyWithoutWallet();
        if (!cancelled && supply && supply > 0) {
          setUnitPrice(getCurrentUnitPrice(supply));
        }
      } catch (error) {
        console.error('Error fetching token price:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tokenSaleEnabled, getCurrentSupplyWithoutWallet]);

  if (!tokenSaleEnabled) return null;

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const title = pick(content?.title, t('token_sale_public_sale_buy_token'));
  const ctaText = pick(content?.ctaText, t('token_sale_public_sale_buy_token'));
  const estimated =
    unitPrice != null ? Number((unitPrice * tokens).toFixed(2)) : null;

  const clamp = (value: number) =>
    Math.min(MAX_TOKENS_PER_TRANSACTION, Math.max(1, value));

  const handleBuy = () => {
    void logMetric({
      event: 'floating-buy-tokens-click',
      category: 'token',
      value: String(tokens),
    });
    router.push(
      tokens > 0
        ? `/token/before-you-begin?tokens=${encodeURIComponent(tokens)}`
        : '/token/before-you-begin',
    );
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6 flex flex-col gap-5">
          <Heading
            level={2}
            className="text-xl font-normal text-gray-900 text-center"
          >
            {title}
          </Heading>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Decrease"
              className="w-10 h-10 rounded-full border-2 border-accent text-accent font-semibold hover:bg-accent-light transition-colors"
              onClick={() => setTokens((n) => clamp(n - 1))}
              disabled={tokens <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={MAX_TOKENS_PER_TRANSACTION}
              value={tokens}
              onChange={(e) =>
                setTokens(clamp(parseInt(e.target.value, 10) || 1))
              }
              className="w-20 text-center text-2xl font-semibold text-gray-900 border border-gray-300 rounded-lg py-2"
            />
            <button
              type="button"
              aria-label="Increase"
              className="w-10 h-10 rounded-full border-2 border-accent text-accent font-semibold hover:bg-accent-light transition-colors"
              onClick={() => setTokens((n) => clamp(n + 1))}
              disabled={tokens >= MAX_TOKENS_PER_TRANSACTION}
            >
              +
            </button>
          </div>

          <div className="text-center flex flex-col gap-1">
            <p className="text-sm text-gray-600">
              {isLoading || estimated == null
                ? '...'
                : `≈ €${estimated.toFixed(2)}`}
            </p>
            {unitPrice != null && !isLoading ? (
              <p className="text-xs text-gray-500">
                €{unitPrice.toFixed(2)} / token
              </p>
            ) : null}
          </div>

          <Button onClick={handleBuy} isFullWidth>
            {ctaText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CustomFloatingBuyTokens;
