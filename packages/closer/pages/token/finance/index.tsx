import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CitizenFinanceTokens from '../../../components/CitizenFinanceTokens';
import FinanceApplicationSummaryCard from '../../../components/FinanceApplicationSummaryCard';
import {
  BackButton,
  Heading,
  ProgressBar,
  Spinner,
} from '../../../components/ui';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig, TokenConfig } from '../../../types';
import {
  FinanceApplication,
  FinanceApplicationCreateRequest,
  SubscriptionPlan,
} from '../../../types/subscriptions';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { financeApplicationIdFromCreateResponse } from '../../../utils/financeApplicationIdFromResponse';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';
import {
  buildFinanceQuote,
  getDownPaymentPercent,
  getFinancingAprPercent,
  getFinancingDurations,
  getMaxFinancingMonths,
  getMinMonthlyPayment,
} from '../../../utils/tokenFinancing';
import PageNotFound from '../../not-found';

const parseTokensQuery = (
  tokens: string | string[] | undefined,
): number | null => {
  const raw = Array.isArray(tokens) ? tokens[0] : tokens;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const SubscriptionsCitizenApplyPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };
  const tokenConfig = getCachedConfig('token') as TokenConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();

  const durations = getFinancingDurations(tokenConfig);
  const maxFinancingMonths = getMaxFinancingMonths(tokenConfig);
  const downPaymentPercent = getDownPaymentPercent(tokenConfig);
  const aprPercent = getFinancingAprPercent(tokenConfig);
  const minMonthlyPayment = getMinMonthlyPayment(tokenConfig);

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const { isLoading, user } = useAuth();
  const { platform } = usePlatform();
  const router = useRouter();

  const { citizenApplication, tokens } = router.query;

  const isCitizenApplication = citizenApplication === 'true';

  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [isTokenTermsAccepted, setIsTokenTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<
    Partial<FinanceApplicationCreateRequest>
  >({
    iban: '',
    tokensToFinance: parseTokensQuery(tokens) ?? 1,
    durationInMonths: durations[0] || maxFinancingMonths,
    why: user?.citizenship?.why || '',
  });

  const [applications, setApplications] = useState<FinanceApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  // On a hard reload / direct link, router.query is empty on the first render,
  // so the ?tokens=N value is only resolved inside the effect below. The buy
  // widget seeds its own state (and its debounced price lookup) once at mount
  // and never re-reads the prop, so we must delay mounting the form until the
  // query has been applied — otherwise it mounts priced for 1 token while
  // application.tokensToFinance ends up N, producing an underpriced contract.
  const [isTokensQueryResolved, setIsTokensQueryResolved] = useState(false);

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const parsed = parseTokensQuery(tokens);
    if (parsed !== null) {
      setApplication((prev) => {
        if (prev.tokensToFinance === parsed) {
          return prev;
        }
        return { ...prev, tokensToFinance: parsed };
      });
    }
    // Latch (never reverts) so a later in-widget amount change does not
    // unmount the form.
    setIsTokensQueryResolved(true);
  }, [router.isReady, tokens]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    const finance = platform?.financeapplication;
    if (!finance) {
      setIsLoadingApplications(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setIsLoadingApplications(true);
      try {
        const params = {
          where: { userId: user._id },
          limit: 50,
          sort_by: '-created' as const,
        };
        const action = await finance.get(params, { force: true });
        const rows = financeApplicationListFromGetAction(action);
        if (!cancelled) {
          setApplications(rows);
        }
      } catch (err) {
        console.error('error loading finance applications:', err);
        if (!cancelled) {
          setApplications([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingApplications(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, isLoading, platform?.financeapplication]);

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
    setApplication((prev) => {
      if (prev[key] === value) {
        return prev;
      }
      return { ...prev, [key]: value };
    });
  };

  const financedTokenApply = async (isCitizenApplication: boolean) => {
    try {
      const durationInMonths = Math.min(
        application.durationInMonths || durations[0] || maxFinancingMonths,
        maxFinancingMonths,
      );
      const quote = buildFinanceQuote({
        totalToPayInFiat: application.totalToPayInFiat || 0,
        downPaymentPercent,
        durationInMonths,
        aprPercent,
        minMonthlyPayment,
      });
      const res = await api.post('/token/finance-application', {
        tokensToFinance: application.tokensToFinance!,
        totalToPayInFiat: application.totalToPayInFiat!,
        iban: application.iban!,
        durationInMonths,
        monthlyPaymentAmount: quote.monthlyPaymentAmount,
        downPaymentAmount: quote.downPaymentAmount,
        aprPercent: application.aprPercent ?? aprPercent,
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
    }
  };

  // Older API versions answer the create call without echoing the new record,
  // so fall back to reading back the newest contract for this user.
  const fetchLatestApplicationId = async () => {
    const finance = platform?.financeapplication;
    if (!finance || !user?._id) {
      return '';
    }
    try {
      const action = await finance.get(
        {
          where: { userId: user._id },
          limit: 1,
          sort_by: '-created' as const,
        },
        { force: true },
      );
      const rows = financeApplicationListFromGetAction(action);
      return rows[0]?._id || '';
    } catch (err) {
      console.error('error loading the new finance application:', err);
      return '';
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      const res = await financedTokenApply(isCitizenApplication);
      if (!res?.success) {
        return;
      }
      const newApplicationId =
        res.applicationId || (await fetchLatestApplicationId());
      if (newApplicationId) {
        router.push(`/token/financed/${encodeURIComponent(newApplicationId)}`);
        return;
      }
      router.push(`/token/financed?afterApply=${Date.now()}`);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    return <PageNotFound error="" />;
  }

  const financeForm = (
    <CitizenFinanceTokens
      isCitizenApplication={isCitizenApplication}
      application={application}
      updateApplication={updateApplication}
      downPaymentPercent={downPaymentPercent}
      maxFinancingMonths={maxFinancingMonths}
      aprPercent={aprPercent}
      minMonthlyPayment={minMonthlyPayment}
      isAgreementAccepted={isAgreementAccepted}
      setIsAgreementAccepted={setIsAgreementAccepted}
      isTokenTermsAccepted={isTokenTermsAccepted}
      setIsTokenTermsAccepted={setIsTokenTermsAccepted}
      handleNext={handleNext}
      loading={loading}
    />
  );

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

        <main className="pt-14 pb-24 flex flex-col gap-12">
          {router.isReady && isTokensQueryResolved && financeForm}

          {isLoadingApplications ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : (
            applications.length > 0 && (
              <div className="flex flex-col gap-4">
                <Heading level={3} className="mb-0">
                  {t('token_finance_your_contracts_title')}
                </Heading>
                <p className="text-sm text-gray-600">
                  {t('token_finance_your_contracts_subtitle')}
                </p>
                {applications.map((financeApplication) => (
                  <FinanceApplicationSummaryCard
                    key={financeApplication._id}
                    application={financeApplication}
                  />
                ))}
              </div>
            )
          )}
        </main>
      </div>
    </>
  );
};

export default SubscriptionsCitizenApplyPage;
