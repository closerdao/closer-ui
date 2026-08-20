import Link from 'next/link';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';

import { isValid } from 'iban-ts';
import { useTranslations } from 'next-intl';

import { TOKEN_PURCHASE_TERMS_DOC_URL } from '../../constants';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { FinanceApplicationCreateRequest } from '../../types';
import {
  buildFinanceQuote,
  roundFiat,
} from '../../utils/tokenFinancing';
import { Button, Card, Checkbox, Heading, Input, Spinner } from '../ui';

interface CitizenFinanceTokensProps {
  application: Partial<FinanceApplicationCreateRequest>;
  updateApplication: (
    key: keyof FinanceApplicationCreateRequest,
    value: any,
  ) => void;
  downPaymentPercent: number;
  durations: number[];
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
  durations,
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
  const [tokensInput, setTokensInput] = useState(
    String(application?.tokensToFinance || 1),
  );

  const { isConfigReady, getTotalCostWithoutWallet, isPending } =
    useBuyTokens();

  const totalToPayInFiat = application?.totalToPayInFiat || 0;
  const tokensToFinance = application?.tokensToFinance || 0;

  const averagePricePerToken =
    tokensToFinance > 0
      ? roundFiat(totalToPayInFiat / tokensToFinance)
      : 0;

  const durationInMonths = Math.min(
    application?.durationInMonths || durations[0] || maxFinancingMonths,
    maxFinancingMonths,
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

  const handleTokensChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTokensInput(raw);
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) {
      updateApplication('tokensToFinance', parsed);
    }
  };

  const handleDurationChange = (months: number) => {
    const capped = Math.min(Math.max(1, months), maxFinancingMonths);
    updateApplication('durationInMonths', capped);
  };

  useEffect(() => {
    const next = application?.tokensToFinance;
    if (typeof next !== 'number' || next <= 0) {
      return;
    }
    setTokensInput((current) => {
      if (current === String(next)) {
        return current;
      }
      const parsed = Number(current);
      if (Number.isInteger(parsed) && parsed > 0) {
        return String(next);
      }
      return current;
    });
  }, [application?.tokensToFinance]);

  useEffect(() => {
    let cancelled = false;
    if (isConfigReady) {
      (async () => {
        try {
          const totalCost = await getTotalCostWithoutWallet(
            (application?.tokensToFinance || 0).toString(),
          );

          if (cancelled) {
            return;
          }

          // Spot bonding-curve price is the financed principal base. Carrying
          // cost comes from financingAprPercent in the monthly quote, not a
          // flat token price markup.
          const calculatedTotalToPayInFiat = Number(totalCost.toFixed(2)) || 0;
          updateApplication('totalToPayInFiat', calculatedTotalToPayInFiat);
        } catch (error) {
          console.error('Error in supply/price calculation:', error);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [isConfigReady, application?.tokensToFinance]);

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

  const showPresetDurations = durations.length > 1;
  const parsedTokensInput = Number(tokensInput);
  const tokensInputMatchesApplication =
    Number.isInteger(parsedTokensInput) &&
    parsedTokensInput > 0 &&
    parsedTokensInput === tokensToFinance;
  const canSubmit =
    isAgreementAccepted === isCitizenApplication &&
    isTokenTermsAccepted &&
    !loading &&
    Boolean(application?.iban) &&
    !isPending &&
    Boolean(totalToPayInFiat) &&
    tokensInputMatchesApplication &&
    quote.meetsMinMonthlyPayment &&
    application?.monthlyPaymentAmount === quote.monthlyPaymentAmount &&
    application?.downPaymentAmount === quote.downPaymentAmount &&
    isValid(application?.iban || '');

  return (
    <section className="space-y-6">
      {isCitizenApplication && (
        <Heading level={2} className="border-b pb-2 mb-6 text-xl">
          {t('subscriptions_citizen_finance_tokens')}
        </Heading>
      )}

      <p>{t('subscriptions_citizen_finance_tokens_details')}</p>
      <ul className="list-disc ml-4 font-bold">
        <li>
          {t('subscriptions_citizen_finance_tokens_details_months', {
            months: durationInMonths,
          })}
        </li>
        <li>
          {t.rich('subscriptions_citizen_finance_tokens_details_stay_credits', {
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
          })}
        </li>
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
          {t('subscriptions_citizen_finance_tokens_details_tokens_accrued')}
        </li>
      </ul>
      <p>{t('subscriptions_citizen_finance_tokens_details_tokens_how_many')}</p>
      <Input
        label={t('subscriptions_citizen_finance_tokens_tokens')}
        value={tokensInput}
        onChange={handleTokensChange}
        type="number"
        min={1}
      />

      {showPresetDurations ? (
        <>
          <p>{t('subscriptions_citizen_finance_tokens_duration_question')}</p>
          <fieldset className="flex flex-col gap-2">
            {durations.map((months) => (
              <div key={months} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`duration${months}`}
                  name="durationChoice"
                  className="w-4 h-4"
                  checked={durationInMonths === months}
                  onChange={() => handleDurationChange(months)}
                />
                <label
                  htmlFor={`duration${months}`}
                  className="whitespace-nowrap"
                >
                  {months} {t('subscriptions_citizen_finance_tokens_months')}
                </label>
              </div>
            ))}
          </fieldset>
        </>
      ) : (
        <Input
          label={t('subscriptions_citizen_finance_tokens_duration_question')}
          value={String(durationInMonths)}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            if (Number.isInteger(parsed) && parsed > 0) {
              handleDurationChange(parsed);
            }
          }}
          type="number"
          min={1}
          max={maxFinancingMonths}
        />
      )}
      <p className="text-sm text-gray-600">
        {t('subscriptions_citizen_finance_tokens_max_duration_hint', {
          months: maxFinancingMonths,
        })}
      </p>

      <p>
        {t.rich('subscriptions_citizen_finance_tokens_you_have_chosen', {
          b: (chunks) => <strong>{chunks}</strong>,
          var: tokensToFinance,
        })}
      </p>

      {isPending ? (
        <Card className="flex flex-row justify-start items-center gap-2 bg-accent-light">
          <Spinner />
          <p>{t('subscriptions_citizen_finance_tokens_calculating')}</p>
        </Card>
      ) : (
        <ul className="list-disc ml-4">
          <li className="pl-2">
            <span className="font-bold">
              {t('subscriptions_citizen_finance_tokens_total_cost')}
            </span>{' '}
            {t('subscriptions_citizen_finance_tokens_total_cost_months', {
              var: totalToPayInFiat,
              months: durationInMonths,
            })}
          </li>
          <li className="pl-2">
            <span className="font-bold">
              {t('subscriptions_citizen_finance_tokens_down_payment')}
            </span>{' '}
            {t('subscriptions_citizen_finance_tokens_down_payment_amount', {
              var: quote.downPaymentAmount,
            })}
          </li>
          <li className="pl-2">
            <span className="font-bold">
              {t('subscriptions_citizen_finance_tokens_monthly_payment')}
            </span>{' '}
            {t('subscriptions_citizen_finance_tokens_monthly_payment_amount', {
              var: quote.monthlyPaymentAmount,
            })}{' '}
          </li>
          {aprPercent > 0 && (
            <>
              <li className="pl-2">
                <span className="font-bold">
                  {t('subscriptions_citizen_finance_tokens_carrying_cost')}
                </span>{' '}
                {t('subscriptions_citizen_finance_tokens_carrying_cost_amount', {
                  amount: quote.carryingCost,
                  percent: aprPercent,
                })}
              </li>
              <li className="pl-2">
                <span className="font-bold">
                  {t('subscriptions_citizen_finance_tokens_total_repayable')}
                </span>{' '}
                {t('subscriptions_citizen_finance_tokens_total_repayable_amount', {
                  var: quote.totalRepayable,
                })}
              </li>
            </>
          )}
          <li className="pl-2">
            <span className="font-bold">
              {t('subscriptions_citizen_finance_tokens_cost_per_token')}
            </span>{' '}
            {t('subscriptions_citizen_finance_tokens_monthly_payment_amount', {
              var: averagePricePerToken,
            })}{' '}
          </li>
        </ul>
      )}

      {!quote.meetsMinMonthlyPayment && totalToPayInFiat > 0 && !isPending && (
        <p className="text-sm text-red-700">
          {t('subscriptions_citizen_finance_tokens_min_monthly_error', {
            monthly: quote.monthlyPaymentAmount,
            min: minMonthlyPayment,
          })}
        </p>
      )}

      <p>
        <span className="italic">
          {t('subscriptions_citizen_finance_tokens_hint')}
        </span>{' '}
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="/token/before-you-begin?citizenApplication=true"
          className=" underline"
        >
          {t('subscriptions_citizen_finance_tokens_hint_here')}
        </Link>
      </p>

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
        <p className="font-bold">
          {t('subscriptions_citizen_finance_tokens_disclaimer')}
        </p>
        <ol className="list-decimal ml-4">
          <li>{t('subscriptions_citizen_finance_tokens_disclaimer_1')}</li>
          <li>
            {t('subscriptions_citizen_finance_tokens_disclaimer_2', {
              var: quote.monthlyPaymentAmount,
            })}
          </li>
        </ol>

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
    </section>
  );
};

export default CitizenFinanceTokens;
