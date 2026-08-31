import { FC, ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { ResidencyParams, ResidencyPlan } from '../../types/residency';

interface LeaderProps {
  label: ReactNode;
  value: ReactNode;
  /** Green: something the program covers, at no cost to the volunteer. */
  isIncluded?: boolean;
  isStrong?: boolean;
  isAccent?: boolean;
}

/** A dot-leader line, the way a printed programme sets out what it covers. */
const Leader: FC<LeaderProps> = ({
  label,
  value,
  isIncluded,
  isStrong,
  isAccent,
}) => (
  <div className="flex items-baseline gap-2 py-[5px]">
    <span
      className={`${
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
      className={`whitespace-nowrap ${
        isStrong ? 'text-base font-semibold' : 'text-[13px] font-semibold'
      } ${
        isIncluded
          ? 'text-success'
          : isAccent
          ? 'text-accent'
          : 'text-complimentary-core'
      }`}
    >
      {value}
    </span>
  </div>
);

const GroupHeading: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="m-0 mb-1 mt-4 text-sm font-bold text-complimentary-core">
    {children}
  </p>
);

interface Props {
  plan: ResidencyPlan;
  params: ResidencyParams;
  volunteerName: string;
  roleTitle: string;
  tokenSymbol: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
  children?: ReactNode;
}

/**
 * The season at a glance, in the order that matters legally: what the program
 * covers, then what the volunteer chose to add and pay for themselves, then
 * what the community records — never a total that could read as earnings.
 */
const SeasonSummary: FC<Props> = ({
  plan,
  params,
  volunteerName,
  roleTitle,
  tokenSymbol,
  formatCurrency,
  formatDate,
  children,
}) => {
  const t = useTranslations();

  return (
    <div className="rounded-2xl border border-line bg-dominant p-5 shadow-sm sm:p-6">
      <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-accent">
        {t('residency_slip_eyebrow', {
          season: plan.season.label,
          year: plan.arrival.getFullYear(),
        })}
      </p>
      <p className="mb-1 mt-2 text-lg font-bold text-complimentary-core">
        {volunteerName} · {t('residency_slip_months', { months: plan.months })}
      </p>
      <p className="m-0 mb-2 text-[11px] text-complimentary-light">
        {roleTitle} · {formatDate(plan.arrival)} → {formatDate(plan.departure)}
        {plan.needsAccommodation && ` · ${plan.accommodation.label}`}
      </p>

      <GroupHeading>{t('residency_slip_included_heading')}</GroupHeading>
      <Leader
        label={
          plan.needsAccommodation
            ? t('residency_slip_included_accommodation', {
                accommodation: plan.includedAccommodation.label,
              })
            : t('residency_slip_accommodation_self')
        }
        value={
          plan.needsAccommodation
            ? t('residency_slip_included')
            : t('residency_slip_off_site')
        }
        isIncluded={plan.needsAccommodation}
      />
      {(params.providesMeals || params.providesUtilities) && (
        <Leader
          label={t('residency_slip_meals_utilities')}
          value={t('residency_slip_included')}
          isIncluded
        />
      )}
      <Leader
        label={t('residency_slip_insurance')}
        value={t('residency_slip_included')}
        isIncluded
      />
      <Leader
        label={t('residency_slip_id_card')}
        value={t('residency_slip_on_arrival')}
      />
      <Leader
        label={t('residency_slip_expenses', {
          days: params.expenseReimbursementDays,
        })}
        value={t('residency_slip_reimbursed')}
      />

      <div className="my-3 border-t border-line" />

      <GroupHeading>{t('residency_slip_choices_heading')}</GroupHeading>
      {plan.isUpgrade ? (
        <>
          <Leader
            label={t('residency_slip_upgrade', {
              accommodation: plan.accommodation.label,
            })}
            value={
              plan.upgradeTokensMonthly > 0
                ? t('residency_tokens_per_month', {
                    amount: Number(plan.upgradeTokensMonthly.toFixed(2)),
                  })
                : `${formatCurrency(plan.upgradeFiatMonthly)}${t(
                    'residency_per_month_suffix',
                  )}`
            }
            isAccent
          />
          <Leader
            label={t('residency_slip_season_tokens_spent', {
              symbol: tokenSymbol,
            })}
            value={t('residency_tokens_amount', {
              // Listing rates rarely divide into whole tokens.
              amount: Number(plan.seasonTokensSpent.toFixed(2)),
            })}
            isStrong
            isAccent
          />
          <Leader
            label={t('residency_slip_season_fiat_owed')}
            value={formatCurrency(plan.seasonFiatOwed)}
            isStrong
          />
        </>
      ) : (
        <Leader
          label={t('residency_slip_no_upgrade')}
          value={formatCurrency(0)}
          isStrong
        />
      )}

      <div className="my-3 border-t border-dashed border-line" />

      <GroupHeading>{t('residency_slip_record_heading')}</GroupHeading>
      <Leader
        label={t('residency_slip_presence_on_checkout')}
        value={t('residency_slip_presence_days', {
          days: plan.presenceEarned,
        })}
      />
      <Leader
        label={t('residency_slip_sweat_log')}
        value={t('residency_slip_recognition_only')}
      />
      {plan.seasonTokensDistributed > 0 && (
        <>
          <Leader
            label={t('residency_slip_distribution', { symbol: tokenSymbol })}
            value={t('residency_tokens_amount', {
              amount: Number(plan.seasonTokensDistributed.toFixed(2)),
            })}
            isAccent
          />
          {/*
           * Stated on the same line as the amount, never left to be inferred:
           * the token has no liquid market, so the allocation is worth
           * nothing in euros and is not payment for the season.
           */}
          <Leader
            label={t('residency_slip_distribution_value')}
            value={formatCurrency(0)}
          />
        </>
      )}

      <div className="mt-4 rounded-xl border border-line bg-neutral px-4 py-3 text-[13px] text-complimentary-light">
        <span className="font-bold text-complimentary-core">
          {t('residency_slip_know_title')}
        </span>{' '}
        {t('residency_slip_know_body', {
          weeks: params.noticeWeeks,
          law: params.legalFramework,
        })}
      </div>

      {children}

      <p className="m-0 mt-3 text-center text-[10px] text-complimentary-light">
        {t('residency_slip_generates', {
          version: params.agreementVersion,
          law: params.legalFramework,
        })}
      </p>
    </div>
  );
};

export default SeasonSummary;
