import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { isValid } from 'iban-ts';
import { useTranslations } from 'next-intl';

import {
  MAX_TOKENS_TO_FINANCE,
  TOKEN_PURCHASE_TERMS_DOC_URL,
} from '../../constants';
import { FinanceApplicationCreateRequest } from '../../types';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { buildFinanceQuote, roundFiat } from '../../utils/tokenFinancing';
import TokenBuyWidget from '../TokenBuyWidget';
import { Button, Card, Checkbox, Heading, Input, Spinner } from '../ui';

/** Slider floor — a single instalment is a purchase, not a financing plan. */
const MIN_FINANCING_MONTHS = 2;

interface CitizenFinanceTokensProps {
  application: Partial<FinanceApplicationCreateRequest>;
  updateApplication: (
    key: keyof FinanceApplicationCreateRequest,
    value: any,
  ) => void;
  downPaymentPercent: number;
  maxFinancingMonths: number;
  aprPercent: number;
  minMonthlyPayment: number;
  isAgreementAccepted: boolean;
  handleNext: () => void;
  loading: boolean;
  setIsAgreementAccepted: (value: boolean) => void;
  isCitizenApplication: boolean;
  isTokenTermsAccepted: boolean;
  setIsTokenTermsAccepted: (value: boolean) => void;
}

const CitizenFinanceTokens = ({
  application,
  updateApplication,
  downPaymentPercent,
  maxFinancingMonths,
  aprPercent,
  minMonthlyPayment,
  isAgreementAccepted,
  handleNext,
  loading,
  setIsAgreementAccepted,
  isCitizenApplication,
  isTokenTermsAccepted,
  setIsTokenTermsAccepted,
}: CitizenFinanceTokensProps) => {
  const t = useTranslations();
  const [ibanError, setIbanError] = useState<string | null>(null);

  // The buy widget owns the debounced bonding-curve lookup; its state is
  // mirrored into the application so the quote and the contract agree.
  const [tokensToBuy, setTokensToBuy] = useState<number>(
    application?.tokensToFinance || 1,
  );
  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [isCalculationPending, setIsCalculationPending] = useState(false);

  const totalToPayInFiat = application?.totalToPayInFiat || 0;
  const tokensToFinance = application?.tokensToFinance || 0;

  const averagePricePerToken =
    tokensToFinance > 0 ? roundFiat(totalToPayInFiat / tokensToFinance) : 0;

  // The configured ceiling always wins — the page caps the submitted term at
  // it, so offering a longer one on the slider would quietly mislead.
  const maxDurationMonths = maxFinancingMonths;
  const minDurationMonths = Math.min(MIN_FINANCING_MONTHS, maxDurationMonths);
  const durationInMonths = Math.min(
    Math.max(
      application?.durationInMonths || maxDurationMonths,
      minDurationMonths,
    ),
    maxDurationMonths,
  );

  const quote = useMemo(
    () =>
      buildFinanceQuote({
        totalToPayInFiat,
        downPaymentPercent,
        durationInMonths,
        aprPercent,
        minMonthlyPayment,
      }),
    [
      totalToPayInFiat,
      downPaymentPercent,
      durationInMonths,
      aprPercent,
      minMonthlyPayment,
    ],
  );

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

  const validateIban = (iban: string) => {
    if (!iban.trim()) {
      setIbanError(null);
      return true;
    }

    const isValidIban = isValid(iban);
    if (!isValidIban) {
      setIbanError(t('validation_invalid_iban'));
      return false;
    }

    setIbanError(null);
    return true;
  };

  const handleIbanChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateApplication('iban', value);
    validateIban(value);
  };

  const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(e.target.value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    updateApplication(
      'durationInMonths',
      Math.min(
        Math.max(minDurationMonths, Math.round(parsed)),
        maxDurationMonths,
      ),
    );
  };

  useEffect(() => {
    if (Number.isFinite(tokensToBuy) && tokensToBuy > 0) {
      updateApplication('tokensToFinance', tokensToBuy);
    }
  }, [tokensToBuy]);

  useEffect(() => {
    // Spot bonding-curve price is the financed principal base. Carrying cost
    // comes from financingAprPercent in the monthly quote, not a token markup.
    updateApplication('totalToPayInFiat', roundFiat(tokensToSpend));
  }, [tokensToSpend]);

  useEffect(() => {
    if (application?.monthlyPaymentAmount !== quote.monthlyPaymentAmount) {
      updateApplication('monthlyPaymentAmount', quote.monthlyPaymentAmount);
    }
    if (application?.downPaymentAmount !== quote.downPaymentAmount) {
      updateApplication('downPaymentAmount', quote.downPaymentAmount);
    }
    if (application?.aprPercent !== aprPercent) {
      updateApplication('aprPercent', aprPercent);
    }
    if (application?.durationInMonths !== durationInMonths) {
      updateApplication('durationInMonths', durationInMonths);
    }
  }, [
    quote.monthlyPaymentAmount,
    quote.downPaymentAmount,
    aprPercent,
    durationInMonths,
    application?.monthlyPaymentAmount,
    application?.downPaymentAmount,
    application?.aprPercent,
    application?.durationInMonths,
  ]);

  const tokensInputMatchesApplication =
    Number.isFinite(tokensToBuy) &&
    tokensToBuy > 0 &&
    tokensToBuy === tokensToFinance;
  const canSubmit =
    isAgreementAccepted === isCitizenApplication &&
    isTokenTermsAccepted &&
    !loading &&
    Boolean(application?.iban) &&
    !isCalculationPending &&
    Boolean(totalToPayInFiat) &&
    tokensInputMatchesApplication &&
    quote.meetsMinMonthlyPayment &&
    application?.monthlyPaymentAmount === quote.monthlyPaymentAmount &&
    application?.downPaymentAmount === quote.downPaymentAmount &&
    isValid(application?.iban || '');

  const summaryRows = [
    {
      label: t('token_finance_summary_token_amount'),
      value: `${tokensToFinance} ${t('token_sale_token_symbol')}`,
    },
    {
      label: t('token_finance_summary_duration'),
      value: formatDuration(durationInMonths),
    },
    {
      label: t('token_finance_summary_monthly_cost'),
      value: formatIsoFiatAmount(quote.monthlyPaymentAmount, 'EUR'),
    },
    {
      label: t('token_finance_summary_down_payment'),
      value: formatIsoFiatAmount(quote.downPaymentAmount, 'EUR'),
    },
  ];

  return (
    <section className="space-y-8">
      {isCitizenApplication && (
        <Heading level={2} className="border-b pb-2 mb-6 text-xl">
          {t('subscriptions_citizen_finance_tokens')}
        </Heading>
      )}

      <TokenBuyWidget
        tokensToBuy={tokensToBuy}
        setTokensToBuy={setTokensToBuy}
        tokensToSpend={tokensToSpend}
        setTokensToSpend={setTokensToSpend}
        setIsCalculationPending={setIsCalculationPending}
        maxTokens={MAX_TOKENS_TO_FINANCE}
        showGasFeesNote={false}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="financingDuration" className="font-bold">
            {t('subscriptions_citizen_finance_tokens_duration_question')}
          </label>
          <span className="text-sm font-bold tabular-nums bg-accent-light px-3 py-1 rounded-full whitespace-nowrap">
            {formatDuration(durationInMonths)}
          </span>
        </div>
        <input
          id="financingDuration"
          type="range"
          min={minDurationMonths}
          max={maxDurationMonths}
          step={1}
          value={durationInMonths}
          onChange={handleDurationChange}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatDuration(minDurationMonths)}</span>
          <span>{formatDuration(maxDurationMonths)}</span>
        </div>
      </div>

      {isCalculationPending ? (
        <Card className="flex flex-row justify-start items-center gap-2 bg-accent-light">
          <Spinner />
          <p>{t('subscriptions_citizen_finance_tokens_calculating')}</p>
        </Card>
      ) : (
        <Card className="p-4 flex flex-col gap-3">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <p className="card-feature">{row.label}</p>
              <p className="text-sm font-semibold tabular-nums">{row.value}</p>
            </div>
          ))}
        </Card>
      )}

      {!quote.meetsMinMonthlyPayment &&
        totalToPayInFiat > 0 &&
        !isCalculationPending && (
          <p className="text-sm text-red-700">
            {t('subscriptions_citizen_finance_tokens_min_monthly_error', {
              monthly: quote.monthlyPaymentAmount,
              min: minMonthlyPayment,
            })}
          </p>
        )}

      <Input
        label={t('subscriptions_citizen_finance_tokens_bank_account')}
        value={application?.iban || ''}
        onChange={handleIbanChange}
        placeholder={t(
          'subscriptions_citizen_finance_tokens_bank_account_placeholder',
        )}
        validation={ibanError ? 'invalid' : undefined}
        customValidationError={ibanError || undefined}
        successMessage={
          application?.iban && !ibanError
            ? t('validation_valid_iban')
            : undefined
        }
      />

      <div className="space-y-6">
        {isCitizenApplication && (
          <div className="flex items-start gap-1">
            <Checkbox
              id="citizen-agreement"
              isChecked={isAgreementAccepted}
              onChange={() => setIsAgreementAccepted(!isAgreementAccepted)}
            />
            <label htmlFor="citizen-agreement">
              {t.rich('subscriptions_citizen_agree_to_terms', {
                link: (chunks) => (
                  <a
                    href="https://docs.google.com/document/d/1mkWDWXIaf2ZuRu7NU1Xlr9leGYmjWd3HXRJDCzTSttY/edit?tab=t.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </label>
          </div>
        )}

        <div className="flex items-start gap-1">
          <Checkbox
            id="token-terms-agreement"
            isChecked={isTokenTermsAccepted}
            onChange={() => setIsTokenTermsAccepted(!isTokenTermsAccepted)}
          />
          <label htmlFor="token-terms-agreement">
            {t.rich('subscriptions_citizen_agree_to_token_terms', {
              link1: (chunks) => (
                <a
                  href={TOKEN_PURCHASE_TERMS_DOC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  {chunks}
                </a>
              ),
              link2: (chunks) => (
                <a
                  href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  {chunks}
                </a>
              ),
            })}
          </label>
        </div>

        <Button
          isEnabled={canSubmit}
          className="booking-btn"
          onClick={handleNext}
        >
          {isCitizenApplication
            ? t('subscriptions_citizen_become_citizen')
            : t('subscriptions_citizen_finance_tokens_button')}
        </Button>
      </div>

      <div className="border-t pt-6 space-y-2 text-xs text-gray-500">
        <p className="font-bold uppercase tracking-wide">
          {t('token_finance_fineprint_title')}
        </p>
        <ul className="list-disc ml-4 space-y-1">
          <li>
            {t('subscriptions_citizen_finance_tokens_total_cost')}{' '}
            {t('subscriptions_citizen_finance_tokens_total_cost_months', {
              var: totalToPayInFiat,
              months: durationInMonths,
            })}
          </li>
          <li>
            {t('subscriptions_citizen_finance_tokens_cost_per_token')}{' '}
            {t('subscriptions_citizen_finance_tokens_monthly_payment_amount', {
              var: averagePricePerToken,
            })}
          </li>
          {aprPercent > 0 && (
            <>
              <li>
                {t('subscriptions_citizen_finance_tokens_carrying_cost')}{' '}
                {t(
                  'subscriptions_citizen_finance_tokens_carrying_cost_amount',
                  {
                    amount: quote.carryingCost,
                    percent: aprPercent,
                  },
                )}
              </li>
              <li>
                {t('subscriptions_citizen_finance_tokens_total_repayable')}{' '}
                {t(
                  'subscriptions_citizen_finance_tokens_total_repayable_amount',
                  { var: quote.totalRepayable },
                )}
              </li>
            </>
          )}
          <li>
            {t('subscriptions_citizen_finance_tokens_details_down_payment', {
              percent: downPaymentPercent,
            })}
          </li>
          <li>
            {t('subscriptions_citizen_finance_tokens_details_apr', {
              percent: aprPercent,
            })}
          </li>
          {minMonthlyPayment > 0 && (
            <li>
              {t('subscriptions_citizen_finance_tokens_details_min_monthly', {
                amount: minMonthlyPayment,
              })}
            </li>
          )}
          <li>
            {t('subscriptions_citizen_finance_tokens_max_duration_hint', {
              months: maxDurationMonths,
            })}
          </li>
          <li>
            {t.rich(
              'subscriptions_citizen_finance_tokens_details_stay_credits',
              {
                link: (chunks) => (
                  <a
                    href="/settings/credits"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    {chunks}
                  </a>
                ),
              },
            )}
          </li>
          <li>
            {t('subscriptions_citizen_finance_tokens_details_tokens_accrued')}
          </li>
          <li>{t('subscriptions_citizen_finance_tokens_disclaimer')}</li>
          <li>{t('subscriptions_citizen_finance_tokens_disclaimer_1')}</li>
          <li>
            {t('subscriptions_citizen_finance_tokens_disclaimer_2', {
              var: quote.monthlyPaymentAmount,
            })}
          </li>
        </ul>
      </div>
    </section>
  );
};

export default CitizenFinanceTokens;
