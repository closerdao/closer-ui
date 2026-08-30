import { FC, ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { ResidencyParams, ResidencyQuote } from '../../types/residency';

interface LeaderProps {
  label: ReactNode;
  value: ReactNode;
  isStrong?: boolean;
  isAccent?: boolean;
}

/** A dot-leader line, the way a printed pay slip sets an amount. */
const Leader: FC<LeaderProps> = ({ label, value, isStrong, isAccent }) => (
  <div className="flex items-baseline gap-2 py-[5px]">
    <span
      className={`whitespace-nowrap ${
        isStrong
          ? 'text-sm font-semibold text-complimentary-core'
          : 'text-[13px] text-complimentary-light'
      }`}
    >
      {label}
    </span>
    <span
      aria-hidden
      className="-translate-y-[3px] flex-1 border-b border-dotted border-line"
    />
    <span
      className={`whitespace-nowrap ${isStrong ? 'text-base font-semibold' : 'text-[13px]'} ${
        isAccent ? 'text-accent' : 'text-complimentary-core'
      }`}
    >
      {value}
    </span>
  </div>
);

interface Props {
  quote: ResidencyQuote;
  params: ResidencyParams;
  memberName: string;
  roleTitle: string;
  sweatHeld: number;
  fullDaysPerWeek: number;
  tokenSymbol: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
  children?: ReactNode;
}

const SettlementSlip: FC<Props> = ({
  quote,
  params,
  memberName,
  roleTitle,
  sweatHeld,
  fullDaysPerWeek,
  tokenSymbol,
  formatCurrency,
  formatDate,
  children,
}) => {
  const t = useTranslations();
  const committedDays = Math.round(quote.fte * fullDaysPerWeek * 10) / 10;
  const cashShare = quote.net > 0 ? (quote.cashRequested / quote.net) * 100 : 0;

  return (
    <div className="rounded-2xl border border-line bg-dominant p-5 shadow-sm sm:p-6">
      <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-accent">
        {t('residency_slip_eyebrow', {
          season: quote.season.label,
          year: quote.arrival.getFullYear(),
        })}
      </p>
      <p className="mb-1 mt-2 text-lg font-bold text-complimentary-core">
        {memberName} ·{' '}
        {t('residency_slip_months', { months: quote.months })}
      </p>
      <p className="m-0 mb-4 text-[11px] text-complimentary-light">
        {roleTitle} · {formatDate(quote.arrival)} → {formatDate(quote.departure)}{' '}
        · {quote.accommodation.label}
      </p>

      <Leader
        label={t('residency_slip_base')}
        value={`${formatCurrency(quote.baseMonthly)}${t('residency_per_month_suffix')}`}
      />
      <Leader
        label={t('residency_slip_seniority', { sweat: sweatHeld })}
        value={`+${formatCurrency(quote.sweatBonus)}`}
      />
      <Leader
        label={t('residency_slip_commitment', { days: committedDays })}
        value={formatCurrency(quote.gross)}
        isStrong
      />

      <div className="h-2" />
      <Leader
        label={t('residency_slip_living')}
        value={`−${formatCurrency(quote.living)}`}
      />
      <Leader
        label={t('residency_slip_accommodation', {
          pct: Math.round(quote.coverage * 100),
        })}
        value={`−${formatCurrency(quote.accommodationFiatMonthly)}`}
      />
      {quote.nightsAlreadyBooked > 0 && (
        <Leader
          label={t('residency_slip_nights_already_booked', {
            nights: quote.nightsAlreadyBooked,
          })}
          value={t('residency_slip_already_paid')}
        />
      )}

      <div className="my-2.5 border-t border-line" />
      <Leader
        label={t('residency_slip_net')}
        value={`${formatCurrency(quote.net)}${t('residency_per_month_suffix')}`}
        isStrong
        isAccent
      />

      {/* cash ↔ token split */}
      <div className="mb-1.5 mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className="bg-complimentary-core transition-[width] duration-200"
          style={{ width: `${Math.max(0, Math.min(100, cashShare))}%` }}
        />
        <div className="flex-1 bg-accent" />
      </div>
      <div className="mb-2.5 flex justify-between text-[10px] text-complimentary-light">
        <span>{t('residency_split_cash')}</span>
        <span>{tokenSymbol}</span>
      </div>

      <Leader
        label={t('residency_slip_cash_paid', {
          multiplier: params.cashMultiplier,
        })}
        value={`${formatCurrency(quote.cashReceived)}${t('residency_per_month_suffix')}`}
        isStrong
      />
      <Leader
        label={t('residency_slip_tokens_earned', { symbol: tokenSymbol })}
        value={t('residency_tokens_per_month', {
          amount: quote.tokensEarnedMonthly.toFixed(1),
        })}
        isStrong
        isAccent
      />

      <div className="my-2.5 border-t border-dashed border-line" />
      {quote.boundaryPenalty > 0 && (
        <Leader
          label={t('residency_slip_boundary_penalty')}
          value={`−${formatCurrency(quote.boundaryPenalty)}`}
        />
      )}
      <Leader
        label={t('residency_slip_season_cash')}
        value={formatCurrency(quote.seasonCash)}
      />
      <Leader
        label={t('residency_slip_season_tokens', { symbol: tokenSymbol })}
        value={t('residency_tokens_amount', {
          amount: quote.seasonTokens.toFixed(1),
        })}
      />
      <Leader
        label={t('residency_slip_tokens_locked', { symbol: tokenSymbol })}
        value={t('residency_tokens_amount', {
          // Listing rates rarely divide into whole tokens.
          amount: Number(quote.tokensLocked.toFixed(2)),
        })}
      />

      {children}

      <p className="m-0 mt-3 text-center text-[10px] text-complimentary-light">
        {params.isTokenValueLive
          ? t('residency_slip_footnote_live', {
              price: formatCurrency(params.tokenValue),
              symbol: tokenSymbol,
            })
          : t('residency_slip_footnote_estimated', {
              price: formatCurrency(params.tokenValue),
              symbol: tokenSymbol,
            })}
      </p>
    </div>
  );
};

export default SettlementSlip;
