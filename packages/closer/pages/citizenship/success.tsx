import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { BackButton, Heading, ProgressBar } from '../../components/ui/';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { useOpenFinanceApplications } from '../../hooks/useOpenFinanceApplications';
import { GeneralConfig } from '../../types';
import { AccountingEntitiesConfig, CitizenshipConfig } from '../../types/api';
import { resolveAccountingEntityForProduct } from '../../utils/accountingEntityResolve';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { logMetric } from '../../utils/metrics';
import PageNotFound from '../not-found';

const SuccessCitizenPage: NextPage = () => {
  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;

  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();

  const isCitizenshipEnabled = Boolean(citizenshipConfig?.enabled);
  const citizenTelegramGroupUrl =
    citizenshipConfig?.citizenTelegramGroupUrl?.trim() || '';

  const { isLoading, user, refetchUser } = useAuth();

  const router = useRouter();

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const accountingEntitiesConfig = getCachedConfig(
    'accounting-entities',
  ) as AccountingEntitiesConfig | null;
  const financedTokensEntity = resolveAccountingEntityForProduct(
    'financed-tokens',
    accountingEntitiesConfig?.elements,
  );
  const bankIbanDisplay =
    financedTokensEntity?.iban?.trim() || t('oasa_iban_value');

  const { applications } = useOpenFinanceApplications();
  const contract =
    applications.find((application) => application.isCitizenApplication) ??
    applications[0] ??
    null;

  const downPayment = (contract?.downPaymentAmount ?? 0).toFixed(2);
  const userIbanLast4 = contract?.iban?.replace(/\s/g, '').slice(-4) || '';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      refetchUser();
    }
  }, [isLoading]);

  useEffect(() => {
    if (
      user?.citizenship?.status === 'completed' &&
      user?.roles?.includes('citizen')
    ) {
      void logMetric({
        event: 'citizen-qualified',
        category: 'citizenship',
        value: 'qualified',
      });
    }
  }, [user?.citizenship?.status, user?.roles]);

  const goBack = () => {
    router.push('/citizenship/validation');
  };

  if (!isCitizenshipEnabled) {
    return <PageNotFound error="" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    return <PageNotFound error="" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_citizen_apply_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          {t('subscriptions_citizen_apply_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_CITIZEN_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-8">
          <section className="space-y-6">
            <Heading level={2} className="text-2xl">
              {t('subscriptions_citizen_success_apply_title')}
            </Heading>

            <p className="text-lg">
              {t('subscriptions_citizen_success_apply_intro', {
                platform: PLATFORM_NAME,
              })}
            </p>

            {citizenTelegramGroupUrl && (
              <p className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                {t.rich('subscriptions_citizen_success_telegram', {
                  link: (chunks) => (
                    <a
                      href={citizenTelegramGroupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent underline"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            )}

            <div className="space-y-3">
              <Heading level={3} className="text-lg">
                {t('subscriptions_citizen_success_benefits_title')}
              </Heading>
              <ul className="space-y-3">
                <li>
                  {t.rich('subscriptions_citizen_success_benefit_stay', {
                    link: (chunks) => (
                      <Link href="/stay" className="text-accent underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </li>
                <li>
                  {t.rich('subscriptions_citizen_success_benefit_governance', {
                    link: (chunks) => (
                      <Link
                        href="/governance"
                        className="text-accent underline"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </li>
                <li>
                  {t.rich('subscriptions_citizen_success_benefit_events', {
                    link: (chunks) => (
                      <Link href="/events" className="text-accent underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </li>
                <li>
                  {t.rich('subscriptions_citizen_success_benefit_members', {
                    link: (chunks) => (
                      <Link href="/community" className="text-accent underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </li>
              </ul>
            </div>
          </section>

          {contract && (
            <section className="rounded-lg border border-gray-200 p-4 space-y-3">
              <Heading level={3} className="text-lg">
                {t('subscriptions_citizen_finance_contract_title')}
              </Heading>

              <div className="text-sm space-y-1">
                <p className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    {t('subscriptions_citizen_finance_card_tokens_label')}
                  </span>
                  <span>{contract.tokensToFinance}</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    {t('subscriptions_citizen_finance_tokens_down_payment')}
                  </span>
                  <span>€{downPayment}</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    {t('subscriptions_citizen_finance_tokens_monthly_payment')}
                  </span>
                  <span>
                    €{(contract.monthlyPaymentAmount ?? 0).toFixed(2)}
                  </span>
                </p>
              </div>

              {contract.status === 'pending-payment' && (
                <p className="text-sm text-gray-500">
                  {t('subscriptions_citizen_finance_tokens_payment_details', {
                    downPayment,
                    closerIban: bankIbanDisplay,
                    userIbanLast4,
                  })}
                </p>
              )}

              <Link
                href={`/token/financed/${encodeURIComponent(contract._id)}`}
                className="inline-block text-sm text-accent underline"
              >
                {t('member_menu_financed_view')}
              </Link>
            </section>
          )}
        </main>
      </div>
    </>
  );
};

export default SuccessCitizenPage;
