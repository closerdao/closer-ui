import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import PageError from '../../../components/PageError';
import {
  BackButton,
  Heading,
  LinkButton,
  ProgressBar,
} from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { SubscriptionPlan } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };

  generalConfig: GeneralConfig | null;
  error?: string;
}

const SuccessCitizenPage: NextPage<Props> = ({
  subscriptionsConfig,

  generalConfig,
  error,
}) => {
  const t = useTranslations();

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const { isLoading, user, refetchUser } = useAuth();

  const router = useRouter();

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

  const goBack = () => {
    router.push('/token/finance?citizenApplication=true');
  };

  if (error) {
    return <PageError error={error} />;
  }

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
          <section className="space-y-6">
            <p>
              {t('subscriptions_citizen_finance_tokens_payment_details', {
                downPayment,
                closerIban,
                userIbanLast4,
              })}
            </p>

            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-semibold">{t('oasa_beneficiary')}</span>
                <span className="ml-2">{t('oasa_beneficiary_name')}</span>
              </div>
              <div>
                <span className="font-semibold">{t('oasa_iban')}</span>
                <span className="ml-2">{t('oasa_iban_value')}</span>
              </div>
              <div>
                <span className="font-semibold">{t('oasa_bic')}</span>
                <span className="ml-2">{t('oasa_bic_value')}</span>
              </div>
              <div>
                <span className="font-semibold">{t('oasa_address')}</span>
                <div className="">{t('oasa_address_value')}</div>
              </div>
            </div>

            <p>
              {t.rich(
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

          <LinkButton href="/">
            {t('subscriptions_citizen_back_to_homepage')}
          </LinkButton>
        </main>
      </div>
    </>
  );
};

SuccessCitizenPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, generalRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),

      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;
    return {
      subscriptionsConfig,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },

      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default SuccessCitizenPage;
