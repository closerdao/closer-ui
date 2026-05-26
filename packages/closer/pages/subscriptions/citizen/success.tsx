import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import {
  BackButton,
  Heading,
  LinkButton,
  ProgressBar,
} from '../../../components/ui/';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { SubscriptionPlan } from '../../../types/subscriptions';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { logMetric } from '../../../utils/metrics';
import PageNotFound from '../../not-found';

const SuccessCitizenPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };

  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const { isLoading, user, refetchUser } = useAuth();
  const isMember = user?.roles?.includes('member');

  const router = useRouter();
  const { intent } = router.query;

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const closerIban = process.env.NEXT_PUBLIC_CLOSER_IBAN;

  if (!closerIban) {
    throw new Error('closerIban is not set');
  }

  const downPayment =
    ((Number(user?.citizenship?.totalToPayInFiat) ?? 0) * 0.1).toFixed(2) || 0;

  const userIbanLast4 =
    user?.citizenship?.iban?.replace(/\s/g, '').slice(-4) || '';

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
    if (intent === 'finance' && user?.citizenship?.tokensToFinance) {
      const n = user.citizenship.tokensToFinance;
      void logMetric({
        event: 'financed-token-purchase-completed',
        category: 'citizenship',
        value: 'finance-complete', point: n,
      });
      if (user.citizenship.tokensToFinance >= 30) {
        void logMetric({
          event: 'citizen-bought-30-tokens',
          category: 'citizenship',
          value: 'milestone-30', point: n,
        });
      }
    }
  }, [intent, user?.citizenship?.tokensToFinance]);

  useEffect(() => {
    if (user?.citizenship?.status === 'completed' && user?.roles?.includes('citizen')) {
      void logMetric({
        event: 'citizen-qualified',
        category: 'citizenship',
        value: 'qualified',
      });
    }
  }, [user?.citizenship?.status, user?.roles]);

  const goBack = () => {
    router.push('/subscriptions/citizen/validation');
  };

  if (!areSubscriptionsEnabled) {
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
          {intent === 'apply' && (
            <section className="space-y-6">
              <Heading level={2} className="border-b pb-2 mb-6 text-xl">
                {t('subscriptions_citizen_welcome')}
              </Heading>

              <p>{t('subscriptions_citizen_confirmation')}</p>
            </section>
          )}
          {intent === 'finance' && (
            <section className="space-y-6">
              <Heading level={2} className="border-b pb-2 mb-6 text-xl">
                {t('subscriptions_citizen_welcome')}
              </Heading>

              <p>
                {isMember
                  ? t('subscriptions_citizen_you_are_on_your_way_finance')
                  : t('subscriptions_citizen_you_are_on_your_way')}
              </p>
              <p>
                {t('subscriptions_citizen_finance_tokens_payment_details', {
                  downPayment,
                  closerIban,
                  userIbanLast4,
                })}
              </p>

              <p>
                {isMember
                  ? t.rich(
                      'subscriptions_citizen_finance_tokens_after_application_finance',
                      {
                        link: (chunks) => (
                          <a
                            href="mailto:space@traditionaldreamfactory.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'underline' }}
                          >
                            {chunks}
                          </a>
                        ),
                      },
                    )
                  : t.rich(
                      'subscriptions_citizen_finance_tokens_after_application',
                      {
                        link: (chunks) => (
                          <a
                            href="mailto:space@traditionaldreamfactory.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'underline' }}
                          >
                            {chunks}
                          </a>
                        ),
                      },
                    )}
              </p>
            </section>
          )}

          <LinkButton href="/">
            {t('subscriptions_citizen_back_to_homepage')}
          </LinkButton>
        </main>
      </div>
    </>
  );
};

export default SuccessCitizenPage;
