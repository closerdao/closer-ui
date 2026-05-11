import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CitizenFinanceTokens from '../../../components/CitizenFinanceTokens';
import { BackButton, Heading, ProgressBar } from '../../../components/ui';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { CitizenshipConfig, GeneralConfig } from '../../../types';
import {
  FinanceApplication,
  FinanceApplicationCreateRequest,
  SubscriptionPlan,
} from '../../../types/subscriptions';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { financeApplicationIdFromCreateResponse } from '../../../utils/financeApplicationIdFromResponse';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';
import PageNotFound from '../../not-found';

const SubscriptionsCitizenApplyPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };
  const citizenshipConfig = getCachedConfig('citizenship') as CitizenshipConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();

  const MIN_TOKENS_TO_FINANCE = 30;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const { isLoading, user } = useAuth();
  const { platform } = usePlatform();
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
    if (user && !isLoading && platform?.financeapplication) {
      (async () => {
        const params = { where: { userId: user._id } };
        const action = await platform.financeapplication.get(params, {
          force: true,
        });
        const financeApplications = financeApplicationListFromGetAction(action);

        const activeApplications = financeApplications.filter(
          (application: FinanceApplication) =>
            ['pending-payment', 'paid'].includes(application.status),
        );

        setActiveApplications(activeApplications);
      })();
    }
  }, [user, isLoading, router, platform?.financeapplication]);

  const goBack = () => {
    router.push('/citizenship/why');
  };

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
        const appId = financeApplicationIdFromCreateResponse(res.data);

        return {
          success: true,
          error: null,
          memoCode: res?.data?.memoCode,
          applicationId: appId,
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
      if (res.applicationId) {
        router.push(`/token/financed/${encodeURIComponent(res.applicationId)}`);
        return;
      }
      router.push(`/token/financed?afterApply=${Date.now()}`);
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
            <div className="bg-yellow-100 py-2 px-3 rounded-md flex items-center justify-between gap-3">
              <span>{t('subscriptions_citizen_active_applications')}</span>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => router.push('/token/financed')}
              >
                {t('token_financed_view_contract')}
              </button>
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

export default SubscriptionsCitizenApplyPage;
