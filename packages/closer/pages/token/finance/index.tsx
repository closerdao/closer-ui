import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenFinanceTokens from '../../../components/CitizenFinanceTokens';
import PageError from '../../../components/PageError';
import { BackButton, Heading, ProgressBar } from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import { CitizenshipConfig, GeneralConfig } from '../../../types';
import {
  FinanceApplication,
  FinanceApplicationCreateRequest,
  SubscriptionPlan,
} from '../../../types/subscriptions';
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

  const { citizenApplication } = router.query;

  const isCitizenApplication = citizenApplication === 'true';

  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [isTokenTermsAccepted, setIsTokenTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<
    Partial<FinanceApplicationCreateRequest>
  >({
    iban: '',
    tokensToFinance: MIN_TOKENS_TO_FINANCE,
    why: user?.citizenship?.why || '',
  });

  const [activeApplications, setActiveApplications] = useState<
    FinanceApplication[]
  >([]);

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const { balanceTotal } = useContext(WalletState);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
    if (user && !isLoading) {
      (async () => {
        const financeApplicationRes = await api.get('/financeApplication', {
          params: {
            where: {
              userId: user?._id,
            },
          },
        });
        const financeApplications = financeApplicationRes?.data?.results;

        const activeApplications = financeApplications.filter(
          (application: FinanceApplication) =>
            ['pending-payment', 'paid'].includes(application.status),
        );

        if (financeApplications) {
          setActiveApplications(activeApplications);
        }
      })();
    }
  }, [user, isLoading]);

  const goBack = () => {
    router.push('/citizenship/why');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const updateApplication = (
    key: keyof FinanceApplicationCreateRequest,
    value: any,
  ) => {
    setApplication((prev) => ({ ...prev, [key]: value }));
  };

  const financedTokenApply = async (isCitizenApplication: boolean) => {
    try {
      setLoading(true);
      const res = await api.post('/token/finance-application', {
        tokensToFinance: application.tokensToFinance!,
        totalToPayInFiat: application.totalToPayInFiat!,
        iban: application.iban!,
        isCitizenApplication,
        why: application?.why,
      } as FinanceApplicationCreateRequest);

      if (res.data.status === 'success') {
        return {
          success: true,
          error: null,
        };
      }
    } catch (error) {
      console.error('error with citizen application:', error);
      return {
        success: false,
        error,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const res = await financedTokenApply(isCitizenApplication);
    if (res?.success) {
      router.push(
        isCitizenApplication
          ? '/token/finance/success-citizen'
          : '/token/finance/success',
      );
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
          {isCitizenApplication
            ? t('subscriptions_citizen_apply_title')
            : t('subscriptions_citizen_finance_tokens')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_CITIZEN_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-8">
          {activeApplications.length > 0 ? (
            <div className="bg-yellow-100 py-2 px-3 rounded-md">
              {t('subscriptions_citizen_active_applications')}
            </div>
          ) : (
            <CitizenFinanceTokens
              isCitizenApplication={isCitizenApplication}
              application={application}
              updateApplication={updateApplication}
              tokenPriceModifierPercent={
                citizenshipConfig?.tokenPriceModifierPercent || 0
              }
              isAgreementAccepted={isAgreementAccepted}
              setIsAgreementAccepted={setIsAgreementAccepted}
              isTokenTermsAccepted={isTokenTermsAccepted}
              setIsTokenTermsAccepted={setIsTokenTermsAccepted}
              handleNext={handleNext}
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
