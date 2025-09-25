import Link from 'next/link';

import { useEffect } from 'react';

import { isValid } from 'iban-ts';
import { useTranslations } from 'next-intl';

import { useBuyTokens } from '../../hooks/useBuyTokens';
import { FinanceApplicationCreateRequest } from '../../types';
import { Button, Card, Checkbox, Heading, Input, Spinner } from '../ui';

interface CitizenFinanceTokensProps {
  application: Partial<FinanceApplicationCreateRequest>;
  updateApplication: (
    key: keyof FinanceApplicationCreateRequest,
    value: any,
  ) => void;
  tokenPriceModifierPercent: number;
  isAgreementAccepted: boolean;
  handleNext: () => void;
  loading: boolean;
  setIsAgreementAccepted: (value: boolean) => void;
  isCitizenApplication: boolean;
}

const CitizenFinanceTokens = ({
  application,
  updateApplication,
  tokenPriceModifierPercent,
  isAgreementAccepted,
  handleNext,
  loading,
  setIsAgreementAccepted,
  isCitizenApplication,
}: CitizenFinanceTokensProps) => {
  const t = useTranslations();

  const { isConfigReady, getTotalCostWithoutWallet, isPending } =
    useBuyTokens();

  const totalToPayInFiat = application?.totalToPayInFiat || 0;

  const averagePricePerToken =
    Number(
      (totalToPayInFiat / (application?.tokensToFinance || 1)).toFixed(2),
    ) || 0;

  const downPayment = Number((totalToPayInFiat * 0.1).toFixed(2)) || 0;

  const monthlyPayment =
    Number(((totalToPayInFiat - downPayment) / 36).toFixed(2)) || 0;

  useEffect(() => {
    if (isConfigReady) {
      (async () => {
        try {
          const totalCost = await getTotalCostWithoutWallet(
            (application?.tokensToFinance || 0).toString(),
          );

          const calculatedTotalToPayInFiat =
            Number(
              (totalCost * (1 + tokenPriceModifierPercent / 100)).toFixed(2),
            ) || 0;
          updateApplication('totalToPayInFiat', calculatedTotalToPayInFiat);
        } catch (error) {
          console.error('Error in supply/price calculation:', error);
        }
      })();
    }
  }, [isConfigReady, application?.tokensToFinance]);

  return (
    <section className="space-y-6">
      {isCitizenApplication && (
        <Heading level={2} className="border-b pb-2 mb-6 text-xl">
          {t('subscriptions_citizen_finance_tokens')}
        </Heading>
      )}

      <p>{t('subscriptions_citizen_finance_tokens_details')}</p>
      <ul className="list-disc ml-4 font-bold">
        <li>{t('subscriptions_citizen_finance_tokens_details_36_months')}</li>
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
          {t('subscriptions_citizen_finance_tokens_details_10_down_payment')}
        </li>
        <li>
          {t('subscriptions_citizen_finance_tokens_details_tokens_accrued')}
        </li>
      </ul>
      <p>{t('subscriptions_citizen_finance_tokens_details_tokens_how_many')}</p>
      <fieldset className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="tokens30"
            name="tokenChoice"
            className="w-4 h-4"
            checked={application?.tokensToFinance === 30}
            onChange={() => updateApplication('tokensToFinance', 30)}
          />
          <label htmlFor="tokens30" className="whitespace-nowrap">
            30 {t('subscriptions_citizen_finance_tokens_tokens')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="tokens60"
            name="tokenChoice"
            className="w-4 h-4"
            checked={application?.tokensToFinance === 60}
            onChange={() => updateApplication('tokensToFinance', 60)}
          />
          <label htmlFor="tokens60" className="whitespace-nowrap">
            60 {t('subscriptions_citizen_finance_tokens_tokens')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="tokens90"
            name="tokenChoice"
            className="w-4 h-4"
            checked={application?.tokensToFinance === 90}
            onChange={() => updateApplication('tokensToFinance', 90)}
          />
          <label htmlFor="tokens90" className="whitespace-nowrap">
            90 {t('subscriptions_citizen_finance_tokens_tokens')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="tokens120"
            name="tokenChoice"
            className="w-4 h-4"
            checked={application?.tokensToFinance === 120}
            onChange={() => updateApplication('tokensToFinance', 120)}
          />
          <label htmlFor="tokens120" className="whitespace-nowrap">
            120 {t('subscriptions_citizen_finance_tokens_tokens')}
          </label>
        </div>
      </fieldset>

      <p>
        {t.rich('subscriptions_citizen_finance_tokens_you_have_chosen', {
          b: (chunks) => <strong>{chunks}</strong>,
          var: application?.tokensToFinance,
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
            {t('subscriptions_citizen_finance_tokens_total_cost_36_months', {
              var: totalToPayInFiat,
            })}
          </li>
          <li className="pl-2">
            <span className="font-bold">
              {t('subscriptions_citizen_finance_tokens_down_payment')}
            </span>{' '}
            {t('subscriptions_citizen_finance_tokens_down_payment_amount', {
              var: downPayment,
            })}
          </li>
          <li className="pl-2">
            <span className="font-bold">
              {t('subscriptions_citizen_finance_tokens_monthly_payment')}
            </span>{' '}
            {t('subscriptions_citizen_finance_tokens_monthly_payment_amount', {
              var: monthlyPayment,
            })}{' '}
          </li>
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
        onChange={(e) => updateApplication('iban', e.target.value)}
        placeholder={t(
          'subscriptions_citizen_finance_tokens_bank_account_placeholder',
        )}
      />
      <div className="space-y-6">
        <p className="font-bold">
          {t('subscriptions_citizen_finance_tokens_disclaimer')}
        </p>
        <ol className="list-decimal ml-4">
          <li>{t('subscriptions_citizen_finance_tokens_disclaimer_1')}</li>
          <li>
            {t('subscriptions_citizen_finance_tokens_disclaimer_2', {
              var: monthlyPayment,
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

        <Button
          isEnabled={
            isAgreementAccepted === isCitizenApplication &&
            !loading &&
            Boolean(application?.iban) &&
            !isPending &&
            Boolean(totalToPayInFiat) &&
            isValid(application?.iban || '')
          }
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
