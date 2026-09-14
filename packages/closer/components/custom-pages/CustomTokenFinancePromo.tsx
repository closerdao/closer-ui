import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { SALES_CONFIG } from '../../constants/shared.constants';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import type { TokenConfig } from '../../types';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import {
  buildFinanceQuote,
  getDownPaymentPercent,
  getFinancingAprPercent,
  getMaxFinancingMonths,
  getMinMonthlyPayment,
  roundFiat,
} from '../../utils/tokenFinancing';
import {
  TokenPromoShell,
  usePromoText,
  type TokenPromoContent,
} from './CustomTokenPagePromo';

interface Props {
  settings?: Record<string, unknown>;
  content?: TokenPromoContent;
}

const DEFAULT_TOKENS = 10;
const { MAX_TOKENS_PER_TRANSACTION } = SALES_CONFIG;
// Same floor as the financing form (CitizenFinanceTokens).
const MIN_FINANCING_MONTHS = 2;

const clampTokens = (value: number): number =>
  Math.min(Math.max(1, Math.round(value)), MAX_TOKENS_PER_TRANSACTION);

/**
 * Interactive financing preview: pick a token amount and drag the same
 * duration bar the financing form uses, see the live down payment / monthly
 * payment for the current bonding-curve price, then continue into
 * /token/finance with the chosen amount and term as URL params.
 *
 * Pricing mirrors TokenBuyWidget: the sale contract quote when reachable,
 * else spot price from /token/stats as an estimate.
 */
const CustomTokenFinancePromo = ({ content }: Props) => {
  const t = useTranslations();
  const text = usePromoText();
  const { getTotalCostWithoutWallet } = useBuyTokens();

  const tokenConfig = getCachedConfig('token') as TokenConfig | null;
  const downPaymentPercent = getDownPaymentPercent(tokenConfig);
  const aprPercent = getFinancingAprPercent(tokenConfig);
  const minMonthlyPayment = getMinMonthlyPayment(tokenConfig);
  const maxDurationMonths = getMaxFinancingMonths(tokenConfig);
  const minDurationMonths = Math.min(MIN_FINANCING_MONTHS, maxDurationMonths);

  const [tokens, setTokens] = useState(DEFAULT_TOKENS);
  const [durationInMonths, setDurationInMonths] = useState(maxDurationMonths);
  const [totalPrice, setTotalPrice] = useState(0);
  const [spotPrice, setSpotPrice] = useState(0);
  const [isQuoting, setIsQuoting] = useState(true);

  const formatDuration = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) {
      return t('token_finance_duration_months', { count: months });
    }
    if (remainingMonths === 0) {
      return t('token_finance_duration_years', { count: years });
    }
    return t('token_finance_duration_years_and_months', {
      years: t('token_finance_duration_years', { count: years }),
      months: t('token_finance_duration_months', { count: remainingMonths }),
    });
  };

  useEffect(() => {
    let isCurrent = true;
    api
      .get('/token/stats')
      .then((res) => {
        const price = Number(res?.data?.tokenPrice);
        if (isCurrent && Number.isFinite(price) && price > 0) {
          setSpotPrice(price);
        }
      })
      .catch(() => {
        /* The sale-contract quote below can still price the preview. */
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setIsQuoting(true);
    const timer = setTimeout(async () => {
      const cost = await getTotalCostWithoutWallet(String(tokens));
      if (!isCurrent) return;
      setTotalPrice(cost > 0 ? roundFiat(cost) : 0);
      setIsQuoting(false);
    }, 300);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
    // getTotalCostWithoutWallet is re-created each render by useBuyTokens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const effectiveTotal =
    totalPrice > 0 ? totalPrice : roundFiat(spotPrice * tokens);

  const quote = useMemo(
    () =>
      buildFinanceQuote({
        totalToPayInFiat: effectiveTotal,
        downPaymentPercent,
        durationInMonths,
        aprPercent,
        minMonthlyPayment,
      }),
    [
      effectiveTotal,
      downPaymentPercent,
      durationInMonths,
      aprPercent,
      minMonthlyPayment,
    ],
  );

  const hasQuote = effectiveTotal > 0;
  const amount = (value: number) => formatIsoFiatAmount(value, 'EUR');
  const preview = hasQuote
    ? [
        {
          label: t('token_promo_finance_total_label'),
          value: amount(quote.totalToPayInFiat),
        },
        {
          label: t('token_promo_finance_down_payment_label', {
            percent: downPaymentPercent,
          }),
          value: amount(quote.downPaymentAmount),
        },
        {
          label: t('token_promo_finance_monthly_label', {
            months: durationInMonths,
          }),
          value: amount(quote.monthlyPaymentAmount),
        },
        ...(aprPercent > 0
          ? [
              {
                label: t('token_promo_finance_apr_label'),
                value: `${aprPercent}%`,
              },
            ]
          : []),
      ]
    : [];

  const ctaLink =
    content?.ctaLink?.trim() ||
    `/token/finance?tokens=${tokens}&months=${durationInMonths}`;

  return (
    <TokenPromoShell
      eyebrow={text(content?.eyebrow)}
      title={text(content?.title)}
      description={text(content?.description)}
      ctaText={text(content?.ctaText)}
      ctaLink={ctaLink}
      footnote={t('token_promo_finance_estimate_note')}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          {t('token_promo_finance_tokens_label')}
          <input
            type="number"
            min={1}
            max={MAX_TOKENS_PER_TRANSACTION}
            value={tokens}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) setTokens(clampTokens(parsed));
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900"
          />
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="tokenPromoFinancingDuration"
              className="text-sm text-gray-600"
            >
              {t('token_promo_finance_duration_label')}
            </label>
            <span className="text-sm font-bold tabular-nums bg-accent-light px-3 py-1 rounded-full whitespace-nowrap">
              {formatDuration(durationInMonths)}
            </span>
          </div>
          <input
            id="tokenPromoFinancingDuration"
            type="range"
            min={minDurationMonths}
            max={maxDurationMonths}
            step={1}
            value={durationInMonths}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isFinite(parsed)) return;
              setDurationInMonths(
                Math.min(
                  Math.max(minDurationMonths, Math.round(parsed)),
                  maxDurationMonths,
                ),
              );
            }}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatDuration(minDurationMonths)}</span>
            <span>{formatDuration(maxDurationMonths)}</span>
          </div>
        </div>
        <dl className="flex flex-col divide-y divide-gray-100 rounded-md border border-gray-100">
          {hasQuote ? (
            preview.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <dt className="text-sm text-gray-600">{row.label}</dt>
                <dd className="text-base font-medium text-gray-900">
                  {row.value}
                </dd>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              {isQuoting
                ? t('token_promo_finance_quote_loading')
                : t('token_promo_finance_quote_unavailable')}
            </div>
          )}
        </dl>
        {hasQuote && !quote.meetsMinMonthlyPayment ? (
          <p className="text-sm text-gray-600">
            {t('token_promo_finance_min_monthly_note', {
              amount: amount(minMonthlyPayment),
            })}
          </p>
        ) : null}
      </div>
    </TokenPromoShell>
  );
};

export default CustomTokenFinancePromo;
