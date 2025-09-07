import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenApply from '../../../components/CitizenApply';
import CitizenFinanceTokens from '../../../components/CitizenFinanceTokens';
import PageError from '../../../components/PageError';
import { BackButton, Heading, ProgressBar } from '../../../components/ui/';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import { CitizenshipConfig, GeneralConfig } from '../../../types';
import { SubscriptionPlan } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  citizenshipConfig: CitizenshipConfig | null;
  generalConfig: GeneralConfig | null;
  error?: string;
}

const SubscriptionsCitizenApplyPage: NextPage<Props> = ({
  subscriptionsConfig,
  citizenshipConfig,
  generalConfig,
  error,
}) => {
  const t = useTranslations();

  const MIN_TOKENS_TO_FINANCE = 30;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const { isLoading, user } = useAuth();
  const router = useRouter();
  const { intent } = router.query;

  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>({
    iban: '',
    tokensToFinance: MIN_TOKENS_TO_FINANCE,
  });

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const { balanceTotal } = useContext(WalletState);

  const owns30Tokens = balanceTotal >= MIN_TOKENS_TO_FINANCE;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [user, isLoading]);

  const goBack = () => {
    router.push('/subscriptions/citizen/select-flow');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const updateApplication = (key: string, value: any) => {
    setApplication((prev: any) => ({ ...prev, [key]: value }));
  };

  const applyCitizen = async () => {
    try {
      setLoading(true);
      if (intent === 'apply') {
        // user meets all criteria for becoming a citizen
        try {
          const res = await api.post('/subscription/citizen/apply', {
            owns30Tokens,
            intent,
          });

          if (res.data.status === 'success') {
            router.push('/subscriptions/citizen/success?intent=apply');
            return;
          }
        } catch (error) {
          console.error('error with citizen application:', error);
        }
      } else {
        // user wants to finance tokens
        try {
          const res = await api.post('/subscription/citizen/apply', {
            owns30Tokens,
            intent,
            iban: application?.iban,
            tokensToFinance: application?.tokensToFinance,
            totalToPayInFiat: application?.totalToPayInFiat,
          });

          if (res.data.status === 'success') {
            router.push('/subscriptions/citizen/success?intent=finance');
            return;
          }
        } catch (error) {
          console.error('error with citizen application:', error);
        }
      }
    } catch (error) {
      console.error('error with citizen application:', error);
    } finally {
      setLoading(false);
    }
  };

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
          {intent === 'apply' ? (
            <CitizenApply
              isAgreementAccepted={isAgreementAccepted}
              setIsAgreementAccepted={setIsAgreementAccepted}
              applyCitizen={applyCitizen}
              loading={loading}
            />
          ) : (
            <CitizenFinanceTokens
              application={application}
              updateApplication={updateApplication}
              tokenPriceModifierPercent={
                citizenshipConfig?.tokenPriceModifierPercent || 0
              }
              isAgreementAccepted={isAgreementAccepted}
              setIsAgreementAccepted={setIsAgreementAccepted}
              applyCitizen={applyCitizen}
              loading={loading}
            />
          )}
        </main>
      </div>
    </>
  );
};

SubscriptionsCitizenApplyPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [subscriptionsRes, generalRes, citizenshipRes, messages] =
      await Promise.all([
        api.get('/config/subscriptions').catch(() => {
          return null;
        }),

        api.get('/config/general').catch(() => {
          return null;
        }),
        api.get('/config/citizenship').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;
    const citizenshipConfig = citizenshipRes?.data?.results?.value;
    return {
      subscriptionsConfig,
      citizenshipConfig,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      citizenshipConfig: null,
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default SubscriptionsCitizenApplyPage;
